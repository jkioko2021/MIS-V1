import { Router, type Request, type Response, type NextFunction } from "express";
import { Readable } from "node:stream";
import { ZodError, z } from "zod";
import { ListIntermediariesResponse, GetIntermediaryOptionsResponse,
  RequestIntermediaryUploadBody, RequestIntermediaryUploadResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne, withTransaction } from "../lib/postgres";
import { agentCode, agentSelect, canManageIntermediaries, detail, IntermediaryError,
  saveMaster, performAction } from "../lib/intermediary";
import { ObjectStorageService } from "../lib/document-storage";
import { coreImportConfiguration, pullCoreAgents, importCoreRows } from "../lib/intermediary-core-import";

const router = Router();
const storage = new ObjectStorageService();
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response) => {
    try { await fn(req, res); }
    catch (err) {
      if (err instanceof IntermediaryError) { res.status(err.status).json({ error: err.message }); return; }
      if (err instanceof ZodError) { res.status(400).json({ error: err.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") }); return; }
      if ((err as { code?: string }).code === "23505") { res.status(409).json({ error: "This agent code, core reference or licence already exists. Existing MIS details were not overwritten." }); return; }
      req.log.error({ err }, "Intermediary operation failed");
      res.status(500).json({ error: "Unable to complete the agent operation. Please try again." });
    }
  };
router.use("/intermediary", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!await canManageIntermediaries(req.user!.profileId)) {
      res.status(403).json({ error: "National Sales Admin access is required." }); return;
    }
    next();
  } catch (err) { next(err); }
});
router.get("/intermediary/options", wrap(async (req, res) => {
  const rows = await query(`SELECT agent_type,agent_status,unit_code,branch_code,region_code,gi_code FROM crm.tbl_mis_sales_intermediary`);
  const values = (key: string, defaults: string[] = []) =>
    [...new Set([...defaults, ...rows.map(r => r[key]).filter((s): s is string => typeof s === "string" && !!s.trim())])].sort();
  res.json(GetIntermediaryOptionsResponse.parse({ username: req.user!.username,
    ...coreImportConfiguration(), agent_types: values("agent_type", ["IN_HOUSE", "DIRECT AGENT", "INDEPENDENT", "BROKER", "UNCLASSIFIED"]),
    statuses: values("agent_status", ["DRAFT", "ACTIVE", "SUSPENDED", "TERMINATED"]),
    units: values("unit_code"), branches: values("branch_code"), regions: values("region_code"), gi_codes: values("gi_code") }));
}));
router.get("/intermediary/agents", wrap(async (req, res) => {
  const p = z.object({ search: z.string().max(200).optional(), status: z.string().max(50).optional(),
    agent_type: z.string().max(50).optional(), registration_status: z.enum(["PENDING", "COMPLETED"]).optional(),
    page: z.coerce.number().int().min(1).max(100000).default(1) }).parse(req.query);
  const params = [`%${p.search?.trim() ?? ""}%`, p.status || null, p.agent_type || null, p.registration_status || null];
  const where = `(agent_name ILIKE $1 OR agent_code ILIKE $1 OR hrmis_code ILIKE $1 OR email ILIKE $1)
    AND ($2::text IS NULL OR agent_status=$2) AND ($3::text IS NULL OR agent_type=$3)
    AND ($4::text IS NULL OR registration_status=$4)`;
  const count = await queryOne<{ total: number }>(`SELECT count(*)::int AS total FROM crm.tbl_mis_sales_intermediary WHERE ${where}`, params);
  const items = await query(`SELECT ${agentSelect} FROM crm.tbl_mis_sales_intermediary WHERE ${where}
    ORDER BY agent_name,agent_code LIMIT 25 OFFSET $5`, [...params, (p.page - 1) * 25]);
  res.json(ListIntermediariesResponse.parse({ items, total: count!.total, page: p.page, page_size: 25 }));
}));
router.post("/intermediary/agents", wrap(async (req, res) => {
  res.status(405).json({ error: "Register agents in the core system and use Import. Manual MIS agent creation is not allowed." });
}));
let importInFlight = false;
router.post("/intermediary/import", wrap(async (req, res) => {
  if (importInFlight) throw new IntermediaryError(409, "An agent import is already running. Please wait.");
  importInFlight = true;
  try { res.json(await importCoreRows(await pullCoreAgents(req.user!.username), req.user!.username)); }
  finally { importInFlight = false; }
}));
router.get("/intermediary/agents/:code", wrap(async (req, res) => {
  res.json(await detail(agentCode.parse(req.params.code)));
}));
router.patch("/intermediary/agents/:code", wrap(async (req, res) => {
  res.json(await saveMaster(req.body, req.user!.username, agentCode.parse(req.params.code)));
}));
router.post("/intermediary/agents/:code/actions", wrap(async (req, res) => {
  res.json(await performAction(agentCode.parse(req.params.code), req.body, req.user!.username));
}));
router.post("/intermediary/agents/:code/uploads", wrap(async (req, res) => {
  const code = agentCode.parse(req.params.code);
  const data = RequestIntermediaryUploadBody.parse(req.body);
  if (!data.title.trim()) throw new IntermediaryError(400, "Document title is required.");
  if (!await queryOne("SELECT 1 FROM crm.tbl_mis_sales_intermediary WHERE agent_code=$1", [code]))
    throw new IntermediaryError(404, "Agent not found.");
  const url = await storage.getObjectEntityUploadURL(req.user!.username, data.file_size, data.content_type);
  const objectPath = storage.normalizeObjectEntityPath(url);
  const r = await queryOne<{ document_id: number }>(`INSERT INTO crm.intermediary_documents
    (agent_code,title,file_name,content_type,file_size,object_path,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING document_id`,
    [code, data.title.trim(), data.file_name, data.content_type, data.file_size, objectPath, req.user!.username]);
  res.json(RequestIntermediaryUploadResponse.parse({ document_id: r!.document_id, upload_url: url }));
}));
router.post("/intermediary/agents/:code/documents/:id/confirm", wrap(async (req, res) => {
  const code = agentCode.parse(req.params.code), id = z.coerce.number().int().positive().parse(req.params.id);
  const doc = await queryOne<{ object_path: string; file_size: number; confirmed: boolean }>(
    "SELECT * FROM crm.intermediary_documents WHERE agent_code=$1 AND document_id=$2 AND uploaded_by=$3",
    [code, id, req.user!.username]);
  if (!doc) throw new IntermediaryError(404, "Your upload ticket was not found.");
  let size: number;
  try {
    const file = await storage.getObjectEntityFile(doc.object_path);
    const [metadata] = await file.getMetadata();
    size = Number(metadata.size);
  } catch { throw new IntermediaryError(400, "The uploaded file is not available yet. Complete the upload first."); }
  if (size !== doc.file_size) throw new IntermediaryError(400, "Uploaded file size does not match the upload ticket.");
  await withTransaction(async client => {
    const r = await client.query("UPDATE crm.intermediary_documents SET confirmed=true WHERE document_id=$1 AND NOT confirmed RETURNING title", [id]);
    if (r.rowCount) {
      await client.query(`INSERT INTO crm.intermediary_events(agent_code,action,actor,notes) VALUES($1,'DOCUMENT_UPLOADED',$2,$3)`,
        [code, req.user!.username, r.rows[0].title]);
      await client.query("UPDATE crm.tbl_mis_sales_intermediary SET version=version+1 WHERE agent_code=$1", [code]);
    }
  });
  res.json(await detail(code));
}));
router.get("/intermediary/agents/:code/documents/:id/download", wrap(async (req, res) => {
  const code = agentCode.parse(req.params.code), id = z.coerce.number().int().positive().parse(req.params.id);
  const doc = await queryOne<{ object_path: string; file_name: string }>(
    "SELECT object_path,file_name FROM crm.intermediary_documents WHERE agent_code=$1 AND document_id=$2 AND confirmed", [code, id]);
  if (!doc) throw new IntermediaryError(404, "Document not found.");
  const response = await storage.downloadObject(await storage.getObjectEntityFile(doc.object_path), 0);
  res.status(response.status);
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`);
  if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
  else res.end();
}));
export default router;

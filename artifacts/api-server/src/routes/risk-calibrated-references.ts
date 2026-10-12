import { Router } from "express";
import { z } from "zod";
import { query, txQuery, withTransaction } from "../lib/postgres";
import { history, RiskError, riskFailure, type RiskActor } from "../lib/risk-register";

// These identifiers are exclusively server-owned; never interpolate request identifiers.
const catalogs = {
  exposure: { table: "risk.exposure_bands", key: "risk_type||':'||to_char(minimum,'FM990.00')", label: "level" },
  impact: { table: "risk.impact_factors", key: "impact_code", label: "impact_factor" },
  likelihood: { table: "risk.likelihood_factors", key: "likelihood_code", label: "likelihood_factor" },
  reasons: { table: "crm.aml_risk_reasons", key: "reason_code", label: "reason_name" },
} as const;
type Catalog = keyof typeof catalogs;
const numeric = (max: number, places: number) => z.number().min(0).max(max)
  .refine(v => Math.abs(v * 10 ** places - Math.round(v * 10 ** places)) < 1e-7,
    `Use at most ${places} decimal places.`);
const inputSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  label: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).nullable().optional(),
  rating: z.number().optional(),
  risk_type: z.enum(["I", "R"]).optional(),
  minimum: numeric(100, 2).optional(), maximum: numeric(100, 2).optional(),
  rate_label: z.string().trim().min(1).max(50).optional(),
  is_active: z.boolean().optional(), expected: z.record(z.string(), z.unknown()).optional(),
}).strict();
type Input = z.infer<typeof inputSchema>;
function projection(catalog: Catalog) {
  const c = catalogs[catalog];
  return `${c.key} AS code,${c.label} AS label,is_active,NULL::text AS depart_code,
    ${catalog === "exposure" ? "description" : catalog === "likelihood" ? "qualification_criteria" : "NULL::text"} AS description,
    ${catalog === "impact" ? "rate_factor::float8" : catalog === "likelihood" ? "rating::float8" : "NULL::float8"} AS rating,
    ${catalog === "exposure" ? "risk_type" : "NULL::text"} AS risk_type,
    ${catalog === "exposure" ? "minimum::float8" : "NULL::float8"} AS minimum,
    ${catalog === "exposure" ? "maximum::float8" : "NULL::float8"} AS maximum,
    ${catalog === "impact" ? "rate" : "NULL::text"} AS rate_label`;
}
function validate(catalog: Catalog, code: string, input: Input) {
  if (catalog === "exposure") {
    if (!input.risk_type || input.minimum === undefined || input.maximum === undefined ||
      input.maximum < input.minimum || !input.description || input.label.length > 20)
      throw new RiskError(400, "Exposure requires type, bounds, a level up to 20 characters, and treatment guidance.");
    if (code !== `${input.risk_type}:${input.minimum.toFixed(2)}`)
      throw new RiskError(400, "The exposure code is its immutable type and minimum (for example I:41.00).");
  } else {
    if (!/^[A-Za-z0-9_-]+$/.test(code) || code.length > (catalog === "reasons" ? 3 : 20))
      throw new RiskError(400, "Use a valid stable reference code.");
    if (input.risk_type !== undefined || input.minimum !== undefined || input.maximum !== undefined)
      throw new RiskError(400, "Only exposure accepts a risk type and bounds.");
  }
  if (catalog === "impact" || catalog === "likelihood") {
    if (input.label.length > 50 || input.rating === undefined || input.rating <= 0)
      throw new RiskError(400, "A name up to 50 characters and a positive rating are required.");
    numeric(catalog === "impact" ? 100 : 1, catalog === "impact" ? 2 : 6).parse(input.rating);
    if (catalog === "impact" && !input.rate_label) throw new RiskError(400, "The impact rate label is required.");
    if (catalog === "likelihood" && !input.description) throw new RiskError(400, "Likelihood qualitative criteria are required.");
  } else if (input.rating !== undefined) throw new RiskError(400, "This reference does not accept a rating.");
  if (catalog !== "impact" && input.rate_label !== undefined) throw new RiskError(400, "Only impact accepts a rate label.");
  if ((catalog === "impact" || catalog === "reasons") && input.description != null)
    throw new RiskError(400, "This reference does not accept a description.");
}
function failure(req: Parameters<typeof riskFailure>[0], res: Parameters<typeof riskFailure>[1], err: unknown) {
  if (err && typeof err === "object" && "code" in err && err.code === "23505")
    err = new RiskError(409, "This reference code already exists, including retired records.");
  riskFailure(req, res, err);
}
export const calibratedReferencesRouter = Router();
for (const method of ["get", "post", "patch"] as const) {
  calibratedReferencesRouter[method](method === "patch" ? "/:catalog/:code" : "/:catalog", async (req, res, next) => {
    if (!Object.prototype.hasOwnProperty.call(catalogs, req.params.catalog)) { next(); return; }
    const catalog = req.params.catalog as Catalog, c = catalogs[catalog];
    try {
      if (method === "get") {
        const data = await query(`SELECT ${projection(catalog)} FROM ${c.table}
          ORDER BY is_active DESC,${catalog === "exposure" ? "risk_type,minimum" : c.key}`);
        res.json({ ok: true, data }); return;
      }
      const input = inputSchema.parse(req.body);
      if (method === "post" && (input.is_active !== undefined || input.expected !== undefined))
        throw new RiskError(400, "New references are active; expected snapshots are only for modifications.");
      const code = method === "post" ? input.code : (req.params as { code?: string }).code;
      if (!code || (method === "patch" && (input.is_active === undefined || input.code !== undefined)))
        throw new RiskError(400, "A stable code and, when modifying, an explicit active status are required.");
      validate(catalog, code, input);
      const actor = res.locals.riskActor as RiskActor;
      const data = await withTransaction(async client => {
        await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [`risk-reference:${catalog}`]);
        const identity = catalog === "exposure" ? [input.risk_type, input.minimum] : [code];
        const where = catalog === "exposure" ? "risk_type=$1 AND minimum=$2" : `${c.key}=$1`;
        const [before] = await txQuery(client, `SELECT ${projection(catalog)} FROM ${c.table} WHERE ${where} FOR UPDATE`, identity);
        if (method === "post") {
          const duplicate = await txQuery(client, `SELECT 1 FROM ${c.table} WHERE LOWER(${c.key})=LOWER($1)`, [code]);
          if (duplicate.length) throw new RiskError(409, "This stable code already exists, including retired records.");
        } else {
          if (!before) throw new RiskError(404, "Reference was not found.");
          if (input.expected && Object.entries(input.expected).some(([key, value]) => before[key] !== value))
            throw new RiskError(409, "This reference changed. Refresh the list and reopen it before saving.");
        }
        if (catalog === "exposure" && input.is_active !== false) {
          const overlap = await txQuery(client, `SELECT 1 FROM risk.exposure_bands
            WHERE risk_type=$1 AND is_active AND minimum<=$3 AND maximum>=$2
              AND NOT(minimum=$2 AND $4::boolean)`, [input.risk_type, input.minimum, input.maximum, method === "patch"]);
          if (overlap.length) throw new RiskError(409, "Active exposure bands of the same type cannot overlap.");
        }
        const fields: string[] = [c.label, "is_active"];
        const values: unknown[] = [input.label, method === "post" ? true : input.is_active];
        const add = (field: string, value: unknown) => { fields.push(field); values.push(value); };
        if (catalog === "exposure") { add("maximum", input.maximum); add("description", input.description); }
        if (catalog === "impact") { add("rate_factor", input.rating); add("rate", input.rate_label); }
        if (catalog === "likelihood") { add("rating", input.rating); add("qualification_criteria", input.description); }
        let after;
        if (method === "post") {
          if (catalog === "exposure") { add("risk_type", input.risk_type); add("minimum", input.minimum); }
          else add(c.key, code);
          [after] = await txQuery(client, `INSERT INTO ${c.table}(${fields.join(",")})
            VALUES(${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING ${projection(catalog)}`, values);
        } else {
          const sets = fields.map((field, i) => `${field}=$${identity.length + i + 1}`);
          [after] = await txQuery(client, `UPDATE ${c.table} SET ${sets.join(",")} WHERE ${where}
            RETURNING ${projection(catalog)}`, [...identity, ...values]);
        }
        await history(client, null, null, null, method === "post" ? "REFERENCE_CREATE" : "REFERENCE_UPDATE",
          actor.username, `${method === "post" ? "Created" : "Modified"} ${catalog} reference ${code}`, { catalog, before: before ?? null, after });
        return after;
      });
      res.status(method === "post" ? 201 : 200).json({ ok: true, data });
    } catch (err) { failure(req, res, err); }
  });
}

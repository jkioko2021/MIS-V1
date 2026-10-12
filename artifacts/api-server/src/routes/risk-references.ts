import { Router } from "express";
import { z } from "zod";
import { query, txQuery, withTransaction } from "../lib/postgres";
import { history, RiskError, riskFailure, type RiskActor } from "../lib/risk-register";

// Mounted beneath risk-administration's management-only middleware.
export const riskReferencesRouter = Router();
const catalogs = {
  "action-statuses": { table: "action_statuses", key: "status_code", label: "status_name", maxCode: 20, maxLabel: 50 },
  categories: { table: "categories", key: "category_code", label: "category_name", maxCode: 20, maxLabel: 100 },
  "control-effectiveness": { table: "control_effectiveness", key: "eff_factor", label: "eff_factor", maxCode: 50, maxLabel: 50 },
  objectives: { table: "objectives", key: "obj_code", label: "obj_name", maxCode: 20, maxLabel: 300 },
} as const;
type Catalog = keyof typeof catalogs;
const catalogSchema = z.enum(["action-statuses", "categories", "control-effectiveness", "objectives"]);
const description = z.string().trim().max(5000).nullable().optional();
const rating = z.number().min(0).max(1).refine(v => Math.abs(v * 1e6 - Math.round(v * 1e6)) < 1e-7,
  "Use at most six decimal places.").optional();
const department = z.string().trim().min(1).max(20).optional();
const common = { label: z.string().trim().min(1).max(1000), description, rating, depart_code: department };
const createInput = z.object({ ...common, code: z.string().trim().min(1).max(50) }).strict();
const expectedReference = z.object({
  code: z.string(), label: z.string(), description: z.string().nullable(),
  rating: z.number().nullable(), depart_code: z.string().nullable(), is_active: z.boolean(),
}).strict();
const updateInput = z.object({ ...common, is_active: z.boolean(), expected: expectedReference.optional() }).strict();

function projection(catalog: Catalog) {
  const c = catalogs[catalog];
  return `${c.key} AS code,${c.label} AS label,is_active,
    ${catalog === "action-statuses" ? "description" : catalog === "control-effectiveness" ? "qual_criteria" : "NULL::text"} AS description,
    ${catalog === "control-effectiveness" ? "rating::float8" : "NULL::float8"} AS rating,
    ${catalog === "objectives" ? "depart_code" : "NULL::text"} AS depart_code`;
}
function validate(catalog: Catalog, input: z.infer<typeof updateInput> | z.infer<typeof createInput>, code: string) {
  const c = catalogs[catalog];
  if (code.length > c.maxCode || input.label.length > c.maxLabel)
    throw new RiskError(400, `Code must be at most ${c.maxCode} characters and name at most ${c.maxLabel}.`);
  if (catalog === "control-effectiveness") {
    if (input.label !== code) throw new RiskError(400, "The effectiveness factor name is its stable code and cannot change.");
    if (input.rating === undefined || !input.description?.trim())
      throw new RiskError(400, "A fractional rating and qualitative criteria are required.");
  } else if (input.rating !== undefined) throw new RiskError(400, "Only effectiveness factors accept a rating.");
  if (catalog === "objectives") {
    if (!input.depart_code) throw new RiskError(400, "Choose the objective's department.");
  } else if (input.depart_code !== undefined) throw new RiskError(400, "Only objectives accept a department.");
  if (catalog !== "action-statuses" && catalog !== "control-effectiveness" && input.description != null)
    throw new RiskError(400, "This reference list does not accept a description.");
}
function conflict(err: unknown) {
  if (err && typeof err === "object" && "code" in err && err.code === "23505")
    return new RiskError(409, "This code or status name already exists, including retired choices.");
  return err;
}

riskReferencesRouter.get("/:catalog", async (req, res) => {
  try {
    const catalog = catalogSchema.parse(req.params.catalog), c = catalogs[catalog];
    const data = await query(`SELECT ${projection(catalog)} FROM risk.${c.table}
      ORDER BY is_active DESC,${catalog === "objectives" ? "depart_code," : ""}${c.key}`);
    res.json({ ok: true, data });
  } catch (err) { riskFailure(req, res, err); }
});
riskReferencesRouter.post("/:catalog", async (req, res) => {
  try {
    const catalog = catalogSchema.parse(req.params.catalog), c = catalogs[catalog];
    const input = createInput.parse(req.body);
    validate(catalog, input, input.code);
    // Existing legacy identifiers are accepted on updates; new identifiers must be readable and safe.
    if (catalog !== "control-effectiveness" && !/^[A-Za-z0-9_-]+$/.test(input.code))
      throw new RiskError(400, "Use letters, numbers, hyphens or underscores for a new code.");
    const actor = res.locals.riskActor as RiskActor;
    const data = await withTransaction(async client => {
      // Serializes case-insensitive uniqueness checks; SQL identifiers come only from the catalog allowlist.
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [`risk-reference:${catalog}`]);
      const existing = await txQuery(client, `SELECT ${c.key} FROM risk.${c.table}
        WHERE LOWER(${c.key})=LOWER($1)${catalog === "objectives" ? " AND depart_code=$2" : ""}`,
      catalog === "objectives" ? [input.code, input.depart_code] : [input.code]);
      if (existing.length) throw new RiskError(409, "This stable code already exists, including retired choices.");
      if (catalog === "action-statuses") {
        const duplicate = await txQuery(client, "SELECT status_code FROM risk.action_statuses WHERE LOWER(status_name)=LOWER($1)", [input.label]);
        if (duplicate.length) throw new RiskError(409, "This status name already exists, including retired choices.");
        if (input.label.toLowerCase() === "closed" && input.label !== "Closed")
          throw new RiskError(400, "The completed-action status must use the exact name Closed.");
      }
      if (catalog === "objectives") {
        const active = await txQuery(client, "SELECT depart_code FROM risk.departments WHERE depart_code=$1 AND is_active FOR SHARE", [input.depart_code]);
        if (!active.length) throw new RiskError(400, "Choose an active department.");
      }
      const fields: string[] = [c.key], values: unknown[] = [input.code];
      if (c.label !== c.key) { fields.push(c.label); values.push(input.label); }
      if (catalog === "action-statuses") { fields.push("description"); values.push(input.description || null); }
      if (catalog === "control-effectiveness") {
        fields.push("qual_criteria", "rating"); values.push(input.description, input.rating);
      }
      if (catalog === "objectives") { fields.push("depart_code"); values.push(input.depart_code); }
      const [after] = await txQuery(client, `INSERT INTO risk.${c.table}(${fields.join(",")})
        VALUES(${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING ${projection(catalog)}`, values);
      await history(client, null, input.depart_code ?? null, null, "REFERENCE_CREATE", actor.username,
        `Created ${catalog} reference ${input.code}`, { catalog, before: null, after });
      return after;
    });
    res.status(201).json({ ok: true, data });
  } catch (err) { riskFailure(req, res, conflict(err)); }
});
riskReferencesRouter.patch("/:catalog/:code", async (req, res) => {
  try {
    const catalog = catalogSchema.parse(req.params.catalog), c = catalogs[catalog];
    const code = z.string().min(1).max(c.maxCode).parse(req.params.code);
    const input = updateInput.parse(req.body);
    validate(catalog, input, code);
    const actor = res.locals.riskActor as RiskActor;
    const data = await withTransaction(async client => {
      const identity: unknown[] = catalog === "objectives" ? [code, input.depart_code] : [code];
      const where = `${c.key}=$1${catalog === "objectives" ? " AND depart_code=$2" : ""}`;
      const [before] = await txQuery(client, `SELECT ${projection(catalog)} FROM risk.${c.table} WHERE ${where} FOR UPDATE`, identity);
      if (!before) throw new RiskError(404, "Reference was not found.");
      if (input.expected && Object.entries(input.expected).some(([key, value]) => before[key] !== value))
        throw new RiskError(409, "This reference changed. Refresh the list and reopen it before saving.");
      // Status names, like factor names, are identifiers in historical records. Never rewrite them.
      if (catalog === "action-statuses" && input.label !== before.label)
        throw new RiskError(400, "Status names are historical identifiers and cannot change. Retire this status and add a new one.");
      if (catalog === "objectives" && input.is_active && !before.is_active) {
        const active = await txQuery(client, "SELECT depart_code FROM risk.departments WHERE depart_code=$1 AND is_active FOR SHARE", [input.depart_code]);
        if (!active.length) throw new RiskError(400, "The department must be active before reactivating this objective.");
      }
      const values = [...identity];
      const sets: string[] = [];
      const set = (field: string, value: unknown) => { values.push(value); sets.push(`${field}=$${values.length}`); };
      if (catalog === "categories" || catalog === "objectives") set(c.label, input.label);
      if (catalog === "action-statuses") set("description", input.description || null);
      if (catalog === "control-effectiveness") { set("qual_criteria", input.description); set("rating", input.rating); }
      set("is_active", input.is_active);
      const [after] = await txQuery(client, `UPDATE risk.${c.table} SET ${sets.join(",")} WHERE ${where}
        RETURNING ${projection(catalog)}`, values);
      const action = before.is_active === input.is_active ? "REFERENCE_UPDATE"
        : input.is_active ? "REFERENCE_REACTIVATE" : "REFERENCE_RETIRE";
      await history(client, null, input.depart_code ?? null, null, action, actor.username,
        `${action} ${catalog} reference ${code}`, { catalog, before, after });
      return after;
    });
    res.json({ ok: true, data });
  } catch (err) { riskFailure(req, res, conflict(err)); }
});

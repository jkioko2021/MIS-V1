import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { query, txQuery, withTransaction } from "../lib/postgres";
import { canManage, history, privateRiskResponses, requireRiskActor, RiskError, riskFailure, type RiskActor } from "../lib/risk-register";

const router = Router();
router.use("/risk-administration", privateRiskResponses, requireAuth, requireRiskActor, (_req, res, next) => {
  if (!canManage(res.locals.riskActor as RiskActor)) {
    res.status(403).json({ ok: false, error: "Risk Management or administrator access is required." });
    return;
  }
  next();
});
const name = z.string().trim().min(1, "Department name is required.").max(100);
const code = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens or underscores for the department code.");
router.get("/risk-administration/departments", async (req, res) => {
  try {
    const data = await query("SELECT depart_code,depart_name,is_active FROM risk.departments ORDER BY depart_name,depart_code");
    res.json({ ok: true, data });
  } catch (err) { riskFailure(req, res, err); }
});
router.post("/risk-administration/departments", async (req, res) => {
  try {
    const input = z.object({ depart_code: code.transform(v => v.toUpperCase()), depart_name: name }).strict().parse(req.body);
    const actor = res.locals.riskActor as RiskActor;
    const data = await withTransaction(async client => {
      await txQuery(client, "SELECT pg_advisory_xact_lock(hashtext($1))", [`risk-department:${input.depart_code}`]);
      const existing = await txQuery(client, "SELECT depart_code FROM risk.departments WHERE UPPER(depart_code)=$1", [input.depart_code]);
      if (existing.length) throw new RiskError(409, "This department code already exists.");
      const [row] = await txQuery(client, `INSERT INTO risk.departments(depart_code,depart_name)
        VALUES($1,$2) RETURNING depart_code,depart_name,is_active`, [input.depart_code, input.depart_name]);
      await history(client, null, input.depart_code, null, "DEPARTMENT_CREATE", actor.username, "Risk department added", row);
      return row;
    });
    res.status(201).json({ ok: true, data });
  } catch (err) { riskFailure(req, res, err); }
});
router.patch("/risk-administration/departments/:code", async (req, res) => {
  try {
    const input = z.object({ depart_name: name }).strict().parse(req.body);
    // Historical department codes can use legacy characters; only new codes are restricted.
    const id = z.string().min(1).max(20).parse(req.params.code);
    const actor = res.locals.riskActor as RiskActor;
    const data = await withTransaction(async client => {
      const [before] = await txQuery(client, "SELECT depart_code,depart_name,is_active FROM risk.departments WHERE depart_code=$1 FOR UPDATE", [id]);
      if (!before) throw new RiskError(404, "Department was not found.");
      const [after] = await txQuery(client, `UPDATE risk.departments SET depart_name=$2 WHERE depart_code=$1
        RETURNING depart_code,depart_name,is_active`, [id, input.depart_name]);
      await history(client, null, id, null, "DEPARTMENT_UPDATE", actor.username, "Risk department name updated", { before, after });
      return after;
    });
    res.json({ ok: true, data });
  } catch (err) { riskFailure(req, res, err); }
});
export default router;

import { Router } from "express";
import { requireAuth } from "../lib/auth-middleware";
import { query, queryOne } from "../lib/postgres";
import { logger } from "../lib/logger";

const router = Router();
router.use("/notifications", requireAuth);
router.get("/notifications", async (req, res) => {
  try {
    const [employee] = await query<{ username: string }>(`SELECT username FROM crm.employees
      WHERE employee_id=$1 AND activated AND approved AND NOT employee_locked AND NOT is_deleted`, [req.user!.sub]);
    if (!employee) { res.status(403).json({ ok: false, error: "Active staff access required." }); return; }
    const rows = await query(`SELECT notification_id,file_no,title,message,created_at,read_at,email_status
      FROM crm.business_notifications WHERE recipient_username=$1 ORDER BY created_at DESC LIMIT 100`, [employee.username]);
    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) AS count FROM crm.business_notifications
      WHERE recipient_username=$1 AND read_at IS NULL`, [employee.username]);
    res.json({ ok: true, data: rows, unreadCount: Number(count?.count ?? 0) });
  } catch (err) {
    logger.error({ err }, "Staff notifications failed");
    res.status(500).json({ ok: false, error: "Unable to load notifications." });
  }
});
router.post("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ ok: false, error: "Invalid notification." }); return; }
    const row = await queryOne(`UPDATE crm.business_notifications n SET read_at=COALESCE(read_at,NOW())
      FROM crm.employees e WHERE n.notification_id=$1 AND n.recipient_username=e.username
      AND e.employee_id=$2 AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted
      RETURNING n.notification_id`, [id, req.user!.sub]);
    if (!row) { res.status(404).json({ ok: false, error: "Notification not found." }); return; }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Notification acknowledgement failed");
    res.status(500).json({ ok: false, error: "Unable to acknowledge notification." });
  }
});
export default router;

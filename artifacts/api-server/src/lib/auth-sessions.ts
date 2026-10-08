import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { queryOne } from "./postgres";

export interface SessionEmployee {
  employee_id: number;
  username: string;
  employee_name: string;
  profile_id: number;
  password_hash: string;
  session_version: number;
  profile_version: number;
}

/** Revalidate the credential snapshot so changes during login cannot mint a session. */
export async function createSession(emp: SessionEmployee, client?: PoolClient): Promise<string> {
  const id = randomUUID();
  const sql = `INSERT INTO crm.auth_sessions
    (session_id, employee_id, employee_version, profile_id, profile_version)
    SELECT $1, e.employee_id, e.session_version, e.profile_id, p.session_version
    FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE e.employee_id=$2 AND e.password_hash=$3 AND e.session_version=$4
      AND e.profile_id=$5 AND p.session_version=$6
      AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active
    RETURNING session_id`;
  const params = [id, emp.employee_id, emp.password_hash, emp.session_version, emp.profile_id, emp.profile_version];
  const row = client
    ? (await client.query(sql, params)).rows[0]
    : await queryOne(sql, params);
  if (!row) throw new Error("Account changed during sign-in. Please sign in again.");
  return id;
}

export async function sessionIsActive(sessionId: string, employeeId: number, profileId: number) {
  return Boolean(await queryOne(`SELECT s.session_id FROM crm.auth_sessions s
    JOIN crm.employees e ON e.employee_id=s.employee_id
    JOIN crm.profiles p ON p.profile_id=e.profile_id
    WHERE s.session_id=$1 AND s.employee_id=$2 AND s.profile_id=$3
      AND s.revoked_at IS NULL AND s.expires_at > NOW()
      AND s.employee_version=e.session_version AND s.profile_id=e.profile_id
      AND s.profile_version=p.session_version
      AND e.activated AND e.approved AND NOT e.employee_locked AND NOT e.is_deleted AND p.is_active`,
  [sessionId, employeeId, profileId]));
}

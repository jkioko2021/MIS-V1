import type { PoolClient } from "pg";
import type { LoginEmployee } from "./login-otp";

export class LoginAccountError extends Error {
  readonly status = 403;
  constructor() { super("Account is no longer eligible for sign-in. Please sign in again or contact your administrator."); }
}

/** Hold account/profile eligibility stable until the caller's transaction commits. */
export async function lockLoginAccount(client: PoolClient, authenticated: LoginEmployee): Promise<LoginEmployee> {
  const { rows: [fresh] } = await client.query<LoginEmployee & {
    activated: boolean; approved: boolean; employee_locked: boolean; is_deleted: boolean; profile_active: boolean;
  }>(`SELECT e.*,p.profile_name,p.is_active AS profile_active,p.session_version AS profile_version
      FROM crm.employees e JOIN crm.profiles p ON p.profile_id=e.profile_id
      WHERE e.employee_id=$1 FOR UPDATE OF e FOR SHARE OF p`, [authenticated.employee_id]);
  if (!fresh || !fresh.activated || !fresh.approved || fresh.employee_locked
    || fresh.is_deleted || !fresh.profile_active || fresh.password_hash !== authenticated.password_hash
    || fresh.session_version !== authenticated.session_version || fresh.profile_id !== authenticated.profile_id
    || fresh.profile_version !== authenticated.profile_version) {
    throw new LoginAccountError();
  }
  return fresh;
}

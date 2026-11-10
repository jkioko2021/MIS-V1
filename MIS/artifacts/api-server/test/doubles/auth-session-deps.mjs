export async function queryOne() {
  const state = globalThis.__authSessionState;
  if (state.fail) throw new Error("Synthetic database outage");
  return state.active ? { session_id: "present" } : null;
}
export const logger = { error() {}, warn() {} };

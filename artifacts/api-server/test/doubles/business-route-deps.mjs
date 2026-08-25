function state() {
  const current = globalThis.__businessRouteTestState;
  if (!current) throw new Error("Business route test state was not configured.");
  return current;
}

export async function query(sql, params) {
  return state().query(sql, params);
}

export async function queryOne(sql, params) {
  return state().queryOne(sql, params);
}

export async function withTransaction(fn) {
  return state().withTransaction(fn);
}

export async function txQuery(client, sql, params) {
  return state().txQuery(client, sql, params);
}

function allow(_req, _res, next) {
  next();
}

export const requireAuth = (req, _res, next) => {
  req.user = { sub: 1, username: "business-entry" };
  next();
};
export const requireBusinessTrackingAccess = allow;
export const requireBpoForwardAccess = allow;
export const requireBpoReviewAccess = allow;
export const requireBusinessDeleteAccess = allow;
export const requireBusinessFileAccess = allow;

export const logger = {
  error() {},
  warn() {},
};
function state() {
  const current = globalThis.__misRefundRouteTestState;
  if (!current) throw new Error("MIS refund route test state was not configured.");
  return current;
}

export async function query(statement, params = []) {
  state().queries.push({ statement, params });
  return [];
}

export async function queryOne(statement, params = []) {
  state().queries.push({ statement, params });
  return { total: 0 };
}

export function requireAuth(req, _res, next) {
  req.user = state().user;
  next();
}

export const requireBusinessTrackingAccess = (_req, _res, next) => next();
export const setBpoReviewAccess = (_req, _res, next) => next();
export const requireBpoQueueAccess = (_req, _res, next) => next();
export const requireBpoAllocatedAccess = (_req, res, next) => {
  // Match the authorization context provided by the real allocated middleware.
  res.locals.canAccessMembershipAllocated = state().canAccessMembershipAllocated ?? true;
  next();
};
export const requireAllocatedFileReadAccess = (_req, _res, next) => next();
export const requireBusinessFileAccess = (_req, _res, next) => next();

export const logger = {
  error() {},
};

export async function getAllocatedRefundLedger(allocatedTo, isSuperAdmin) {
  state().ledgerCalls.push({ allocatedTo, isSuperAdmin });
  return state().ledger;
}
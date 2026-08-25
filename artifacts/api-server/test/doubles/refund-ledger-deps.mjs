function state() {
  const current = globalThis.__refundLedgerTestState;
  if (!current) throw new Error("Refund ledger test state was not configured.");
  return current;
}

export const sql = {
  VarChar(length) {
    return { type: "varchar", length };
  },
};

export async function getPool(database) {
  state().database = database;
  return {
    request() {
      return {
        input(name, type, value) {
          state().inputs.push({ name, type, value });
          return this;
        },
        async query(statement) {
          state().statement = statement;
          if (state().error) throw state().error;
          return { recordset: state().rows };
        },
      };
    },
  };
}

export const logger = {
  warn() {},
};
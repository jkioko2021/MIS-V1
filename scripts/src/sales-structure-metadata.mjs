import { readFile } from "node:fs/promises";

export async function applySalesStructureMetadata(client) {
  await client.query(await readFile(new URL("../../lib/db/migrations/0055_sales_structure_setup.sql", import.meta.url), "utf8"));
}

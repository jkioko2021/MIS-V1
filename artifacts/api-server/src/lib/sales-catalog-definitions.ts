type FieldType = "text" | "email" | "date" | "decimal" | "integer" | "flag";
export type CatalogField = {
  key: string; label: string; type: FieldType; required: boolean;
  read_only: boolean; reference: string | null; max_length: number;
};
export type CatalogDefinition = {
  key: string; title: string; source_table: string; code_field: string;
  name_field: string; manager: boolean; fields: CatalogField[];
};
const labels: Record<string, string> = {
  NSM_CODE: "National Sales Code", H_TAX: "Withholding Tax", HRMIS_CODE: "Payroll Code",
  MIS_EMP_CODE: "MIS Employee Code", IS_BDM: "Is BDM", EARN_RETAINER: "Earn Retainer",
  RET_EFF_UPTO: "Retainer Effective Until", RETAINER_AMT: "Retainer Amount",
  UNIT_MGR_ID: "Unit Manager", REGION_MGR_ID: "Regional Manager",
  BRANCH_MGR_ID: "Branch Manager", CORD_MGR_ID: "GI Coordinator",
};
const types: Record<string, FieldType> = {
  EMAIL: "email", VALID_FROM: "date", VALID_TO: "date", JOIN_DATE: "date", RET_EFF_UPTO: "date",
  H_TAX: "decimal", RETAINER_AMT: "decimal", YEAR: "integer",
  ACTIVE: "flag", APPROVED: "flag", IS_BDM: "flag", EARN_RETAINER: "flag",
};
function define(key: string, title: string, suffix: string, code: string, name: string,
  fields: string, references: Record<string, string> = {}, required: string[] = [], manager = false): CatalogDefinition {
  return {
    key, title, source_table: `DB_MASTER_AGENTS.dbo.TBL_MIS_SALES_${suffix}`,
    code_field: code, name_field: name, manager,
    fields: fields.split(" ").map(field => ({
      key: field, label: key === "gi-units" && field === "REGION_CODE" ? "GI Branch (REGION_CODE)"
        : key === "gi-units" && field === "CORD_MGR_ID" ? "GI Unit Manager (CORD_MGR_ID)"
        : labels[field] ?? field.toLowerCase().split("_").map(s => s[0].toUpperCase() + s.slice(1)).join(" "),
      type: types[field] ?? "text", required: [code, name, ...required].includes(field),
      read_only: ["ID", "ACTIVE", "APPROVED_BY"].includes(field),
      reference: references[field] ?? (field === "NSM_CODE" ? "nationals" : null),
      max_length: field === "UM_NAME" || field === "GI_UM_NAME" ? 150
        : ["SPECIALITY"].includes(field) ? 5 : field === "MIS_NO" ? 20 : 50,
    })),
  };
}
export const salesCatalogDefinitions: CatalogDefinition[] = [
  define("sales-units", "Sales Units", "UNITS", "UNIT_CODE", "UNIT_NAME",
    "UNIT_CODE UNIT_NAME UNIT_TYPE BRANCH_CODE REGION_CODE UNIT_MGR_ID ACTIVE NSM_CODE YEAR SPECIALITY VALID_FROM VALID_TO MIS_NO GI_UNIT",
    { BRANCH_CODE: "sales-branches", REGION_CODE: "sales-regions", UNIT_MGR_ID: "unit-managers", GI_UNIT: "gi-units" },
    ["BRANCH_CODE", "REGION_CODE"]),
  define("unit-managers", "Unit Managers", "UM", "UM_ID", "UM_NAME",
    "ID UM_ID UM_NAME UNIT_CODE EMAIL HRMIS_CODE ACTIVE APPROVED APPROVED_BY H_TAX MIS_EMP_CODE IS_BDM VALID_FROM VALID_TO",
    { UNIT_CODE: "sales-units" }, [], true),
  define("sales-branches", "Sales Branches", "BRANCH", "BRANCH_CODE", "BRANCH_NAME",
    "ID BRANCH_CODE BRANCH_NAME BRANCH_TYPE BRANCH_MGR_ID REGION_CODE NSM_CODE SPECIALITY GI_BRANCH",
    { BRANCH_MGR_ID: "branch-managers", REGION_CODE: "sales-regions", GI_BRANCH: "gi-branches" }, ["REGION_CODE"]),
  define("regional-managers", "Regional Managers", "RM", "RM_ID", "RM_NAME",
    "ID RM_ID RM_CODE RM_NAME RM_TYPE R_CODE EMAIL HRMIS_CODE ACTIVE MIS_EMP_CODE NSM_CODE VALID_FROM VALID_TO TITLE",
    { R_CODE: "sales-regions" }, [], true),
  define("sales-regions", "Sales Regions", "REGION", "REGION_CODE", "REGION_NAME",
    "ID REGION_CODE REGION_NAME REGION_MGR_ID NSM_CODE VALID_FROM VALID_TO",
    { REGION_MGR_ID: "regional-managers" }),
  define("gi-unit-managers", "GI Unit Managers", "GI_UM", "GI_UM_ID", "GI_UM_NAME",
    "ID GI_UM_ID GI_UM_CODE GI_UM_NAME GI_UNIT_CODE EMAIL HRMIS_CODE ACTIVE MIS_EMP_CODE EARN_RETAINER NSM_CODE VALID_FROM VALID_TO JOIN_DATE RET_EFF_UPTO RETAINER_AMT",
    { GI_UNIT_CODE: "gi-units" }, [], true),
  define("gi-units", "GI Units", "GI_UNITS", "GI_UNIT_CODE", "GI_UNIT_NAME",
    "ID GI_UNIT_CODE GI_UNIT_NAME BRANCH_CODE REGION_CODE CORD_MGR_ID ACTIVE VALID_FROM VALID_TO",
    { BRANCH_CODE: "sales-branches", REGION_CODE: "gi-branches", CORD_MGR_ID: "gi-unit-managers" },
    ["BRANCH_CODE", "REGION_CODE"]),
  define("gi-branches", "GI Branches", "GI_BRANCH", "CORD_CODE", "CORD_NAME",
    "ID CORD_CODE CORD_NAME CORD_TYPE CORD_MGR_ID BR_CODE VALID_FROM VALID_TO",
    { CORD_MGR_ID: "gi-coordinators", BR_CODE: "sales-branches" }, ["BR_CODE"]),
  define("gi-coordinators", "GI Coordinators", "GI_CORDINATOR", "GI_ID", "GI_CORD_NAME",
    "ID GI_ID GI_CORD_NAME GI_CORD_TYPE GI_CORD_CODE BR_CODE EMAIL HRMIS_CODE ACTIVE MIS_EMP_CODE VALID_FROM VALID_TO",
    { BR_CODE: "sales-branches" }, [], true),
];

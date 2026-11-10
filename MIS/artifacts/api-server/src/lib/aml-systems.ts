// Verified in the user-designated updated legacy archive:
// Business_Tracking_Allocated.aspx.vb:828 passes "eOx" to TRACKING_AML_RISKS.
// Business_allocated_Non_MED.aspx.vb:681 passes "AIMS" to the same procedure.
// Keep this catalog explicit; never infer a system from policy/invoice prefixes.
export const AML_ORIGINATING_SYSTEMS = ["eOx", "AIMS"] as const;

export function amlSystemValidation(input: {
  reqName: string; riskRate: string; riskReason: string; system: unknown;
}): string | null {
  const supportsClassification = /aml\s*risk|risk\s*rating/.test(input.reqName.toLowerCase())
    || input.reqName.trim().toLowerCase() === "aml report";
  const hasClassification = !!(input.riskRate || input.riskReason);
  const hasSystem = input.system != null && input.system !== "";
  const systemValue = typeof input.system === "string" ? input.system.trim() : null;
  if ((hasClassification || hasSystem) && !supportsClassification) {
    return "AML classification metadata is only available on AML risk documents or AML Report.";
  }
  if (hasSystem && !hasClassification) {
    return "Select a risk rate and rating reason before selecting an originating system.";
  }
  if (hasClassification && (
    systemValue === null
    || !AML_ORIGINATING_SYSTEMS.some(system => system === systemValue)
  )) {
    return "Select an approved AML originating system (eOx or AIMS).";
  }
  return null;
}

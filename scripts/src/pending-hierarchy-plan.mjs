// Match exact uploaded manager references through previously verified account provenance.
// Never match a person by name alone or create users/designations.
const normalize = value => {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "NULL" ? "" : text;
};
export function planPendingHierarchy(sources, links, identities, users) {
  const userById = new Map(users.map(user => [user.employee_id, user]));
  const identityByKey = new Map(identities.map(identity => [identity.identity_key, identity]));
  const linkBySource = new Map(links.map(link => [link.source_record_id, link]));
  return sources.filter(row => ["sales-regions","sales-branches","sales-units"].includes(row.catalog)).map(row => {
    const base = { source_reference_id: row.id, source_row_sha256: row.row_sha256,
      manager_employee_id: null, manager_sources: [], manager_link_status: "UNRESOLVED",
      branch_approved: false, resolution_note: "" };
    if (row.catalog === "sales-branches") return { ...base, manager_link_status: "NOT_REQUIRED",
      branch_approved: true, resolution_note: "Approved for setup with no manager. Operational hierarchy remains pending." };
    const managerCode = normalize(row.data[row.catalog === "sales-regions" ? "REGION_MGR_ID" : "UNIT_MGR_ID"]);
    const catalog = row.catalog === "sales-regions" ? "regional-managers" : "unit-managers";
    const matches = sources.filter(source => source.catalog === catalog && managerCode && normalize(source.code) === managerCode);
    if (!matches.length) return { ...base, resolution_note: managerCode
      ? "The uploaded manager reference was not found among the manager records."
      : "No manager reference was supplied in the uploaded record." };
    const proofs = matches.map(source => {
      const link = linkBySource.get(source.id);
      const identity = link && link.source_row_sha256 === source.row_sha256 && identityByKey.get(link.identity_key);
      return { source, employeeId: identity?.employee_id };
    });
    if (proofs.some(proof => !proof.employeeId)) return { ...base,
      resolution_note: "At least one matching manager record has no verified MIS account link. Identity review is required." };
    const employeeIds = [...new Set(proofs.map(proof => proof.employeeId))];
    if (employeeIds.length !== 1) return { ...base,
      resolution_note: "The uploaded manager reference matches different MIS accounts. Identity review is required." };
    const user = userById.get(employeeIds[0]);
    if (!user || user.is_deleted || !user.activated || !user.approved || user.employee_locked
      || normalize(user.department) !== "SALES" || normalize(user.profile_name) !== "SALES MANAGER" || !user.profile_active)
      return { ...base, resolution_note: "The matched account must be active, approved, unlocked and have the Sales Manager profile in Sales." };
    return { ...base, manager_employee_id: user.employee_id, manager_link_status: "MATCHED",
      manager_sources: proofs.map(({source}) => ({ source_record_id: source.id, row_sha256: source.row_sha256 })),
      resolution_note: "Linked to the verified uploaded manager account. Parent setup and manager enrollment remain separate." };
  });
}

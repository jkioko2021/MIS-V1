const CATEGORIES = { "unit-managers": "UNIT", "regional-managers": "REGION", "gi-unit-managers": "UNIT" };
const clean = value => {
  const text = String(value ?? "").trim();
  return text.toUpperCase() === "NULL" ? "" : text;
};
const dateValid = value => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
export function planManagerEnrollmentDrafts(sources, links, identities, users) {
  const usersById = new Map(users.map(user => [user.employee_id,user]));
  const identitiesByKey = new Map(identities.map(identity => [identity.identity_key,identity]));
  const linksById = new Map(links.map(link => [link.source_record_id,link]));
  const groups = new Map(), held = [];
  for (const source of sources.filter(source => CATEGORIES[source.catalog])) {
    const link = linksById.get(source.id);
    const identity = link?.source_row_sha256 === source.row_sha256 && identitiesByKey.get(link?.identity_key);
    const user = identity && usersById.get(identity.employee_id);
    if (!user || user.is_deleted || clean(user.department).toLowerCase() !== "sales"
      || clean(user.profile_name).toLowerCase() !== "sales manager" || !user.profile_active
      || !/^[A-Za-z0-9_-]{1,50}$/.test(clean(user.emp_code))) {
      held.push({source_reference_id:source.id,reason:"A verified Sales Manager MIS account with a usable code is required."});
      continue;
    }
    const level = CATEGORIES[source.catalog], key = `${user.employee_id}:${level}`;
    if (!groups.has(key)) groups.set(key,{user,level,sources:[]});
    groups.get(key).sources.push(source);
  }
  const enrollments = [...groups.values()].map(group => {
    const conflicts = [], invalid = [];
    const take = (key, valid = () => true) => {
      const values = [...new Set(group.sources.map(source => clean(source.data[key])).filter(Boolean))];
      if (values.length > 1) { conflicts.push(key); return ""; }
      if (values[0] && !valid(values[0])) { invalid.push(key); return ""; }
      return values[0] ?? "";
    };
    const details = {
      code:clean(group.user.emp_code),name:clean(group.user.employee_name),email:clean(group.user.email),
      hrmis_code:take("HRMIS_CODE",value=>value.length<=50),
      mobile_no:take("MOBILE_NO",value=>value.length<=50),
      h_tax:take("H_TAX",value=>/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,6})?$/.test(value)),
      mis_emp_code:clean(group.user.emp_code),
      valid_from:take("VALID_FROM",dateValid),valid_to:take("VALID_TO",dateValid),
    };
    if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      invalid.push("EMAIL");details.email="";
    }
    if (details.valid_from && details.valid_to && details.valid_to<details.valid_from) {
      invalid.push("VALID_FROM","VALID_TO");details.valid_from="";details.valid_to="";
    }
    return { employee_id:group.user.employee_id,level:group.level,is_active:false,details,
      sources:group.sources.map(source=>({source_reference_id:source.id,source_row_sha256:source.row_sha256,
        source_domain:source.catalog==="gi-unit-managers"?"GI":"MEDICAL"})),conflicts,invalid };
  });
  return {enrollments,held};
}

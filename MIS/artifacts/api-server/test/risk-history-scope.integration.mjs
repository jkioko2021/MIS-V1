// Read-only checks against a private risk-register fixture with closed source registers.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
if(process.env.NODE_ENV==="production") throw new Error("Development only.");
const f=JSON.parse(await readFile(process.argv[2],"utf8"));
assert.match(f.prefix,/^RTEST_[a-f0-9]{8}$/);
async function api(path,label,status=200) {
  const response=await fetch(`http://localhost:80/api/risk-register${path}`,{
    headers:{Cookie:`mis_session=${f.cookies[label]}`}});
  const body=await response.json();
  assert.equal(response.status,status,`${path}: ${body.error??response.status}`);
  return body.data;
}
for(const label of ["champion","owner"]) {
  const options=await api("/options",label);
  assert.equal(options.actor.can_manage,false);
  const allowed=new Set([...options.actor.champion_departments,...options.actor.owner_departments]);
  assert(allowed.size>0);
  const registers=await api("/closed-registers",label);
  assert(registers.length>0,"Previous-period registers must be available without selecting the current period.");
  assert(registers.every(row=>allowed.has(row.depart_code)));
  assert(registers.some(row=>row.period_id===f.period));
  const events=await api("/history",label);
  assert(events.every(row=>allowed.has(row.depart_code)));
  for(const register of registers) {
    const rows=await api(`/historical-risks?depart_code=${register.depart_code}&period_id=${register.period_id}`,label);
    assert(rows.records.every(row=>allowed.has(row.depart_code) && !row.can_edit && row.workflow_status==="CLOSED"));
    if(rows.records.length) {
      const detail=await api(`/records/${rows.records[0].risk_code}`,label);
      assert(allowed.has(detail.risk.depart_code));assert.equal(detail.risk.can_edit,false);
    }
  }
  const foreign=f.departments.find(code=>!allowed.has(code));
  if(foreign) {
    await api(`/closed-registers?depart_code=${foreign}`,label,403);
    await api(`/history?depart_code=${foreign}`,label,403);
    await api(`/historical-risks?depart_code=${foreign}&period_id=${f.period}`,label,403);
    const other=await api(`/historical-risks?depart_code=${foreign}&period_id=${f.period}`,"admin");
    if(other.records.length) await api(`/records/${other.records[0].risk_code}`,label,403);
  }
}
const owner=await api("/options","owner");
assert(owner.actor.owner_departments.includes(f.departments[0]) && owner.actor.owner_departments.includes(f.departments[1]));
assert.deepEqual(await api("/closed-registers","unmapped"),[]);
assert.deepEqual(await api("/history","unmapped"),[]);
await api(`/historical-risks?depart_code=${f.department}&period_id=${f.period}`,"unmapped",403);
console.log("PASS: Champion/Owner departmental history, multi-department owner access, previous periods, read-only details, forged-department/detail rejection and unmapped-user isolation.");

// Isolated structural fixture shared by agent regression tests, not application seed data.
export async function createOrganisationFixture(db, label) {
  if(process.env.NODE_ENV==="production"||process.env.REPLIT_DEPLOYMENT)throw Error("Development tests only");
  const prefix=label.toUpperCase();
  const employee=(await db.query(`INSERT INTO crm.employees
    (username,employee_name,emp_code,password_hash,profile_id,activated,approved,department)
    VALUES($1,$1,$1,'not-a-login-hash',3,true,true,'Sales') RETURNING employee_id`,[`${prefix}_STRUCTURE`])).rows[0].employee_id;
  const managerIds=[],nodeIds=[],codes=[];
  for(const [index,level] of ["NATIONAL","REGION","BRANCH","UNIT"].entries()){
    const manager=(await db.query(`INSERT INTO crm.sales_manager_enrollments
      (employee_id,level,is_active,created_by,updated_by) VALUES($1,$2,true,$3,$3) RETURNING id`,[employee,level,prefix])).rows[0].id;
    managerIds.push(manager);
    const code=`${prefix}_${level[0]}`;codes.push(code);
    nodeIds.push((await db.query(`INSERT INTO crm.sales_structure_nodes
      (code,name,level,parent_id,manager_id,is_active,created_by,updated_by)
      VALUES($1,$1,$2,$3,$4,true,$5,$5) RETURNING id`,[code,level,nodeIds.at(-1)??null,manager,prefix])).rows[0].id);
  }
  return {employee,managerIds,nodeIds,codes,unitId:nodeIds[3]};
}

// Exact synthetic IDs only. The exclusive DDL lock is held until COMMIT; failure restores the trigger.
export async function removeOrganisationFixture(db, fixture, agentCodes=[]) {
  if(process.env.NODE_ENV==="production"||process.env.REPLIT_DEPLOYMENT)throw Error("Development tests only");
  await db.query("BEGIN");
  try {
    await db.query("SELECT pg_advisory_xact_lock(82026,55)");
    const owner=(await db.query("SELECT password_hash FROM crm.employees WHERE employee_id=$1",[fixture.employee])).rows[0];
    if(owner?.password_hash!=="not-a-login-hash")throw Error("Not an isolated organisation fixture");
    if(agentCodes.length){
      await db.query("ALTER TABLE crm.agent_unit_assignments DISABLE TRIGGER immutable_agent_assignment");
      await db.query("DELETE FROM crm.agent_unit_assignments WHERE agent_code=ANY($1::text[]) AND to_unit_id=ANY($2::int[])",[agentCodes,fixture.nodeIds]);
      await db.query("ALTER TABLE crm.agent_unit_assignments ENABLE TRIGGER immutable_agent_assignment");
      for(const table of ["intermediary_events","intermediary_documents","intermediary_licences","intermediary_directors"])
        await db.query(`DELETE FROM crm.${table} WHERE agent_code=ANY($1::text[])`,[agentCodes]);
      await db.query("DELETE FROM crm.tbl_mis_sales_intermediary WHERE agent_code=ANY($1::text[]) AND organisation_unit_id=ANY($2::int[])",[agentCodes,fixture.nodeIds]);
    }
    for(const id of [...fixture.nodeIds].reverse())await db.query("DELETE FROM crm.sales_structure_nodes WHERE id=$1",[id]);
    await db.query("DELETE FROM crm.sales_setup_events WHERE (entity_type='NODE' AND entity_id=ANY($1::int[])) OR (entity_type='MANAGER' AND entity_id=ANY($2::int[]))",[fixture.nodeIds,fixture.managerIds]);
    await db.query("DELETE FROM crm.sales_manager_enrollments WHERE id=ANY($1::int[]) AND employee_id=$2",[fixture.managerIds,fixture.employee]);
    await db.query("DELETE FROM crm.employees WHERE employee_id=$1",[fixture.employee]);
    await db.query("COMMIT");
  }catch(err){await db.query("ROLLBACK");throw err;}
}

// Real PostgreSQL + real HTTP routes. Own temporary cluster, never DATABASE_URL
// inherited from the workspace. Run with PostgreSQL tools on PATH (WSL/Linux).
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapDatabase, provisionAdmin, assertLocalDatabase, validateAdminPassword } from "./local-database.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(root,"artifacts/api-server/package.json"));
const { Client } = require("pg");
const bcrypt = require("bcrypt");
const exec = promisify(execFile);
const scratch = await mkdtemp(path.join(os.tmpdir(),"mis-clean-db-"));
const isolated = { PATH:process.env.PATH, HOME:scratch, LANG:"C.UTF-8" };
const freePort = async () => {
  const server = createServer();
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const port = server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
};
let started = false, api, db;
try {
  const pgPort = await freePort(), apiPort = await freePort();
  await exec("initdb",["-D",path.join(scratch,"pg"),"-A","trust","-U","mis_test","--no-locale"],{env:isolated});
  await exec("pg_ctl",["-D",path.join(scratch,"pg"),"-l",path.join(scratch,"postgres.log"),
    "-o",`-h 127.0.0.1 -p ${pgPort} -k ${scratch}`,"-w","start"],{env:isolated});
  started = true;
  const url = `postgresql://mis_test@127.0.0.1:${pgPort}/postgres`;
  const env = { ...isolated, MIS_LOCAL_DEV:"1", NODE_ENV:"development", DATABASE_URL:url,
    SESSION_SECRET:randomBytes(32).toString("hex"), MIS_LOCAL_DATA_DIR:path.join(scratch,"private"),
    MIS_LOGIN_OTP_USERNAME:"admin", MIS_LOGIN_OTP_EMAIL:"admin@example.test",
    MIS_LOGIN_OTP_FROM:"MIS Test <login@example.test>", MIS_EMAIL_FROM:"MIS Test <notifications@example.test>",
    PORT:String(apiPort) };
  assert.throws(()=>assertLocalDatabase({...env,DATABASE_URL:"postgresql://remote.invalid/test"}));
  assert.throws(()=>assertLocalDatabase({...env,DATABASE_URL:`${url}?host=remote.invalid`}));
  assert.throws(()=>assertLocalDatabase({...env,NODE_ENV:"production"}));
  assert.throws(()=>assertLocalDatabase({...env,REPL_ID:"synthetic"}));
  assert.throws(()=>validateAdminPassword("weak"));
  assert.throws(()=>validateAdminPassword("A1!"+ "é".repeat(36)));
  db = new Client({connectionString:url}); await db.connect();

  // A privilege failure must not leave an incomplete schema.
  await db.query("CREATE ROLE bootstrap_limited LOGIN");
  await db.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
  await assert.rejects(bootstrapDatabase({...env,DATABASE_URL:`postgresql://bootstrap_limited@127.0.0.1:${pgPort}/postgres`}),/rolled back/);
  assert.equal((await db.query("SELECT to_regnamespace('crm') AS n")).rows[0].n,null);
  // Inject a final-step failure after schema, security and seeds ran, proving the
  // runner's outer transaction really rolls them all back. Temporary cluster only.
  await db.query(`CREATE FUNCTION public.fail_local_marker() RETURNS event_trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF current_query() LIKE '%CREATE TABLE crm.local_bootstrap%' THEN
        RAISE EXCEPTION 'synthetic final-step failure';
      END IF;
    END $$;
    CREATE EVENT TRIGGER fail_local_marker ON ddl_command_start WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION public.fail_local_marker()`);
  await assert.rejects(bootstrapDatabase(env),/rolled back/);
  assert.equal((await db.query("SELECT to_regnamespace('crm') AS n")).rows[0].n,null);
  await db.query("DROP EVENT TRIGGER fail_local_marker; DROP FUNCTION public.fail_local_marker()");
  await assert.rejects(provisionAdmin(env,`Before!${randomBytes(18).toString("hex")}1`),/not a restored database/);
  await db.query("CREATE TABLE public.preexisting(id integer)");
  await assert.rejects(bootstrapDatabase(env),/not empty/);
  await db.query("DROP TABLE public.preexisting");
  await bootstrapDatabase(env);
  for (const table of ["employees","business_tracking","business_work_items","business_uploads","auth_sessions","login_otp_challenges"]) {
    assert.equal(Number((await db.query(`SELECT count(*) FROM crm.${table}`)).rows[0].count),0,`${table} starts empty`);
  }
  await assert.rejects(bootstrapDatabase(env),/not empty/);
  const password = `Local!${randomBytes(18).toString("hex")}9`;
  await provisionAdmin(env,password);
  const original = (await db.query("SELECT * FROM crm.employees WHERE username='admin'")).rows[0];
  assert.ok(await bcrypt.compare(password,original.password_hash));
  assert.equal(original.profile_id,1); assert.ok(original.activated && original.approved);
  await assert.rejects(provisionAdmin(env,`Other!${randomBytes(18).toString("hex")}1`),/already exists/);
  assert.equal((await db.query("SELECT password_hash FROM crm.employees WHERE username='admin'")).rows[0].password_hash,original.password_hash);
  const menus = (await db.query("SELECT main_menu_name,sub_menu_name,page_url,menu_order FROM crm.menu_access WHERE profile_id=1")).rows;
  const adminSource = await readFile(path.join(root,"artifacts/api-server/src/routes/admin.ts"),"utf8");
  const canonicalMenus = [...adminSource.matchAll(/\{\s*main:\s*"([^"]+)",\s*sub:\s*"([^"]+)",\s*url:\s*"([^"]+)",\s*order:\s*(\d+)\s*\}/g)];
  assert.equal(menus.length,canonicalMenus.length);
  for (const [,main,sub,url,order] of canonicalMenus) assert.ok(menus.some(m=>m.main_menu_name===main && m.sub_menu_name===sub && m.page_url===url && m.menu_order===Number(order)),`menu ${url}`);
  console.info("PASS: empty initialization, reference/menu contracts, rollback and no-reset safety");

  let apiLog = "";
  api = spawn(process.execPath,[path.join(root,"artifacts/api-server/dist/index.mjs")],{env,stdio:["ignore","pipe","pipe"]});
  api.stdout.on("data",chunk=>{apiLog=(apiLog+chunk).slice(-10000);});
  api.stderr.on("data",chunk=>{apiLog=(apiLog+chunk).slice(-10000);});
  const base = `http://127.0.0.1:${apiPort}`;
  for (let i=0;i<100;i++) {
    if (api.exitCode !== null) throw new Error("Test API stopped before serving.");
    try { if ((await fetch(`${base}/api/healthz`)).status<500) break; } catch {}
    if (i===99) throw new Error("Test API did not start.");
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  let cookie = "";
  async function request(route,body,expected=200,method=body?"POST":"GET") {
    const response = await fetch(`${base}/api${route}`,{method,headers:{"Content-Type":"application/json",Cookie:cookie},
      ...(body ? {body:JSON.stringify(body)} : {})});
    const payload = await response.json();
    assert.equal(response.status,expected,`${method} ${route}: ${JSON.stringify(payload)}`);
    if (response.headers.get("set-cookie")) cookie=response.headers.get("set-cookie").split(";")[0];
    return payload;
  }
  await request("/mis/business",undefined,401);
  const challenge = await request("/auth/login",{username:"admin",password});
  assert.equal(challenge.step,"otp");
  await request("/mis/business",undefined,401);
  const messages = await readdir(path.join(env.MIS_LOCAL_DATA_DIR,"mail"));
  const email = JSON.parse(await readFile(path.join(env.MIS_LOCAL_DATA_DIR,"mail",messages[0]),"utf8"));
  const otp = email.text.match(/\b\d{6}\b/)[0];
  const login = await request("/auth/verify-otp",{tempToken:challenge.tempToken,otp});
  assert.equal(login.step,"authenticated"); assert.equal(login.passwordExpired,false);
  await request("/auth/verify-otp",{tempToken:challenge.tempToken,otp},401);
  // Replay clears no successful session; restore if the response clears cookies.
  await request("/auth/me");
  for (const route of ["/admin/profiles","/admin/employees","/admin/business-requirements",
    "/mis/agents","/business/sectors","/business/aml/risk-reasons","/mis/production-month",
    "/mis/staff-on-call","/mis/business","/medical-underwriting","/pricing-review",
    "/cashier","/record-filing","/gi/allocate","/business-status",
    "/mis/risk/departments","/mis/risk/risks","/mis/risk/dashboard"]) await request(route);
  console.info("PASS: password + captured OTP, replay rejection, authenticated catalogs and empty queues");

  // Staff accounts are explicitly enrolled through the normal admin endpoint,
  // with fresh random test passwords. They are not part of the baseline seed.
  const staff = [
    ["local-bpo",4,"BPO"],["local-finance",8,"FINANCE"],["local-medical",5,"MEDICAL UNDERWRITING"],
    ["local-gi",10,"NONMEDICAL"],["local-entry",3,"LOCAL"],["local-dpu",12,"DPU"],
  ];
  const staffPasswords = new Map();
  for (const [username,profile_id,department] of staff) {
    const staffPassword = `Staff!${randomBytes(18).toString("hex")}1`;
    staffPasswords.set(username,staffPassword);
    await request("/admin/employees",{username,profile_id,department,employee_name:`Synthetic ${username}`,
      email:`${username}@example.test`,activated:true,approved:true,password:staffPassword},201);
  }
  const businessPath = file=>`/business/${encodeURIComponent(file)}`;
  const localPdf=Buffer.from("%PDF-1.4\nSynthetic local test document\n%%EOF\n");
  async function upload(file,req_id,scope="register",extra={}) {
    const ticket=await request("/storage/uploads/request-url",{name:"synthetic.pdf",size:localPdf.length,contentType:"application/pdf"});
    const put=await fetch(`${base}${ticket.uploadURL}`,{method:"PUT",headers:{Cookie:cookie,"Content-Type":"application/pdf"},body:localPdf});
    assert.equal(put.status,204);
    const route=scope==="allocation"?`/business/allocated/${encodeURIComponent(file)}/uploads`:
      scope==="cashier"?`/cashier/files/${encodeURIComponent(file)}/uploads`:
      scope==="pricing"?`/pricing-review/files/${encodeURIComponent(file)}/uploads`:`${businessPath(file)}/uploads`;
    if (scope==="allocation" && req_id !==14 && req_id !==19)
      await request(`${businessPath(file)}/checklist/${req_id}`,{});
    return request(route,{req_id,filename:"synthetic.pdf",filesize:localPdf.length,mime_type:"application/pdf",
      storage_key:ticket.objectPath,...extra},201);
  }
  async function register(client_type="R",rate_type="S",business="M") {
    const result=await request("/business/register",{client_type,rate_type,business,business_type:"N",
      proposer_name:"Synthetic local proposer",agent_id:"LOCAL-TEST-AGENT",
      ...(client_type!=="R"?{cr12_ref:"LOCAL-CR12",county_code:"Nairobi",corp_category:"Private",sector:"LOCAL TEST SERVICES"}:{}),
      ...(business==="N"?{nid:"SYNTHETIC-ID",pin_no:"SYNTHETIC-PIN",county_code:"Nairobi",gi_category:"Motor"}:{})},201);
    const file=result.file_no ?? result.data?.file_no;
    assert.ok(file,"registered file number");
    await request(`${businessPath(file)}/checklist/${client_type==="R"?1:7}`,{});
    await upload(file,client_type==="R"?1:7);
    await request(`${businessPath(file)}/forward`,{to_user:business==="M"?"local-bpo":undefined,comments:"Synthetic handoff"});
    return file;
  }
  const retail=await register();
  const bpo=await request("/mis/business?queue=bpo-retail");
  assert.ok(bpo.data.some(f=>f.file_no===retail));
  await request(`${businessPath(retail)}/review-action`,{action:"A",allocated_to:"local-bpo",product:"T",comments:"Synthetic allocation"});
  const invoice="LOCAL-INVOICE-0000000001";
  await request(`${businessPath(retail)}/allocation-action`,{action:"C",assigned_to:"local-finance",invoice_no:invoice,paid_status:"FULL-PAID",comments:"Synthetic cashier"},409);
  await upload(retail,19,"allocation",{risk_rate:"Low",risk_reason:"No alerts identified"});
  await upload(retail,14,"allocation",{invoice_no:invoice,amount:"100"});
  await request(`${businessPath(retail)}/allocation-action`,{action:"C",assigned_to:"local-finance",invoice_no:invoice,paid_status:"FULL-PAID",comments:"Synthetic cashier"});
  await upload(retail,15,"cashier");
  const cashier=await request(`/cashier/files/${encodeURIComponent(retail)}`);
  await request(`/cashier/files/${encodeURIComponent(retail)}/review`,{action:"M",paid_status:"FULL-PAID",
    receipt_no:"LOCAL-RECEIPT",comments:"Synthetic receipt",expected_updated_at:cashier.data.file.updated_at});
  const filing=await request(`/record-filing/files/${encodeURIComponent(retail)}`);
  await request(`/record-filing/files/${encodeURIComponent(retail)}/file`,{action:"F",
    expected_updated_at:filing.data.file.updated_at,upload_ids:filing.data.uploads.map(u=>u.upload_id),comments:"Synthetic filing"});
  assert.equal((await db.query("SELECT file_status FROM crm.business_tracking WHERE file_no=$1",[retail])).rows[0].file_status,"FILED");
  console.info("PASS: registration, actual private document PUT, BPO, AML gate, allocation, cashier receipt and filing");

  const corporate=await register("C","C");
  await request(`${businessPath(corporate)}/review-action`,{action:"A",allocated_to:"local-bpo",product:"T",comments:"Synthetic custom rate"});
  await upload(corporate,10,"pricing");
  const pricing=await request(`/pricing-review/files/${encodeURIComponent(corporate)}`);
  await request(`/pricing-review/files/${encodeURIComponent(corporate)}/review`,{action:"YES",comments:"Synthetic benefit verification",
    expected_updated_at:pricing.data.file.updated_at,allocated_to:"local-bpo"});
  assert.equal((await db.query("SELECT benefit_verified FROM crm.business_tracking WHERE file_no=$1",[corporate])).rows[0].benefit_verified,"YES");
  const medical=await register();
  await request(`${businessPath(medical)}/review-action`,{action:"MU",product:"T",comments:"Synthetic medical review"});
  await request(`/medical-underwriting/files/${encodeURIComponent(medical)}/hpc`,{
    member_no:"LOCAL-MEMBER",member_name:"Synthetic Member",proposer_name:"Synthetic Proposer",client_type:"R",condition:"Synthetic condition"},201);
  const med=await request(`/medical-underwriting/files/${encodeURIComponent(medical)}`);
  await request(`/medical-underwriting/files/${encodeURIComponent(medical)}/review`,{action:"RI",comments:"Synthetic correction",
    hpc:true,lateral_movement:false,expected_updated_at:med.data.file.updated_at});
  const gi=await register("R","S","N");
  const giFile=await request(`/gi/files/${encodeURIComponent(gi)}`);
  await request(`/gi/files/${encodeURIComponent(gi)}/decision`,{action:"A",assigned_to:"local-gi",comments:"Synthetic GI",
    expected_updated_at:giFile.data.file.updated_at});
  assert.equal((await db.query("SELECT queue_name FROM crm.business_work_items WHERE file_no=$1 AND work_status='OPEN'",[gi])).rows[0].queue_name,"GI_ALLOCATED");
  console.info("PASS: custom Corporate Pricing, medical/HPC return + notifications, GI allocation");

  // Permission changes must invalidate existing sessions, including the test admin.
  await db.query("UPDATE crm.menu_access SET can_edit=false WHERE profile_id=1 AND page_url='/business'");
  await request("/auth/me",undefined,401);
  console.info("PASS: baseline session-security triggers revoke stale access");
  const staffLogin = await request("/auth/login",{username:"local-entry",password:staffPasswords.get("local-entry")});
  assert.equal(staffLogin.step,"authenticated"); assert.equal(staffLogin.passwordExpired,true);
  await request("/auth/change-password",{currentPassword:staffPasswords.get("local-entry"),
    newPassword:`Changed!${randomBytes(18).toString("hex")}1`});
  await request("/mis/business?queue=register");
  await request("/mis/business?queue=bpo-retail",undefined,403);
  await request("/cashier",undefined,403);
  const access = (await db.query("SELECT page_url FROM crm.menu_access WHERE profile_id=3 AND can_access")).rows.map(r=>r.page_url);
  assert.ok(access.includes("/business") && !access.includes("/admin/users"));
  console.info("PASS: staff first-login password expiry/change and operational role boundaries");
} finally {
  if (api && api.exitCode===null) {
    api.kill("SIGTERM");
    await new Promise(resolve=>api.once("exit",resolve));
  }
  await db?.end().catch(()=>{});
  if (started) await exec("pg_ctl",["-D",path.join(scratch,"pg"),"-m","immediate","-w","stop"],{env:isolated}).catch(()=>{});
  await rm(scratch,{recursive:true,force:true});
}

import type { PoolClient } from "pg";
import type { GiManagerDetails, GiLevel } from "@workspace/api-zod";
import { SalesSetupError } from "./sales-structure";

export async function checkGiManagerDetails(client:PoolClient,input:GiManagerDetails,level:GiLevel,
  active:boolean,previous?:GiManagerDetails){
  const fail=(message:string):never=>{throw new SalesSetupError(400,message);};
  const details={...input};
  for(const key of Object.keys(details) as Array<keyof GiManagerDetails>)
    if(key!=='EARN_RETAINER')(details[key] as string)=String(details[key]??'').trim();
  if(!details.GI_UM_ID||!details.GI_UM_NAME)fail("GI_UM_ID and GI_UM_NAME are required.");
  if(previous&&previous.GI_UM_ID!==details.GI_UM_ID)fail("The original GI manager identifier cannot change.");
  if(details.EMAIL&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.EMAIL))fail("Enter a valid manager email.");
  for(const key of ['VALID_FROM','VALID_TO','JOIN_DATE','RET_EFF_UPTO'] as const){
    const value=details[key];
    if(value){
      const date=new Date(`${value}T00:00:00Z`);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)
        fail(`${key} must be a real calendar date.`);
    }
  }
  if(details.VALID_FROM&&details.VALID_TO&&details.VALID_TO<details.VALID_FROM)fail("VALID_TO must be on or after VALID_FROM.");
  if(details.JOIN_DATE&&details.RET_EFF_UPTO&&details.RET_EFF_UPTO<details.JOIN_DATE)
    fail("RET_EFF_UPTO must be on or after JOIN_DATE.");
  if(details.RETAINER_AMT&&!/^\d{1,18}(?:\.\d{1,6})?$/.test(details.RETAINER_AMT))
    fail("RETAINER_AMT must be nonnegative with at most 18 whole and 6 decimal digits.");
  if(details.GI_UNIT_CODE){
    const target=(await client.query("SELECT status FROM crm.gi_structure_nodes WHERE level='UNIT' AND code=$1",[details.GI_UNIT_CODE])).rows[0];
    if(!target||(active&&target.status==='INACTIVE'))fail("Select an existing GI Unit that is not inactive.");
  }
  if(details.NSM_CODE){
    const national=await client.query("SELECT 1 FROM crm.sales_structure_nodes WHERE level='NATIONAL' AND code=$1",[details.NSM_CODE]);
    if(!national.rowCount&&(active||previous?.NSM_CODE!==details.NSM_CODE))
      fail("Select an existing National. An unresolved imported National may only be retained in an inactive draft.");
  }
  if(active){
    if(!details.EMAIL||!details.VALID_FROM||!details.VALID_TO)fail("Complete the email and validity dates before activating the manager.");
    if(details.EARN_RETAINER&&(!details.JOIN_DATE||!details.RET_EFF_UPTO||!details.RETAINER_AMT))
      fail("Retainer entitlement requires JOIN_DATE, RET_EFF_UPTO and RETAINER_AMT.");
  }
  return details;
}

const assert=require('node:assert/strict');
const {build}=require('esbuild');
const {mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const path=require('node:path');
(async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'sales-access-'));
  try{
    const outfile=path.join(dir,'router.cjs');
    await build({entryPoints:[path.join(__dirname,'../src/routes/sales-structure.ts')],outfile,
      bundle:true,format:'cjs',platform:'node',logLevel:'silent',plugins:[{name:'isolated-guard',setup(build){
        build.onResolve({filter:/auth-middleware$/},()=>({path:'auth',namespace:'fixture'}));
        build.onResolve({filter:/\/postgres$/},()=>({path:'postgres',namespace:'fixture'}));
        build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='auth'
          ?'export function requireAuth(){}'
          :`export async function queryOne(sql,params){
              return {is_active:params[0]!==999,profile_name:params[0]===32?'National Sales Admin':'Sales Manager'};
            }
            export async function query(){throw Error('Unexpected database operation');}
            export async function withTransaction(){throw Error('Unexpected write');}`}));
      }}]});
    const router=require(outfile).default;
    const guard=router.stack.find(layer=>!layer.route&&layer.handle.constructor.name==='AsyncFunction').handle;
    async function access(profileId,method,url){
      let allowed=false,status;
      const res={setHeader(){},status(code){status=code;return this;},json(){}};
      await guard({user:{profileId},method,path:url},res,error=>{if(error)throw error;allowed=true;});
      return{allowed,status};
    }
    for(const [method,url] of [['GET','/catalogs'],['PATCH','/nodes/21'],['POST','/nodes'],['POST','/managers'],['PATCH','/managers/12']])
      assert.equal((await access(32,method,url)).allowed,true,`Sales Admin must reach ${method} ${url}`);
    assert.equal((await access(32,'POST','/catalogs/sales-units')).status,403,'Sales Admin hierarchy access cannot grant catalog maintenance');
    assert.equal((await access(33,'PATCH','/nodes/21')).status,403,'A Sales Manager cannot change hierarchy managers');
    assert.equal((await access(999,'GET','/catalogs')).status,403);
    assert.equal((await access(1,'POST','/catalogs/sales-units')).allowed,true);
    console.log('PASS: Sales Admin hierarchy/enrollment access, restricted catalog writes, ordinary-manager denial and retained System Admin access.');
  }finally{await rm(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});

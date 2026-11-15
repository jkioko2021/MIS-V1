const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
let state=[],cursor=0;
const writes=[],exportsObject={};
const jsx=(type,props)=>({type,props:props??{}});
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/pages/admin/organisation/source-manager-dialog.tsx'),'utf8'),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,
  }}).outputText,{exports:exportsObject,require(name){
    if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
    if(name==='react')return{useState(value){const index=cursor++;if(!(index in state))state[index]=value;
      return[state[index],value=>{state[index]=value;}];}};
    if(name==='@tanstack/react-query')return{useQueryClient:()=>({invalidateQueries:async()=>{}})};
    if(name==='@workspace/api-client-react')return{
      getGetOrganisationQueryKey:()=>['organisation'],
      useReassignOrganisationSourceManager:()=>({isPending:false,mutate:(...args)=>writes.push(args)}),
    };
    if(name==='./shared')return{errorMessage:error=>String(error)};
    return new Proxy({},{get:(_,key)=>key});
  }});
let closed=false;
let props={candidate:{source_reference_id:21,name:'Region',level:'REGION',setup_version:7},
  users:[{employee_id:11,employee_name:'Eligible Sales Manager',email:'eligible@example.test',user_eligible:true},
    {employee_id:12,employee_name:'Inactive Sales Manager',email:'inactive@example.test',user_eligible:false}],
  onClose(){closed=true;}};
const walk=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(walk):[node,...walk(node.props?.children)];
const render=()=>{cursor=0;return walk(exportsObject.SourceManagerDialog(props));};
const save=()=>render().find(node=>node.type==='Button'&&JSON.stringify(node.props.children).includes('Save reassignment'));
const manager=()=>render().find(node=>node.props?.id==='pending-manager');
const reason=value=>render().find(node=>node.props?.id==='manager-change-reason').props.onChange({target:{value}});
(async()=>{
  assert.equal(save().props.disabled,true);
  assert.equal(manager().props.options.find(option=>option.value==='12').disabled,true);
  manager().props.onValueChange('11');reason('  Move responsibility  ');
  assert.equal(save().props.disabled,false);save().props.onClick();
  assert.equal(writes[0][0].id,21);
  assert.equal(writes[0][0].data.employee_id,11);
  assert.equal(writes[0][0].data.version,7);
  assert.equal(writes[0][0].data.reason,'Move responsibility');
  await writes[0][1].onSuccess();assert.equal(closed,true);
  state=[];props={...props,candidate:{...props.candidate,level:'BRANCH'}};
  assert(manager().props.options.some(option=>option.value===''&&option.label==='No manager'));
  reason('Leave Branch managerless');save().props.onClick();
  assert.equal(writes[1][0].data.employee_id,null);
  state=[];props={...props,candidate:{...props.candidate,setup_version:undefined}};
  reason('Cannot update without version');assert.equal(save().props.disabled,true);
  console.log('PASS: manager search choices, inactive-account exclusion, required manager/reason/version, trimmed payload, optional Branch clearing and refresh on success.');
})().catch(error=>{console.error(error);process.exitCode=1;});

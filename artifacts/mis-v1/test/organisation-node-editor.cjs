const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const output = {};
const parentReference={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/pages/admin/organisation/parent-reference.ts'),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText,{exports:parentReference});
let state = [], cursor = 0, effects = [];
const writes=[];
const jsx = (type,props) => ({type,props:props||{}});
const source = fs.readFileSync(path.join(__dirname,'../src/pages/admin/organisation/node-editor.tsx'),'utf8');
vm.runInNewContext(ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText,{
  exports:output,
  require(name){
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'Fragment'};
    if(name==='react')return {useEffect(fn){effects.push(fn)},useRef(initial){
      const index=cursor++;if(!(index in state))state[index]={current:initial};
      return state[index];
    },useState(initial){
      const index=cursor++;if(!(index in state))state[index]=typeof initial==='function'?initial():initial;
      return[state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value}];
    }};
    if(name==='@tanstack/react-query')return {useQueryClient:()=>({invalidateQueries:async()=>{}})};
    if(name==='@workspace/api-client-react')return new Proxy({},{get:(_,key)=>String(key).startsWith('get')?()=>[]:()=>({isPending:false,reset(){},mutate(input){writes.push(input)}})});
    if(name==='lucide-react'||name.startsWith('@/components/ui/'))return new Proxy({},{get:(_,key)=>String(key)});
    if(name==='../sales-structure/manager-details')return {ManagerDetailsForm:'ManagerDetailsForm'};
    if(name==='./parent-reference')return parentReference;
    if(name==='./shared')return {INPUT_CLASS:'input',LEVELS:['NATIONAL','REGION','BRANCH','UNIT'],
      LEVEL_LABEL:{NATIONAL:'National',REGION:'Region',BRANCH:'Branch',UNIT:'Unit'},errorStatus:()=>0,errorMessage:()=>''};
    throw Error(`Unexpected import ${name}`);
  },
});
const nodes=[
  {id:1,code:'N001',name:'National One',level:'NATIONAL',available:true,is_active:true,parent_id:null},
  {id:2,code:'N002',name:'National Two',level:'NATIONAL',available:true,is_active:true,parent_id:null},
  {id:3,code:'R001',name:'Region One',level:'REGION',available:true,is_active:true,parent_id:1},
  {id:4,code:'R002',name:'Region Two',level:'REGION',available:true,is_active:true,parent_id:2},
];
let props={nodes,candidates:[],managers:[],onCancel(){},onSaved:async()=>{},onRefresh:async()=>{}};
const walk=node=>node==null||typeof node==='boolean'?[]:Array.isArray(node)?node.flatMap(walk):
  typeof node==='object'?[node,...walk(node.props?.children)]:[];
const render=()=>{cursor=0;effects=[];const tree=output.NodeEditor(props);effects.forEach(fn=>fn());return tree};
const find=id=>walk(render()).find(node=>node.props?.id===id);
const change=(id,value)=>{
  const field=find(id).props;
  return field.onValueChange ? field.onValueChange(value) : field.onChange({target:{value}});
};
state=[];
const mappedRegion={source_reference_id:999,code:'IMPORTED_REGION',name:'Mapped Region',level:'REGION',
  parent_code:'N001',linked_national_node_id:1,linked_national_name:'National One'};
props={...props,candidates:[mappedRegion],initialCandidate:mappedRegion};
assert.equal(find('org-parent').props.value,'1','Completing a mapped Region must prefill its confirmed National');
state=[];props={nodes,candidates:[],managers:[],onCancel(){},onSaved:async()=>{},onRefresh:async()=>{}};
const importedRegion={source_reference_id:80,code:'REG_PARENT',name:'Imported Region Name',level:'REGION',
  linked_national_name:'Mapped National',linked_manager_name:'Regional Manager Name'};
const importedBranch={source_reference_id:81,code:'BRANCH_CHILD',name:'Imported Branch',level:'BRANCH',
  parent_code:'reg_parent',linked_national_name:'Mapped National'};
state=[];props={...props,initialCandidate:importedBranch,candidates:[importedRegion,importedBranch]};
assert.equal(find('org-parent').props.value,'pending:80','Branch setup must prefill its uploaded Region relationship');
assert.equal(find('org-parent').props.options.find(option=>option.value==='pending:80').label,'Imported Region Name');
assert.equal(find('org-parent').props.options.find(option=>option.value==='pending:80').disabled,true);
const branchDetails=walk(render()).find(item=>item.props?.['data-testid']==='branch-region-details');
assert(JSON.stringify(branchDetails).includes('Imported Region Name'));
assert(JSON.stringify(branchDetails).includes('Mapped National'));
assert(JSON.stringify(branchDetails).includes('Regional Manager Name'));
assert.equal(walk(render()).find(item=>item.type==='Button'&&JSON.stringify(item.props.children).includes('"Create entry"')).props.disabled,true,
  'A prefilled imported Region must not activate or become an operational parent');
assert.equal(parentReference.importedParentReference(importedBranch,[],[importedRegion,{...importedRegion,source_reference_id:82}]),null,
  'Ambiguous source Regions must not be guessed');
const resolved=parentReference.importedParentReference(importedBranch,[{
  id:45,code:'REG_PARENT',name:'Operational Region',level:'REGION',manager_name:'Current Regional Manager',
  path:[{level:'NATIONAL',name:'National One'}],
}],[importedRegion]);
assert.equal(resolved.value,'45');assert.equal(resolved.name,'Operational Region');assert.equal(resolved.pending,false);
state=[];props={nodes,candidates:[],managers:[],onCancel(){},onSaved:async()=>{},onRefresh:async()=>{}};
let changedLevel;
state=[];
props={...props,initialLevel:'UNIT',nodes:[...nodes,
  {id:20,code:'B_READY',name:'Ready Branch',level:'BRANCH',available:true,is_active:true},
  {id:21,code:'B_BLOCKED',name:'Unavailable Branch',level:'BRANCH',available:false,is_active:true}],
  candidates:[
    {source_reference_id:31,code:'B_IMPORTED',name:'Imported Branch Name',level:'BRANCH'},
    {source_reference_id:32,code:'b_ready',name:'Duplicate imported Branch',level:'BRANCH'},
    {source_reference_id:33,code:'R_IMPORTED',name:'Imported Region',level:'REGION'},
  ]};
let branchParents=find('org-parent').props.options;
assert.equal(branchParents.length,3,'List operational and imported Branches, without duplicate codes or other levels');
assert.equal(branchParents.find(option=>option.value==='20').label,'Ready Branch');
assert.equal(branchParents.find(option=>option.value==='20').disabled,false);
assert.equal(branchParents.find(option=>option.value==='21').disabled,true);
assert.equal(branchParents.find(option=>option.value==='pending:31').label,'Imported Branch Name');
assert.equal(branchParents.find(option=>option.value==='pending:31').disabled,true);
change('org-parent','pending:31');
assert.equal(find('org-parent').props.value,'','A pending source ID must never become an operational parent ID');
change('org-parent','20');
assert.equal(find('org-parent').props.value,'20');
state=[];props={nodes,candidates:[],managers:[],onCancel(){},onSaved:async()=>{},onRefresh:async()=>{}};
props.onLevelChange = level => { changedLevel = level; };
change('org-level','REGION');
assert.equal(changedLevel, 'REGION', 'Entry level changes must notify the hierarchy list');
change('org-code','R_NEW');change('org-name','Typed region name');
change('org-parent','1');
assert.equal(find('org-code').props.value,'R_NEW');
assert.equal(find('org-name').props.value,'Typed region name');
change('org-parent','2');
assert.equal(find('org-code').props.value,'R_NEW');
assert.equal(find('org-name').props.value,'Typed region name');
state=[];
props={...props,candidates:[
  {source_reference_id:10,code:'R_SOURCE',name:'Source region',level:'REGION',parent_code:null},
  {source_reference_id:11,code:'B_SOURCE',name:'Source branch',level:'BRANCH',parent_code:'R001',
    medical_details:{BRANCH_TYPE:'Agency',SPECIALITY:'GEN',GI_BRANCH:'GB1'}},
]};
change('org-level','REGION');change('org-source-candidate','10');change('org-parent','1');
assert.equal(find('org-source-candidate').props.value,'10','A Region with no legacy National retains its selected reference');
assert.equal(find('org-code').props.value,'R_SOURCE');
change('org-parent','2');
assert.equal(find('org-source-candidate').props.value,'10');
state=[];change('org-level','BRANCH');change('org-parent','3');change('org-source-candidate','11');
change('org-parent','4');
assert.equal(find('org-source-candidate').props.value,'','Incompatible source link is cleared');
assert.equal(find('org-code').props.value,'B_SOURCE','Source-derived draft text is retained for explicit correction');
assert.equal(find('org-name').props.value,'Source branch');
assert.equal(find('medical-gi_branch'),undefined,'GI branch remains hidden after parent changes');
assert.equal(find('medical-branch_type'),undefined);
assert.equal(find('medical-speciality'),undefined);
state=[];
props={...props,node:{...nodes[2],version:1,manager_id:12},managers:[
  {id:12,level:'REGION',is_active:true,user_eligible:true,employee_name:'Region Manager'},
]};
change('org-name','Draft retained through conflict');
props={...props,node:{...props.node,version:2,name:'Another administrator updated this'}};
render();
const saveButton=walk(render()).filter(item=>item.type==='Button'&&item.props.onClick&&item.props.disabled!==undefined).at(-1);
assert(saveButton);
saveButton.props.onClick();
assert.equal(writes.at(-1).data.version,2);
assert.equal(writes.at(-1).data.name,'Draft retained through conflict');

const plain=value=>JSON.parse(JSON.stringify(value));
const save=()=> {
  const button=walk(render()).filter(item=>item.type==='Button'&&item.props.onClick&&item.props.disabled!==undefined).at(-1);
  assert(button,'Save button is available');
  button.props.onClick();
  return writes.at(-1);
};

state=[];writes.length=0;
props={nodes,candidates:[],managers:[
  {id:31,level:'REGION',is_active:true,user_eligible:true,employee_name:'Region Manager'},
]};
change('org-level','REGION');change('org-code','R_MANUAL');change('org-name','Manual Region');
change('org-parent','1');change('org-manager','31');
assert.equal(find('medical-valid_from').props.maxLength,10,'Region validity dates use the backend limit');
change('medical-valid_from','2024-01-02');
assert.deepEqual(plain(save().data.medical_details),{VALID_FROM:'2024-01-02'},
  'Manual create sends only applicable populated Medical details');

state=[];writes.length=0;
const branchCatalog={
  definitions:[{key:'sales-branches',fields:[{key:'GI_BRANCH',reference:'gi-branches'}]}],
  entries:[
    {id:1,catalog:'gi-branches',code:'GB1',name:'Central GI',source_reference:false},
    {id:2,catalog:'gi-branches',code:'GB1',name:'Central GI imported',source_reference:true,organization_choice:true},
    {id:3,catalog:'gi-branches',code:'GB2',name:'Unapproved source',source_reference:true,organization_choice:false},
  ],
};
props={nodes,candidates:[
  {source_reference_id:22,code:'B_PRELOAD',name:'Preloaded Branch',level:'BRANCH',parent_code:'R001',
    medical_details:{BRANCH_TYPE:'Agency',SPECIALITY:'GEN',GI_BRANCH:'GB1'}},
],managers:[
  {id:32,level:'BRANCH',is_active:true,user_eligible:true,employee_name:'Branch Manager'},
],catalogSnapshot:branchCatalog};
change('org-level','BRANCH');change('org-parent','3');change('org-source-candidate','22');
assert.equal(find('org-source-candidate').props.options.find(item=>item.value==='22').label,'Preloaded Branch',
  'Imported source dropdown labels use names only');
assert.equal(find('org-parent').props.options.find(item=>item.value==='3').label,'Region One',
  'Parent dropdown labels use names only');
assert.equal(find('medical-branch_type'),undefined,'Branch type is not shown on hierarchy forms');
assert.equal(find('medical-speciality'),undefined,'Speciality is not shown on hierarchy forms');
assert.equal(find('medical-gi_branch'),undefined,'GI branch is not shown for imported Branch records');
assert.equal(find('org-manager').props.value,'','Branch manager defaults to blank');
const preloadedSave=save();
assert.equal(preloadedSave.data.manager_id,null);
assert.equal(preloadedSave.data.source_reference_id,22);
assert.equal(preloadedSave.data.medical_details,undefined,'Unchanged source defaults are inherited rather than resent as overrides');
change('org-manager','32');
assert.equal(save().data.manager_id,32,'An optional eligible Branch manager must be saved');
change('org-manager','');
assert.equal(save().data.manager_id,null,'An optional Branch manager can be cleared');

state=[];writes.length=0;
props={nodes,candidates:[],managers:[
  {id:32,level:'BRANCH',is_active:true,user_eligible:true,employee_name:'Branch Manager'},
],node:{
  ...nodes[2],level:'BRANCH',version:3,parent_id:1,manager_id:32,
  medical_details:{BRANCH_TYPE:'Agency',SPECIALITY:'GEN',GI_BRANCH:'GB1'},
}};
assert.equal(find('medical-branch_type'),undefined,'Branch type is also hidden when editing');
assert.equal(find('medical-speciality'),undefined,'Speciality is also hidden when editing');
assert.equal(find('medical-gi_branch'),undefined,'GI branch is hidden when editing');
assert(!walk(render()).some(item=>item.type==='h3'&&item.props.children==='Medical organisation details'),
  'Do not leave an empty details section on Branch forms');
change('org-name','Updated Branch name');
const updateSave=save();
assert.equal(updateSave.data.medical_details,undefined,'Renaming a Branch must preserve hidden GI branch and other metadata');

state=[];props={nodes,candidates:[],managers:[]};change('org-level','UNIT');
for(const [field,length] of Object.entries({
  'medical-valid_from':10,'medical-valid_to':10,'medical-mis_no':20,
}))assert.equal(find(field).props.maxLength,length,`${field} matches the backend limit`);
for (const field of ['medical-unit_type','medical-speciality','medical-gi_unit','medical-year']) {
  assert.equal(find(field),undefined,`${field} must not appear on Unit creation`);
}
state=[];props={nodes:[...nodes,{id:5,level:'BRANCH',name:'Branch parent',code:'BRANCH_KEEP',is_active:true,available:true,parent_id:3}],
  candidates:[],managers:[{id:33,level:'UNIT',is_active:true,user_eligible:true,employee_name:'Unit Manager'}],
  node:{id:20,level:'UNIT',version:1,code:'UNIT_KEEP',name:'Unit with retained source values',
    parent_id:5,manager_id:33,is_active:true,
    medical_details:{UNIT_TYPE:'Existing',SPECIALITY:'GEN',GI_UNIT:'OLD_GI',YEAR:'2026',MIS_NO:'OLD_MIS'}}};
for (const field of ['medical-unit_type','medical-speciality','medical-gi_unit','medical-year']) assert.equal(find(field),undefined);
change('medical-mis_no','MIS_2027');
assert.deepEqual(plain(save().data.medical_details),{MIS_NO:'MIS_2027'},'Unit edits preserve Year and all other hidden metadata');
change('medical-mis_no','');
assert.deepEqual(plain(save().data.medical_details),{MIS_NO:null},'Editable fields can still be explicitly cleared');

const page=fs.readFileSync(path.join(__dirname,'../src/pages/admin/organisation/index.tsx'),'utf8');
assert.match(page,/if \(current\) setEditor\(current\)/,'Explicit version refresh must replace the editor snapshot, not just the query cache');
for(const initialLevel of ['NATIONAL','REGION','BRANCH','UNIT']){
  state=[];
  props={...props,node:undefined,initialCandidate:undefined,initialLevel,candidates:[]};
  assert.equal(find('org-level').props.value,initialLevel,'Add entry must start at the selected hierarchy level');
}
console.log('PASS: hierarchy levels, source drafts, hidden Year/GI branch and other removed fields, preserved metadata, sparse updates and explicit clearing.');

(async()=>{
  const staff={employee_id:101,employee_name:'Visible Sales Manager',email:'manager@example.test',
    username:'not-shown',emp_code:'EMP_TEST101',user_eligible:true};
  const parents=[
    {id:1,level:'NATIONAL',name:'National',available:true},
    {id:2,level:'REGION',name:'Region',available:true},
    {id:3,level:'BRANCH',name:'Branch',available:true},
  ];
  state=[];
  const linkedCandidate={source_reference_id:500,level:'UNIT',code:'LINKED_UNIT',name:'Linked unit',
    parent_code:'BRANCH_KEEP',linked_manager_employee_id:101,linked_manager_name:staff.employee_name,manager_link_status:'MATCHED'};
  props={nodes:parents,candidates:[linkedCandidate],managers:[],managerUsers:[staff],initialCandidate:linkedCandidate};
  assert.equal(find('org-manager').props.value,'user:101','Opening setup prefills the verified account, not a fabricated designation');
  const linkedCreate=walk(render()).find(item=>item.type==='Button'&&JSON.stringify(item.props.children).includes('"Create entry"'));
  assert.equal(linkedCreate.props.disabled,true,'A source link alone cannot activate an operational Unit');
  for(const [index,initialLevel] of ['NATIONAL','REGION','BRANCH','UNIT'].entries()){
    state=[];
    const ready={id:900+index,employee_id:101,level:initialLevel,is_active:true,user_eligible:true};
    props={nodes:parents,candidates:[],managers:[],managerUsers:[staff],initialLevel,onCancel(){},onSaved:async()=>{},
      onRefresh:async()=>({data:{can_manage:true,nodes:parents,candidates:[],managers:[ready],manager_users:[staff]}})};
    if(initialLevel==='BRANCH'){
      assert.equal(find('org-manager').props.value,'');
      change('org-code','TEST_BRANCH');change('org-name','Test Branch');change('org-parent','2');
      assert.equal(save().data.manager_id,null,'A Branch can be explicitly saved without a manager');
      continue;
    }
    const option=find('org-manager').props.options.find(item=>item.value==='user:101');
    assert(option,'Unenrolled Sales Manager must be listed at every level');
    assert.equal(option.label,'Visible Sales Manager');
    assert.equal(option.description,'manager@example.test');
    change('org-code',`TEST_${initialLevel}`);change('org-name',`Test ${initialLevel}`);
    if(index)change('org-parent',String(index));
    change('org-manager','user:101');
    const saveButton=()=>walk(render()).find(item=>item.type==='Button'&&JSON.stringify(item.props.children).includes('"Create entry"'));
    assert.equal(saveButton().props.disabled,true,'Pending account ID must never be sent as a designation ID');
    const previousWrites=writes.length;saveButton().props.onClick();assert.equal(writes.length,previousWrites);
    walk(render()).find(item=>item.type==='Button'&&item.props.children==='Enroll selected manager').props.onClick();
    const form=walk(render()).find(item=>item.type==='ManagerDetailsForm');
    assert.equal(form.props.initialEmployeeId,101);assert.equal(form.props.initialLevel,initialLevel);
    assert.equal(form.props.lockSelection,true);
    await form.props.refreshStructure();
    props={...props,managers:[ready]};
    assert.equal(find('org-manager').props.value,String(ready.id),'New enrollment must become the selected designation');
    assert.equal(saveButton().props.disabled,false,'Valid assignment becomes saveable without reselecting the user');
  }
  console.log('PASS: Branches save with no manager; other levels require explicit eligible category enrollment.');
})().catch(error=>{console.error(error);process.exitCode=1});

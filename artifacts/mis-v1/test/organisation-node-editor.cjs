const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const output = {};
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
let changedLevel;
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
assert.equal(find('medical-gi_branch').props.value,'GB1','Parent changes preserve remaining source-derived medical draft values');
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
assert.equal(find('medical-gi_branch').props.value,'GB1','Imported GI reference code is retained as the value');
const giOptions=find('medical-gi_branch').props.options;
assert.equal(giOptions.filter(item=>item.value==='GB1').length,1,'GI choices with the same code are deduplicated');
assert.equal(giOptions.find(item=>item.value==='GB1').label,'Central GI','GI dropdown labels use names only');
assert.equal(giOptions.some(item=>item.value==='GB2'),false,'Unapproved imported GI references are excluded');
change('org-manager','32');
const preloadedSave=save();
assert.equal(preloadedSave.data.source_reference_id,22);
assert.equal(preloadedSave.data.medical_details,undefined,'Unchanged source defaults are inherited rather than resent as overrides');

state=[];writes.length=0;
props={nodes,candidates:[],managers:[
  {id:32,level:'BRANCH',is_active:true,user_eligible:true,employee_name:'Branch Manager'},
],node:{
  ...nodes[2],level:'BRANCH',version:3,parent_id:1,manager_id:32,
  medical_details:{BRANCH_TYPE:'Agency',SPECIALITY:'GEN',GI_BRANCH:'GB1'},
}};
assert.equal(find('medical-branch_type'),undefined,'Branch type is also hidden when editing');
assert.equal(find('medical-speciality'),undefined,'Speciality is also hidden when editing');
change('medical-gi_branch','');
const updateSave=save();
assert.deepEqual(plain(updateSave.data.medical_details),{GI_BRANCH:null},
  'Update clears an editable value without clearing or overwriting removed fields');

state=[];props={nodes,candidates:[],managers:[]};change('org-level','UNIT');
for(const [field,length] of Object.entries({
  'medical-year':4,
  'medical-valid_from':10,'medical-valid_to':10,'medical-mis_no':20,
}))assert.equal(find(field).props.maxLength,length,`${field} matches the backend limit`);
for (const field of ['medical-unit_type','medical-speciality','medical-gi_unit']) {
  assert.equal(find(field),undefined,`${field} must not appear on Unit creation`);
}
state=[];props={nodes:[...nodes,{id:5,level:'BRANCH',name:'Branch parent',code:'BRANCH_KEEP',is_active:true,available:true,parent_id:3}],
  candidates:[],managers:[{id:33,level:'UNIT',is_active:true,user_eligible:true,employee_name:'Unit Manager'}],
  node:{id:20,level:'UNIT',version:1,code:'UNIT_KEEP',name:'Unit with retained source values',
    parent_id:5,manager_id:33,is_active:true,
    medical_details:{UNIT_TYPE:'Existing',SPECIALITY:'GEN',GI_UNIT:'OLD_GI',YEAR:'2026'}}};
for (const field of ['medical-unit_type','medical-speciality','medical-gi_unit']) assert.equal(find(field),undefined);
change('medical-year','2027');
assert.deepEqual(plain(save().data.medical_details),{YEAR:'2027'},'Unit edits preserve all hidden metadata');

const page=fs.readFileSync(path.join(__dirname,'../src/pages/admin/organisation/index.tsx'),'utf8');
assert.match(page,/if \(current\) setEditor\(current\)/,'Explicit version refresh must replace the editor snapshot, not just the query cache');
for(const initialLevel of ['NATIONAL','REGION','BRANCH','UNIT']){
  state=[];
  props={...props,node:undefined,initialCandidate:undefined,initialLevel,candidates:[]};
  assert.equal(find('org-level').props.value,initialLevel,'Add entry must start at the selected hierarchy level');
}
console.log('PASS: selected hierarchy level, retained source drafts, Medical defaults, GI names, sparse create overrides and explicit clearing.');

(async()=>{
  const staff={employee_id:101,employee_name:'Visible Sales Manager',email:'manager@example.test',
    username:'not-shown',emp_code:'EMP_TEST101',user_eligible:true};
  const parents=[
    {id:1,level:'NATIONAL',name:'National',available:true},
    {id:2,level:'REGION',name:'Region',available:true},
    {id:3,level:'BRANCH',name:'Branch',available:true},
  ];
  for(const [index,initialLevel] of ['NATIONAL','REGION','BRANCH','UNIT'].entries()){
    state=[];
    const ready={id:900+index,employee_id:101,level:initialLevel,is_active:true,user_eligible:true};
    props={nodes:parents,candidates:[],managers:[],managerUsers:[staff],initialLevel,onCancel(){},onSaved:async()=>{},
      onRefresh:async()=>({data:{can_manage:true,nodes:parents,candidates:[],managers:[ready],manager_users:[staff]}})};
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
  console.log('PASS: Sales Manager users appear at all four levels before enrollment; inline enrollment binds the right account/category and selects the resulting designation.');
})().catch(error=>{console.error(error);process.exitCode=1});

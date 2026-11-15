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
const change=(id,value)=>find(id).props.onChange({target:{value}});
change('org-level','REGION');
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
    medical_details:{BRANCH_TYPE:'Agency',SPECIALITY:'GEN'}},
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
assert.equal(find('medical-branch_type').props.value,'Agency','Parent changes preserve source-derived medical draft values');
assert.equal(find('medical-speciality').props.value,'GEN','Parent changes preserve source-derived medical draft values');
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
assert.equal(walk(find('org-source-candidate')).find(item=>item.type==='option'&&String(item.props.value)==='22').props.children,'Preloaded Branch',
  'Imported source dropdown labels use names only');
assert.equal(walk(find('org-parent')).find(item=>item.type==='option'&&String(item.props.value)==='3').props.children.join(''),'Region One',
  'Parent dropdown labels use names only');
assert.equal(find('medical-branch_type').props.value,'Agency','Imported Medical defaults preload into editor');
assert.equal(find('medical-speciality').props.value,'GEN','Imported Medical defaults preload into editor');
assert.equal(find('medical-branch_type').props.maxLength,50);
assert.equal(find('medical-speciality').props.maxLength,5);
assert.equal(find('medical-gi_branch').props.value,'GB1','Imported GI reference code is retained as the value');
const giOptions=walk(find('medical-gi_branch')).filter(item=>item.type==='option');
assert.equal(giOptions.filter(item=>item.props.value==='GB1').length,1,'GI choices with the same code are deduplicated');
assert.equal(giOptions.find(item=>item.props.value==='GB1').props.children,'Central GI','GI dropdown labels use names only');
assert.equal(giOptions.some(item=>item.props.value==='GB2'),false,'Unapproved imported GI references are excluded');
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
change('medical-branch_type','Agency Plus');
change('medical-speciality','');
const updateSave=save();
assert.deepEqual(plain(updateSave.data.medical_details),{BRANCH_TYPE:'Agency Plus',SPECIALITY:null},
  'Update sends changed values and explicit null clearing while omitting unchanged metadata');

state=[];props={nodes,candidates:[],managers:[]};change('org-level','UNIT');
for(const [field,length] of Object.entries({
  'medical-unit_type':50,'medical-speciality':5,'medical-year':4,
  'medical-valid_from':10,'medical-valid_to':10,'medical-mis_no':20,
}))assert.equal(find(field).props.maxLength,length,`${field} matches the backend limit`);

const page=fs.readFileSync(path.join(__dirname,'../src/pages/admin/organisation/index.tsx'),'utf8');
assert.match(page,/if \(current\) setEditor\(current\)/,'Explicit version refresh must replace the editor snapshot, not just the query cache');
for(const initialLevel of ['NATIONAL','REGION','BRANCH','UNIT']){
  state=[];
  props={...props,node:undefined,initialCandidate:undefined,initialLevel,candidates:[]};
  assert.equal(find('org-level').props.value,initialLevel,'Add entry must start at the selected hierarchy level');
}
console.log('PASS: selected hierarchy level, retained source drafts, Medical defaults, GI names, sparse create overrides and explicit clearing.');

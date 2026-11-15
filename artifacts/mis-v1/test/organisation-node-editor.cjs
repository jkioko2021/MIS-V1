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
    if(name==='react')return {useEffect(fn){effects.push(fn)},useState(initial){
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
  {source_reference_id:11,code:'B_SOURCE',name:'Source branch',level:'BRANCH',parent_code:'R001'},
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
const page=fs.readFileSync(path.join(__dirname,'../src/pages/admin/organisation/index.tsx'),'utf8');
assert.match(page,/if \(current\) setEditor\(current\)/,'Explicit version refresh must replace the editor snapshot, not just the query cache');
console.log('PASS: parent changes retain drafted identity fields; imported links stay consistent; explicit version refresh retains the draft and submits the fresh version.');

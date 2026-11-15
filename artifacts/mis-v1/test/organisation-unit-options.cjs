const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const output={};
const jsx=(type,props)=>({type,props:props??{}});
vm.runInNewContext(ts.transpileModule(fs.readFileSync(
  require('node:path').join(__dirname,'../src/pages/admin/organisation/unit-options.tsx'),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,
  {exports:output,require:()=>({jsx,jsxs:jsx,Fragment:'Fragment'})});
const walk=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(walk):[node,...walk(node.props?.children)];
const units=[{id:1,name:'Ready Unit',code:'U1',is_active:true,available:true},
  {id:2,name:'Unavailable Unit',code:'U2',is_active:true,available:false}];
const pending=[{source_reference_id:3,name:'Imported Unit',code:'U3',level:'UNIT'},
  {source_reference_id:4,name:'Duplicate source',code:'u1',level:'UNIT'}];
const before=JSON.stringify({units,pending});
const options=walk(output.UnitOptions({units,pending})).filter(node=>node.type==='option');
assert.equal(options.length,3);
assert.equal(options.find(node=>node.props.value===1).props.children,'Ready Unit');
assert.equal(options.find(node=>node.props.value===1).props.disabled,false);
assert.equal(options.find(node=>node.props.value===2).props.disabled,true);
assert.equal(options.find(node=>node.props.value==='pending:3').props.children,'Imported Unit');
assert.equal(options.find(node=>node.props.value==='pending:3').props.disabled,true);
assert.equal(JSON.stringify({units,pending}),before);
console.log('PASS: Unit names, canonical IDs, disabled pending/unavailable units, case-insensitive source deduplication and immutable inputs.');

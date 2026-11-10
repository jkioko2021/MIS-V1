const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/components/sidebar-navigation-group.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;

function mount(props) {
  let state;
  let previousDependencies;
  let pendingEffect;
  const exports = {};
  const element = (type, props) => ({ type, props });
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
      if (name === 'react') return {
        useState(initial) {
          if (state === undefined) state = initial;
          return [state, next => { state = typeof next === 'function' ? next(state) : next; }];
        },
        useEffect(effect, dependencies) {
          if (!previousDependencies || dependencies.some((value, index) => value !== previousDependencies[index])) {
            previousDependencies = dependencies;
            pendingEffect = effect;
          }
        },
      };
      if (name === 'lucide-react') return { ChevronRight: 'chevron' };
      if (name === '@/lib/utils') return { cn: (...values) => values.filter(Boolean).join(' ') };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(update = {}) {
      props = { ...props, ...update };
      let node = exports.SidebarNavigationGroup(props);
      if (pendingEffect) {
        const effect = pendingEffect;
        pendingEffect = undefined;
        effect();
        node = exports.SidebarNavigationGroup(props);
      }
      return node;
    },
  };
}

const base = { id: 'business-menu', label: 'Business Tracking', active: false, location: '/', children: 'Links' };
const menu = mount(base);
let node = menu.render();
assert.equal(node.props.children[0].type, 'button');
assert.equal(node.props.children[0].props['aria-expanded'], false);
assert.equal(node.props.children[0].props['aria-controls'], 'business-menu');
assert.equal(node.props.children[1].props.id, 'business-menu');
assert.equal(node.props.children[1].props.hidden, true);
node.props.children[0].props.onClick();
node = menu.render();
assert.equal(node.props.children[0].props['aria-expanded'], true);
assert.equal(node.props.children[1].props.hidden, false);
node.props.children[0].props.onClick();
assert.equal(menu.render().props.children[1].props.hidden, true);

node = menu.render({ active: true, location: '/business/allocated' });
assert.equal(node.props.children[1].props.hidden, false, 'Navigation reveals the active group');
node.props.children[0].props.onClick();
assert.equal(menu.render().props.children[1].props.hidden, true, 'The active group can still be collapsed');
node = menu.render({ location: '/business/cashier' });
assert.equal(node.props.children[1].props.hidden, false, 'Navigating within a collapsed group reveals the destination');

const other = mount({ ...base, id: 'risk-menu', label: 'Risk Register' });
assert.equal(other.render().props.children[1].props.hidden, true, 'Groups toggle independently');
const section = mount({ ...base, section: true, label: 'Administration' });
assert.match(section.render().props.children[0].props.className, /uppercase/);
const unlabeled = mount({ ...base, label: null });
assert.equal(unlabeled.render().props.children, 'Links', 'Unlabeled navigation retains its direct links');
console.log('PASS: independent accessible menu toggles, active-route expansion, and collapsible sections.');

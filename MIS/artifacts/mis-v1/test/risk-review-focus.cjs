const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/pages/risk/risk-review-focus.ts'), 'utf8');
const moduleExports = {};
let focused;
let queried;
const replacement = { focus(options) { focused = ['replacement', options]; } };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: moduleExports,
  CSS: { escape: value => value },
  document: { querySelector(selector) { queried = selector; return replacement; } },
});
const trigger = {
  isConnected: true,
  getAttribute() { return 'revise-summary-risk-SAVED'; },
  focus(options) { focused = ['trigger', options]; },
};
moduleExports.restoreReviewFocus(trigger);
assert.equal(focused[0], 'trigger');
assert.equal(focused[1].preventScroll, true);
assert.equal(queried, undefined);
trigger.isConnected = false;
moduleExports.restoreReviewFocus(trigger);
assert.equal(focused[0], 'replacement', 'A refreshed summary returns focus to the replacement trigger');
assert.equal(queried, '[data-testid="revise-summary-risk-SAVED"]');
focused = undefined;
moduleExports.restoreReviewFocus(null);
assert.equal(focused, undefined, 'Closing without a surviving trigger is safe');
console.log('PASS: popup focus returns to its trigger, survives table replacement and does not scroll the page.');

---
name: Component-test transpilation
description: VM-based TypeScript tests must match the application's ECMAScript compilation target.
---

Transpilation-only component tests must explicitly use the application's ECMAScript target; do not assume they inherit the project's compiler configuration.

**Why:** Default ES5 transpilation without iterable downlevel support silently produced an empty array when spreading a native Set in a Node VM, even though the modern application build supported the same operation. This caused a false scoring failure rather than a compiler error.

**How to apply:** When test and app results disagree around Maps, Sets or other iterables, inspect emitted test JavaScript and the test compiler options before changing business logic. Prefer matching the project's compiler target, or target-independent iterable operations when appropriate.

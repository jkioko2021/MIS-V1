---
name: Component-test transpilation
description: VM-based TypeScript tests must match the application's ECMAScript compilation target.
---

Transpilation-only component tests must explicitly use the application's ECMAScript target; do not assume they inherit the project's compiler configuration.

**Why:** Default ES5 transpilation without iterable downlevel support silently produced an empty array when spreading a native Set in a Node VM, even though the modern application build supported the same operation. This caused a false scoring failure rather than a compiler error.

**How to apply:** When test and app results disagree around Maps, Sets or other iterables, inspect emitted test JavaScript and the test compiler options before changing business logic. Prefer matching the project's compiler target, or target-independent iterable operations when appropriate.

Server-rendered React component tests must also match the dependencies' module format and share the renderer's React instance.

**Why:** An ESM data-URL test bundle could not execute an icon dependency's CommonJS React require, despite the production frontend compiling successfully. Bundling a separate React instance can likewise make otherwise valid hooks fail.

**How to apply:** For mixed CommonJS dependencies, evaluate a CommonJS test bundle with a real Node require. Externalize React and its JSX runtime to the same package instance used by the server renderer; treat module-loader failures as harness failures, not application defects.

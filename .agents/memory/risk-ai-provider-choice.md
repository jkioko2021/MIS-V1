---
name: Risk dashboard AI provider choice
description: User-selected credential approach for future dashboard AI insights.
---
Use the user's own OpenAI API key for Risk Dashboard AI insights, rather than retrying managed AI provisioning.

**Why:** The user explicitly chose to provide their own API key after the managed provisioning flow required verification.

**How to apply:** Collect OPENAI_API_KEY only through the secure Secrets flow. Never ask for or expose the value in chat. A missing key must result in an explicit configuration message, not fabricated AI output.

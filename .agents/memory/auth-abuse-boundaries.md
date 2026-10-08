---
name: Authentication abuse boundaries
description: Security rationale for throttling capacity and trusted client identity
---

Authentication throttling must reject new identities when its bounded storage is full, rather than evicting unexpired limits.

**Why:** An attacker can spray new usernames to evict a targeted account's limit and regain unlimited guesses if live buckets are discarded.

**How to apply:** Preserve this fail-closed behavior when changing the limiter or moving it to shared storage. Expired buckets may be reclaimed.

Do not enable blanket trust of forwarded IP headers to distinguish staff behind a proxy.

**Why:** Unverified forwarded headers let clients choose their own IP identity and bypass IP throttling. A shared proxy address can also unintentionally group staff together.

**How to apply:** Confirm the deployment's actual trusted proxy chain before configuring client-IP extraction. Keep account limits independent of client IP.

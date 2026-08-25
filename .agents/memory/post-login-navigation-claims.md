---
name: Post-login navigation claims
description: Prevent role-based navigation from appearing only after a page refresh.
---

# Post-login navigation claims

The user object returned after OTP verification must include every claim the client uses for role-based navigation, including the profile name and department.

**Why:** A newly authenticated session updates client state directly from the OTP response. If those claims are only available from the later session-refresh endpoint, protected navigation can be hidden immediately after login even though it appears after a reload.

**How to apply:** When adding any sidebar or route UI conditional based on an authenticated user attribute, verify that attribute exists in both the initial authentication response and the session-refresh response.
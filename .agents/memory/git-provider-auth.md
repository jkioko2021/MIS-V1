---
name: Git provider authentication
description: Distinguish managed Git CLI authentication from generic GitHub API connections.
---

Git commands use Replit's Git provider/source-control connection, not the
generic GitHub App integration. A connection reported as healthy does not
prove that its saved Git credentials can push.

**Why:** The source-control connection reported healthy OAuth authorization
while GitHub rejected actual pushes with invalid-credential errors.

**How to apply:** Use normal Git commands through the managed provider.
For credential rejection, check the source-control connection's OAuth
reauthorization context. Source-control providers can authenticate Git without
being attached as ordinary integrations; their integration reconnect cards
may therefore be unavailable. If that card fails, use Replit's Git Providers
settings, the documented recovery route. Reconnecting only a generic
Connected Service may not repair Git authentication. Never extract or print
tokens, and never force-push to work around authentication failure.

# Security Policy

This is a curated content repository — there is no application runtime, no auth, no user data. The main "security" surface is the data files and CI workflows.

## Reporting an issue

If you find something that could harm users (e.g. a malicious link slipped into the catalog, a compromised resource, or a vulnerable dependency in the build scripts), please report it privately:

- Email: **3dresources@devanshutak.xyz**
- Or open a GitHub issue marked `[security]` (only if the issue is not actively exploitable).

Please do not post details of a live exploit in a public issue. We will respond within 7 days and credit reporters on request.

## Scope

In scope:

- Malicious or compromised entries in `data/*.yml`
- Vulnerable npm dependencies (`npm audit` findings)
- CI workflow misconfigurations that could leak tokens or run untrusted code

Out of scope:

- Bugs in third-party sites we link to — please report those upstream.

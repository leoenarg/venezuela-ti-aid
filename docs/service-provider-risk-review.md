# Service Provider Risk Review

## Summary

This project currently depends on free-tier infrastructure. That keeps costs at zero, but it does not remove legal or privacy duties.

The operator must review provider terms before production deployment and periodically after major provider policy updates.

## Vercel

Expected role: hosting and deployment.

Review before launch:

- Privacy Policy: https://vercel.com/legal/privacy-policy
- Terms: https://vercel.com/legal/terms
- Data Processing Addendum: https://vercel.com/legal/dpa
- Acceptable Use Policy if applicable: https://vercel.com/legal/aup

Implementation notes:

- Do not log personal report payloads.
- Do not expose environment variables.
- Prefer static/client-side pages where possible.
- Avoid edge/server functions that process sensitive data unless needed.

## Supabase

Expected role: PostgreSQL database, Storage, and API.

Review before launch:

- Privacy Policy: https://supabase.com/privacy
- Terms: https://supabase.com/terms
- Data Processing Addendum: https://supabase.com/dpa

Implementation notes:

- RLS must stay enabled.
- Anonymous direct SELECT must stay denied.
- Storage upload paths must not contain cedulas or names.
- Bucket rules must restrict file type and size.
- Do not expose service-role keys to the browser.

## GitHub

Expected role: source code hosting, code ownership metadata, and pull request automation through GitHub Actions.

Implementation notes:

- Never commit secrets or production exports.
- Do not place real reports in issues, pull requests, or screenshots.
- Keep legal docs and schema changes reviewed.
- Keep CODEOWNERS current when project maintainers change.
- GitHub Actions workflows must not print environment secrets, production data, Supabase exports, audit exports, or submitted user records.
- Version/tag automation currently expects `VERSION` to match the next `v.Numero.YYMMDDletra` tag before merging to `main`.

## Future Providers

Before adding any new provider, document:

- What data is transferred.
- Why it is necessary.
- Whether data includes minors.
- Whether the provider stores, trains on, or shares data.
- How users are informed.
- How the provider is removed if risk becomes unacceptable.

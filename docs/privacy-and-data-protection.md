# Privacy and Data Protection Policy Draft

## Purpose

This project collects reports only for humanitarian assistance, family reunification, and emergency information sharing with the person searching through exact-match verification.

It must not be used for surveillance, persecution, harassment, commercial profiling, political targeting, extortion, public shaming, or any purpose that can endanger a person.

## Data Collected

The application may collect:

- Full name.
- Cedula or identity number.
- Date of birth.
- Age and gender.
- Life status: missing, found alive, deceased, or critical health.
- Location or institution category.
- Optional location detail.
- Optional last-known state, city, and parish.
- Optional optimized grayscale photo.
- Whether the person is a minor.
- Consent acknowledgement and terms version.

## Sensitive Data Rules

- Collect only what is necessary.
- Do not expose a public index of names.
- Do not allow broad search by name, state, city, age, gender, or photo.
- Do not provide CSV exports from public interfaces.
- Do not add tracking or behavioral analytics.
- Do not submit user data to AI APIs, facial recognition APIs, marketing APIs, or enrichment providers.

## Minors

When `age < 18`, `is_minor` must be true.

Search results for minors must be masked or structurally reduced. The current schema masks name, location detail, city, parish, and image URL in the exact-match RPC.

## Search

Public search must use exact `cedula` + `birth_date`. A failed search must return a generic message and must not reveal whether either value exists.

## Infrastructure Providers

The app currently expects:

- Vercel for hosting.
- Supabase for database and storage.
- GitHub for source control.

These services may process data as infrastructure providers under their own policies and agreements. The project operator must review and accept their current terms before deployment:

- Vercel Privacy Policy: https://vercel.com/legal/privacy-policy
- Vercel Terms: https://vercel.com/legal/terms
- Vercel DPA: https://vercel.com/legal/dpa
- Supabase Privacy Policy: https://supabase.com/privacy
- Supabase Terms: https://supabase.com/terms
- Supabase DPA: https://supabase.com/dpa

Do not tell users that no third party can ever process their data. Say that the project limits access and uses infrastructure providers required to operate the service.

## Retention

Before production, define:

- How long unresolved reports stay active.
- How found/deceased reports are archived.
- How people request correction or deletion.
- Who can handle deletion requests.
- How backups are purged.

Until a policy is approved, avoid indefinite retention promises.

## Incident Handling

If data exposure is suspected:

1. Stop new writes if needed.
2. Preserve audit evidence.
3. Rotate credentials.
4. Review Supabase RLS, Storage policies, and Vercel environment variables.
5. Notify affected users or authorities if required by applicable law.
6. Document remediation.

## Legal Notice

This document is a project governance draft, not legal advice. A qualified legal reviewer should validate it before public launch.

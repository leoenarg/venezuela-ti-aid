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
- Life status: extraviada/missing, found alive, deceased, or under medical supervision.
- Location or institution category.
- Optional location detail.
- Optional last-known state, city, and parish.
- Optional validated and optimized photo.
- Whether the person is a minor.
- Consent acknowledgement and terms version.
- Official legal request intake data when a competent authority submits a court-order request.
- Defensive technical audit records for abuse prevention, including timestamp, approximate IP or IP hash, user-agent, request path, action type, status, and minimized metadata.

## Sensitive Data Rules

- Collect only what is necessary.
- Do not expose a public index of names.
- Do not allow broad search by name, state, city, age, gender, or photo.
- Do not provide CSV exports from public interfaces.
- Do not add tracking or behavioral analytics.
- Do not submit user data to AI APIs, facial recognition APIs, marketing APIs, or enrichment providers.
- Do not use audit logging for invasive tracking, behavioral profiling, advertising, or political monitoring.
- Do not collect exact GPS location, contacts, third-party cookies, or aggressive device fingerprinting.

## Minors

When `age < 18`, `is_minor` must be true.

Search results for minors must be masked or structurally reduced. The current schema masks name, location detail, city, parish, and image URL in the exact-match RPC.

Photos of minors must not be shown in the public exact-match result. If a family member or legal guardian needs visual confirmation, the recommended flow is assisted verification: exact identity data first, then an authorized operator reviews the image privately and only confirms or rejects the match. Do not add automated face matching or public photo reveal for minors without legal and humanitarian review.

## Input Validation

The report form should help users enter clean data without being hostile. `full_name` is filtered and validated to allow normal name characters: Unicode letters, accents, `ñ`, dieresis, apostrophe, period, hyphen, and spaces. Numbers and unrelated symbols are rejected. The same rule must exist client-side and server-side.

## Search

Public search must use exact `cedula` + `birth_date`. A failed search must return a generic message and must not reveal whether either value exists.

## Defensive Audit

The project may keep append-only audit records for loads, searches, result views, downloads, and administrative decisions. The purpose is forensic integrity, abuse prevention, and lawful response to competent authorities.

Audit metadata must be minimized. When identity values are useful for investigation, store salted hashes instead of raw cedula or birth date whenever possible. Audit failures should not block humanitarian reporting or searching unless a future sensitive download route explicitly requires audit success.

## Legal Authority Requests

The `/legal/request` portal is an intake channel for competent authorities with a valid court order or equivalent legally binding order. It does not provide automatic access, public links, or direct downloads.

Any legal disclosure must be:

- Reviewed by an authorized project operator or qualified legal reviewer.
- Limited to the exact scope of the order.
- Minimized to the necessary fields.
- Heightened-review when minors or photos are involved.
- Logged in defensive audit records.
- Delivered through a secure, non-public channel.

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

Operational contact for correction, deletion, takedown, abuse reports, false reports, general information, collaboration, or donation-related questions:

```text
venezuelatiaid@gmail.com
```

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

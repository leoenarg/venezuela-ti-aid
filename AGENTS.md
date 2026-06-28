# Agent Instructions

Read `brain.md` before making changes.

This is a humanitarian missing persons platform handling sensitive personal data. Preserve the privacy-first behavior, exact-match search, Supabase RLS, defensive audit logging, legal notices, and client-side image validation.

Required context before touching data flows:

- `brain.md`
- `docs/privacy-and-data-protection.md`
- `docs/collaboration-policy.md`
- `docs/environments.md`
- `supabase/schema.sql`
- `supabase/audit.sql`

Never expose secrets, real reports, cedulas, birth dates, photos, audit exports, or production data to AI tools, public logs, issues, pull requests, screenshots, or external services.

Do not add public directories, name search, bulk exports, tracking scripts, invasive fingerprinting, GPS collection, paid AI APIs, facial recognition, biometric matching, or anonymous direct reads.

Do not chain anonymous `insert(...).select()` on `missing_persons`; RLS denies direct reads by design. Generate IDs server-side before insert when needed. Keep minor photos/details restricted to assisted human verification, not public exact-match results.

`/legal/request` is intake-only for authorities with court orders. Do not add automatic data downloads, public export links, unauthenticated delivery URLs, or bulk disclosure tools. Legal exports require human legal/privacy review and audit.

Public operational contact: `venezuelatiaid@gmail.com`. It may be referenced for general information, abuse reports, correction/removal requests, collaboration, and donation-related questions. Donations must never grant data access.

Run `npm run lint` and `npm run build` before handing off code changes.

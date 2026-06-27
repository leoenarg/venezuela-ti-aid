# AI Project Context: venezuela-ti-aid

## Mission

venezuela-ti-aid is a humanitarian, privacy-first web app for Venezuela. Its only acceptable purpose is helping families report and search for missing, found, deceased, or medically vulnerable people during emergencies.

This project handles sensitive personal data. Treat every change as safety-critical.

## Non-negotiable Principles

- Do not create public directories, public name search, feeds, maps of individuals, exports, or bulk listing features.
- Public search must require exact identity keys: `cedula` + `birth_date`.
- Never expose raw records through anonymous `SELECT`.
- Protect minors by masking or withholding extra details.
- Collect the least data needed for family reunification and humanitarian assistance.
- Do not add analytics, trackers, ads, heatmaps, session replay, marketing pixels, or AI enrichment APIs.
- Do not send user-submitted data to third-party AI services.
- Do not add paid services or processing pipelines; the project is free-tier oriented.
- Use client-side image compression before upload.
- Assume hostile scraping attempts and political misuse are realistic risks.

## Current Stack

- Next.js App Router
- Tailwind CSS
- Supabase PostgreSQL + Storage
- Vercel deployment from GitHub

## Important Routes

- `/` public dashboard, counters, Venezuela risk infographic.
- `/report` multi-step report form.
- `/search` exact-match private search.
- `/legal` public terms, privacy, collaboration, and provider notice.

## Data Model Notes

Primary table: `public.missing_persons`.

Sensitive fields include:

- `full_name`
- `cedula`
- `birth_date`
- `age`
- `gender`
- `status`
- `location_category`
- `location_detail`
- `last_known_state`
- `last_known_city`
- `last_known_parish`
- `image_url`
- `is_minor`

The public app uses RPC functions:

- `get_public_stats`
- `get_public_state_stats`
- `search_missing_person`

Anonymous direct reads are intentionally denied by RLS.

## Safe Development Workflow

1. Read `docs/privacy-and-data-protection.md` before touching data flows.
2. Read `supabase/schema.sql` before changing database behavior.
3. Run `npm run lint` and `npm run build`.
4. If adding a field, update:
   - Supabase schema
   - report form
   - search result masking
   - legal/privacy text when relevant
   - this file if the field changes risk

## Forbidden Changes Without Human Review

- Changing RLS policies to allow anonymous `SELECT`.
- Adding admin dashboards that expose personal data.
- Making images publicly browseable by predictable names.
- Storing precise GPS coordinates.
- Adding automated facial recognition, biometric matching, AI identification, or inference.
- Sharing records with law enforcement, political groups, employers, advertisers, data brokers, or media outlets.
- Adding OAuth/social login unless a privacy review is completed.
- Deploying with debug logs that include submitted data.

## Legal Posture

The included legal documents are operational templates, not legal advice. Before public deployment, a qualified lawyer or humanitarian data protection specialist should review local law, cross-border transfer obligations, data retention, takedown procedures, and emergency disclosure policies.

## Service Provider Notes

Vercel and Supabase are infrastructure providers. Do not promise users that these providers cannot process data. Instead, disclose that data may be processed by hosting, database, storage, security, and operational providers under their terms and data processing agreements.

Current references:

- Vercel Privacy Policy: https://vercel.com/legal/privacy-policy
- Vercel Terms: https://vercel.com/legal/terms
- Vercel DPA: https://vercel.com/legal/dpa
- Supabase Privacy Policy: https://supabase.com/privacy
- Supabase Terms: https://supabase.com/terms
- Supabase DPA: https://supabase.com/dpa

## Tone and UX

Use plain Spanish. Avoid legal intimidation. Make warnings clear and humane. The app should feel serious, calm, fast, and usable on low-bandwidth mobile networks.

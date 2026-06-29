# Collaboration Policy

## Who May Collaborate

Contributors may work on code, design, documentation, security hardening, accessibility, localization, and humanitarian workflows. Access to production data must be restricted to explicitly approved operators only.

## Data Access

Developers must not access production personal data unless there is a documented operational need and authorization from the project operator.

Use synthetic test data for development.

The preview Supabase project is owned by a trusted collaborator and must be treated as non-production. Do not copy production records, real photos, real cedulas, or audit exports into preview.

## Security Expectations

Contributors must:

- Keep secrets out of Git.
- Never commit `.env.local`.
- Avoid logging submitted data.
- Keep dependencies minimal.
- Use Node 22.x and npm 10.x. Do not regenerate `package-lock.json` with npm 11.
- Run lint and build before pushing.
- Keep `VERSION` synchronized with the next expected `v.Numero.YYMMDDletra` tag when opening pull requests to `main`, if the tag validation workflow is enabled.
- Preserve RLS and exact-match search behavior.
- Keep report creation compatible with RLS: do not add anonymous post-insert `SELECT` reads from `missing_persons`.
- Preserve client-side and server-side name validation for normal name characters only.
- Report suspected vulnerabilities privately.

Private operational contact for vulnerabilities, abuse reports, correction/removal requests, collaboration, and donation-related questions:

```text
venezuelatiaid@gmail.com
```

## Pull Requests and Ownership

Pull requests into `main` are checked by GitHub Actions. The current workflow validates the expected release version from tags using `.github/workflows/validate-tag.yml`.

The repository uses `.github/CODEOWNERS` for ownership review. Changes to privacy, Supabase schema, audit logging, RLS, storage policy, legal text, or deployment configuration should be reviewed by a code owner before merging.

Normal changes should flow through `feature/* -> preview -> main`. Pull requests into `preview` validate lint/build and should be tested against the preview Supabase project with synthetic data. Pull requests into `main` require production release review and VERSION validation.

Legal request or export changes require code-owner review and human legal/privacy review. The portal `/legal/request` is intake-only; contributors must not add automatic downloads, public export links, or unauthenticated delivery flows.

## AI Assistant Rules

AI tools may help write code and documentation, but must not receive real user-submitted personal data, photos, cedulas, birth dates, or private reports.

Do not paste production records into AI prompts.

AI-generated legal or safety text must be reviewed by humans.

## Forbidden Contributions

Do not contribute features for:

- Public people directories.
- Name search.
- Bulk exports.
- Automatic legal downloads or public export links.
- Tracking scripts.
- Facial recognition.
- Political scoring.
- Paid data enrichment.
- Automated law-enforcement sharing.
- Any workflow that increases risk to vulnerable people.

## Review Checklist

Before merging privacy-sensitive changes:

- Does the change collect new personal data?
- Is it necessary for humanitarian assistance?
- Is it disclosed in `/legal`?
- Is it protected by RLS or RPC boundaries?
- Does it preserve defensive audit logging without adding invasive tracking?
- Does it affect minors?
- Does it reveal minor photos or details outside assisted verification?
- Does it create a scraping path?
- Does it introduce a new provider or data transfer?
- Does it create, approve, deny, or deliver legal authority requests?
- Does the PR satisfy version/tag validation requirements?

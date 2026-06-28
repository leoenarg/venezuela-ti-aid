# Collaboration Policy

## Who May Collaborate

Contributors may work on code, design, documentation, security hardening, accessibility, localization, and humanitarian workflows. Access to production data must be restricted to explicitly approved operators only.

## Data Access

Developers must not access production personal data unless there is a documented operational need and authorization from the project operator.

Use synthetic test data for development.

## Security Expectations

Contributors must:

- Keep secrets out of Git.
- Never commit `.env.local`.
- Avoid logging submitted data.
- Keep dependencies minimal.
- Run lint and build before pushing.
- Keep `VERSION` synchronized with the next expected `v.Numero.YYMMDDletra` tag when opening pull requests to `main`, if the tag validation workflow is enabled.
- Preserve RLS and exact-match search behavior.
- Report suspected vulnerabilities privately.

## Pull Requests and Ownership

Pull requests into `main` are checked by GitHub Actions. The current workflow validates the expected release version from tags using `.github/workflows/validate-tag.yml`.

The repository uses `.github/CODEOWNERS` for ownership review. Changes to privacy, Supabase schema, audit logging, RLS, storage policy, legal text, or deployment configuration should be reviewed by a code owner before merging.

## AI Assistant Rules

AI tools may help write code and documentation, but must not receive real user-submitted personal data, photos, cedulas, birth dates, or private reports.

Do not paste production records into AI prompts.

AI-generated legal or safety text must be reviewed by humans.

## Forbidden Contributions

Do not contribute features for:

- Public people directories.
- Name search.
- Bulk exports.
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
- Does it create a scraping path?
- Does it introduce a new provider or data transfer?
- Does the PR satisfy version/tag validation requirements?

# Environments and Deployment Flow

## Objective

Protect production while allowing safe preview validation with two Supabase databases:

- `production`: Supabase owned by the project owner.
- `preview`: Supabase owned by a trusted collaborator.

Do not copy real production records into preview. Use synthetic test data.

## Branch Model

- `main`: production branch.
- `preview`: staging/preview branch.
- `feature/*`: working branches.

Recommended flow:

1. Work on `feature/*`.
2. Open PR into `preview`.
3. Merge into `preview` only after checks pass.
4. GitHub Actions deploys Vercel Preview from `preview`.
5. Open PR from `preview` into `main`.
6. Merge into `main` only after checks, CODEOWNERS review, and VERSION validation pass.
7. GitHub Actions deploys Vercel Production from `main`.

## Supabase

Production Supabase:

- Used only by Vercel Production.
- Must have `supabase/schema.sql` and `supabase/audit.sql` applied.
- Must have `supabase/legal-requests.sql` applied before enabling `/legal/request`.
- Holds real data.

Preview Supabase:

- Used only by Vercel Preview.
- Must have `supabase/schema.sql` and `supabase/audit.sql` applied.
- Must have `supabase/legal-requests.sql` applied for legal request smoke tests.
- Must use synthetic records.
- Should have a different `AUDIT_SALT` from production.

## Vercel

Set environment variables by Vercel environment.

Runtime convention:

- Node 20.x
- npm 10.x
- `package-lock.json` must be generated with npm 10, matching GitHub Actions.

Production:

```env
NEXT_PUBLIC_SUPABASE_URL=production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=production-service-role-key
AUDIT_SALT=production-random-salt
```

Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=preview-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=preview-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=preview-service-role-key
AUDIT_SALT=preview-random-salt
```

Development can point to preview unless a separate local Supabase is later available.

## Disable Early Vercel Git Deployments

Deployments must be controlled by GitHub Actions after validation. In Vercel, configure the project so Git-based automatic deployments do not deploy before CI passes.

Use one of these approaches:

- Disable automatic Git deployments if the Vercel UI allows it for the project.
- Or set an Ignored Build Step that always ignores Git-triggered Vercel builds, then let `.github/workflows/validate-tag.yml` deploy with Vercel CLI.

The GitHub Actions workflow uses:

- `vercel pull`
- `vercel build`
- `vercel deploy --prebuilt`

Required GitHub repository secrets:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## GitHub Ruleset for `preview`

Target:

```text
preview
```

Recommended rules:

- Require pull request before merging: enabled.
- Required approvals: at least 1.
- Require review from CODEOWNERS: enabled.
- Require status checks: enabled.
- Required status check: `Lint y build`.
- Require branches to be up to date before merging: enabled.
- Block force pushes: enabled.
- Restrict deletions: enabled.
- Allow bypass only for repository administrators or emergency maintainers.

Do not require `Validar VERSION` for `preview`; VERSION validation is only for production PRs and pushes to `main`.

## GitHub Ruleset for `main`

Target:

```text
main
```

Recommended rules:

- Require pull request before merging: enabled.
- Required approvals: at least 1.
- Require review from CODEOWNERS: enabled.
- Require status checks: enabled.
- Required status checks:
  - `Lint y build`
  - `Validar VERSION`
- Require branches to be up to date before merging: enabled.
- Block force pushes: enabled.
- Restrict deletions: enabled.
- Require linear history: optional.
- Allow bypass only for repository administrators or emergency maintainers.

## Production Release Checklist

Before merging `preview` into `main`:

1. Confirm preview deployment uses preview Supabase.
2. Run a synthetic report and exact search in preview.
3. Confirm audit events are written in preview Supabase.
4. If legal intake changed, submit a synthetic `/legal/request` test and confirm no data download is exposed.
5. Update `VERSION` to the expected `v.Numero.YYMMDDletra`.
6. Open PR from `preview` to `main`.
7. Wait for `Lint y build` and `Validar VERSION`.
8. Merge.
9. Confirm GitHub Actions deployed production.
10. Smoke test production.
11. Create and push the matching git tag.

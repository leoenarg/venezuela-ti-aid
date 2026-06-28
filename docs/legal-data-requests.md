# Legal Data Request Procedure

## Purpose

This procedure defines how `venezuela-ti-aid` receives, reviews, approves, denies, and fulfills requests from competent authorities when a valid court order or equivalent legally binding order exists.

The system must never provide automatic public downloads of missing-person records. The `/legal/request` portal is an intake form only.

## Public Intake Link

Public route:

```text
/legal/request
```

API route:

```text
/api/legal-request
```

The API stores requests in `legal.data_requests` using the server-side Supabase service role. Anonymous users do not have direct database access to legal request records.

Operational follow-up contact:

```text
venezuelatiaid@gmail.com
```

## Database Setup

Run this migration after the main schema and audit setup:

```text
supabase/legal-requests.sql
```

The migration creates:

- `legal.data_requests`
- RLS enabled on the legal schema/table.
- No direct access for `anon` or `authenticated`.
- `service_role` access for controlled server-side intake and future review tools.

## Minimum Acceptance Conditions

A legal request should not be fulfilled unless all conditions are met:

- The requester is a competent authority or authorized legal representative.
- The requester provides identifying information, official contact, institution, jurisdiction, and role.
- The request cites a valid court order or equivalent legally binding order.
- The order has a verifiable identifier, issuing authority, and date.
- The request has a specific, narrow scope.
- The requested records are necessary and proportionate to the legal purpose.
- The request does not ask for broad, speculative, political, commercial, or mass-export access.
- A project operator or appointed legal reviewer approves the request before any data leaves the system.

## Review Workflow

1. Receive request through `/legal/request`.
2. Record the generated folio from `legal.data_requests.id`.
3. Verify the official email, institution, jurisdiction, and issuing authority.
4. Validate the order through an independent channel when possible.
5. Confirm the requested scope is specific and proportional.
6. Determine whether minors are involved.
7. If minors are involved, apply extra minimization and require heightened review.
8. Approve, deny, or request clarification.
9. Record the decision in audit and in restricted operator notes.
10. If approved, prepare a minimized export matching only the authorized scope.
11. Deliver through a secure channel, not through a public unauthenticated link.
12. Record export hash, recipient, delivery time, and scope in audit.

## Delivery Rules

- Do not deliver data from the public frontend.
- Do not send exports by ordinary public links.
- Do not include unrelated records.
- Do not include photos of minors unless the order specifically requires them and the reviewer approves.
- Prefer minimized data: exact fields needed for the stated legal purpose.
- Preserve a copy of the export hash and delivery metadata for integrity verification.

## Audit Events

Current or reserved event types:

- `LEGAL_DATA_REQUEST_SUBMITTED`
- `LEGAL_DATA_REQUEST_REJECTED`
- `LEGAL_EXPORT_CREATED`
- `LEGAL_EXPORT_DENIED`
- `AUDIT_EXPORT`

Audit metadata must avoid raw cedulas, raw birth dates, and unnecessary personal details. Use salted hashes where possible.

## Denial Reasons

Requests should be denied or paused when:

- No valid legal order is provided.
- The requester identity cannot be verified.
- The scope is too broad.
- The request conflicts with humanitarian safety principles.
- The request appears political, commercial, retaliatory, or abusive.
- The request seeks data outside the jurisdiction or legal authority provided.
- The request would expose minors without a specific and necessary legal basis.

## Legal Disclaimer

This procedure is an operational template, not legal advice. A qualified lawyer or humanitarian data protection specialist should review it before public production use.

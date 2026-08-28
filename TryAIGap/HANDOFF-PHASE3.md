# TryAIGap — Phase 3 handoff notes

Phase 3 delivered: Documents, Team, Estimator, simulated Payment, Results + client-side
PDF, Review, Consultant console, public delegation page. Quality gates green:
`npm run build` / `lint` / `test` (72 tests, 13 files) + 32/32 integration checks
(`backend/scripts_integration_phase3.py`, boots uvicorn, restores seed state, exits).

## Backend changes (new, additive)

- `GET /api/v1/documents/{id}/download` — streams from local storage in dev
  (404 `DOCUMENT_FILE_MISSING` when the object is gone); 302 to a signed URL when
  Azure Blob is configured.
- `DocumentListItem` now also returns `area_key`, `question_id`, `created_at`,
  `uploaded_by_name` (list endpoint joins users).
- `GET /team` response now includes `invitations: [{invitation_id, full_name, email,
  area_key, status, created_at}]` alongside `items` (needed for resend/revoke UI).
- `GET /api/v1/delegations/{token}` (public, no auth) → `{delegate_name, question_code,
  question_text (Accept-Language, fallback en→es), status: sent|answered|expired,
  expires_at}`. Powers the public `/delegate/:token` page — the delegation loop is now
  end-to-end (email link → landing → POST answer).
- Payment webhook (`checkout.session.completed`) now also sets `plan='pro'` on the
  org's assessments, not just the organization — otherwise `GET /assessments/current`
  kept returning `plan: 'free'` and the UI never showed the upgrade.

## Mock-checkout contract (dev simulation)

- `POST /payments/checkout-session` (header `Idempotency-Key: <uuid>`) → 201
  `{payment_id, provider: 'stripe', checkout_url, status: 'pending'}`.
- Without real Stripe keys, `checkout_url = {success_url}?mock_session=cs_mock_{payment_id}`.
- The web app detects `mock_session=cs_mock_` (`src/lib/paymentFlow.ts`) and routes to the
  in-app simulated checkout `/payment/checkout?session=…&payment_id=…` instead of Stripe.
- "Pay" there POSTs `/api/v1/webhooks/stripe` `{type: 'checkout.session.completed',
  data: {object: {id: provider_ref, metadata: {payment_id}}}}` (dev backend trusts
  unsigned payloads), then polls `GET /payments/{id}` until final and lands on
  `/payment/success` (plan Free→Pro shown) or `/payment/cancel?reason=failed`.
- Payment context between pages is handed via sessionStorage
  (`tryaigap.lastPaymentId` / `tryaigap.lastProviderRef`).
- Real-Stripe deployments keep working: non-mock `checkout_url` → `window.location.assign`.

## Frontend architecture added

- Pages: `Documents` (drag&drop, 1 GB client cap + dev 25 MB note, area filter/link,
  mime icons, blob download/preview, delete confirm), `Team` (members + invitations,
  invite dialog, resend/revoke, delegation info card), `Estimator` (live quote via
  `lib/quote.ts`, per-area active/review/sessions 0-3, final-report switch, distributor
  code, self-service vs consultor-asesorado profile badge), `PaymentCheckout`,
  `PaymentResult`, `Results` (radar + dimension bars + heatmap + priorities +
  react-pdf preview/download), `Review` (request sync/async, polled status stepper,
  chapters, 3-dimension rating), `Consultant` + `ConsultantClient` (KPIs, filters,
  notes), `DelegateAnswer` (public).
- `src/pdf/ReportDocument.tsx` — branded 3-page A4 report (cover, methodology + SVG
  radar + dimension table, heatmap + priorities + next steps), fully localized.
- `src/components/RequireRole.tsx` + `src/lib/roles.ts` (`canAccessConsultant`);
  consultant nav item appears only for `role === 'consultant'`.
- New tested libs: `documents.ts` (1 GB validation, formatBytes), `quote.ts` (mirrors
  backend math), `paymentFlow.ts` (idempotency keys, mock parsing, polling),
  `reviewRating.ts`, `roles.ts`.
- `api/client.ts`: `apiBlob()` for authenticated binary downloads.
- Review id is stored per assessment in localStorage (`tryaigap.review.<id>`); rating
  completion in `tryaigap.rated.<reviewId>`.

## Known gaps / leftovers (for the final polish pass)

1. **No invite-acceptance endpoint** — invitation emails link to `/invite/{token}` but
   the backend has no accept route; invited members stay `invited`. Needs backend work
   + an `/invite/:token` page (mirrors `/delegate/:token`).
2. **No `GET /reviews` list** — the UI tracks the review via localStorage; on
   409 `REVIEW_ALREADY_REQUESTED` without a stored id it can only show an info message.
3. **No `GET` for consultant notes** — notes created in the session are shown locally;
   history is not exposed by the API.
4. **Bundle size** — @react-pdf/renderer pushed the main chunk to ~2.8 MB (897 kB gzip).
   Recommended: lazy-load `src/pdf/ReportDocument.tsx` via `React.lazy`/`import()` so
   the PDF engine only loads on /results.
5. **Backend 25 MB upload cap** — product spec allows 1 GB client-side; the dev backend
   streams into memory and rejects > 25 MB (413). The UI warns about this. Proper fix:
   streaming/chunked upload or direct-to-blob SAS uploads.
6. **Heatmap/priorities are sample data** — `result_service.build_result` returns static
   localized demo rows for areas/vectors/priorities; only the maturity block is real.
7. Storybook catalog + wireframe-brand sync remain open (as flagged in the brief).
8. `backend/scripts_integration_phase3.py` is a dev utility; keep it out of CI unless
   a disposable DB is used (it writes/deletes rows and flips plan state, restoring
   afterwards).

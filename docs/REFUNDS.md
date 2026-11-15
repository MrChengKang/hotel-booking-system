# Sandbox cancellation and refunds

Policy `FULL_BEFORE_CHECKIN_V1` gives a full refund when a guest submits the request
before **00:00 at the start of the hotel's local check-in date**. The deadline is
exclusive, calculated in the booking's saved hotel time zone, and displayed before
confirmation. This portfolio policy applies to existing and new online-paid bookings;
there are no partial refunds or cancellation fees in this implementation.

In My Bookings, open a paid booking, choose **Cancel booking and request refund**,
review the original-currency amount, and explicitly confirm. The backend compares
the expected amount with its own saved total. Guests cannot refund someone else's
booking; host/admin accounts cannot call guest refund endpoints. Mutations require
the existing CSRF token.

- `GET /api/bookings/{id}/cancellation`: local policy, deadline, quote, refund status.
- `POST /api/bookings/{id}/refund`: `{ "expectedAmount": 149.00 }`; returns HTTP 202
  with current status, including when Stripe has already confirmed success.
- `POST /api/payments/webhook`: also handles `refund.created`, `refund.updated`,
  `refund.failed`, after raw-body signature/timestamp/test-mode verification.

Add these three refund events to the local Stripe CLI listener or deployed sandbox
webhook destination. Keep the four existing `checkout.session.*` events. The endpoint
API version remains `2025-06-30.basil`.

The backend verifies the original test PaymentIntent before posting a refund to
Stripe. Amount, currency, booking ID, refund key, PaymentIntent and provider ID are
checked against durable records. A provider `succeeded` response or a canonical
refund retrieved after a webhook/reconciliation confirms success. A return URL or
frontend message cannot mark a refund successful.

Inventory is retained while a refund is initializing, pending, failed or under
manual review. Only verified success atomically changes the booking to
`CANCELLED / REFUNDED`, releases every reserved night exactly once, and inserts guest
and host notifications. Refund initiation/failure/review also notify both parties.
Duplicate and stale events cannot release inventory again or turn a refunded booking
back into a paid one.

One durable `stay_refund_attempts` row per booking fixes the amount, currency,
PaymentIntent, policy version and UUID before external calls. HTTP requests are
outside database transactions. Network retries use `stay-refund-{UUID}` with identical
parameters. A scheduler reconciles pending rows in batches of 25 every minute;
the open booking UI polls every five seconds. After 23 hours, an ambiguous request
without a provider ID is flagged for review rather than recreated beyond Stripe's
idempotency retention window. A later valid webhook can still resolve it.

Terminal failures, canceled provider refunds, and `requires_action` cases need manual
Stripe sandbox/support investigation. The application deliberately does not issue a
second refund automatically or offer an admin resolution tool in this phase. Direct
Dashboard refunds or partial refunds are outside this app-managed workflow; use the
website for the portfolio demonstration.

Schema: backend `src/main/resources/db/manual/008_refunds.sql`; the guarded
`tools/InstallRefundSchema.java` can create and verify the new table without changing
historical bookings/payments. Spring JPA development `ddl-auto=update` also discovers
the entity on restart. Never copy secret keys into frontend files.

Automated tests use H2 and fake provider gateways, covering eligibility/deadlines,
ownership/CSRF, amount tampering, concurrent requests, ambiguous network responses,
late/duplicate webhooks, failed refunds, reconciliation, notification deduplication,
and preventing late Checkout events from reopening refunded bookings. No genuine
user reservation is refunded by these tests. A full real Sandbox refund should be
performed explicitly from a disposable future-dated booking after backend restart.

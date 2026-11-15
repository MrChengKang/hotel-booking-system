# Stripe sandbox payments

This portfolio integration accepts Stripe **sandbox/test keys only**. It never accepts live secret keys.
Automated tests use an isolated fake gateway. A real Stripe Sandbox connection check also successfully created, retrieved and expired a card-only Checkout Session, and the signed expiration webhook received HTTP 204. No card was submitted and no application booking was created by that check; the complete website reservation-to-paid flow still needs a sandbox card test with your own account and keys.

## Local setup

1. Create a Stripe account and choose/create a Sandbox in the Stripe Dashboard.
2. In the backend `C:/Users/cheng/hotel-booking/.env.local`, fill:

   ```properties
   STAY_PAYMENTS_ENABLED=true
   STRIPE_SECRET_KEY=sk_test_your_local_test_secret
   STRIPE_WEBHOOK_SECRET=whsec_your_local_webhook_secret
   STAY_PAYMENT_SCHEDULING_ENABLED=true
   APP_FRONTEND_URL=http://localhost:3000
   ```

   These are placeholders. Do not paste keys into chat, commit them, or use `REACT_APP_` variables for them.
3. Install Stripe CLI from its official instructions, run `stripe login`, and forward local events:

   ```shell
   stripe listen --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed --forward-to http://localhost:8080/api/payments/webhook
   ```

   Put the **CLI listener's** `whsec_...` value in `STRIPE_WEBHOOK_SECRET` for local testing. A deployed endpoint has a different signing secret.

   On this workspace the official Windows CLI is installed locally at `.tools/stripe/stripe.exe` (ignored by Git).
   From the frontend project directory, use `& .\.tools\stripe\stripe.exe login` and replace `stripe` in the listener command with `& .\.tools\stripe\stripe.exe`.
   If the secret key has been filled in the backend local environment file, the CLI can instead use the process-local `STRIPE_API_KEY` environment variable; never pass secrets in a shared command or chat.
4. Restart Spring Boot and start React. `GET /api/payments/config` should return `enabled: true` and `mode: "test"`.
5. Create a new booking, open its details in **My Bookings**, then select **Pay with Stripe · Test mode**.
6. On Stripe's hosted page use test card `4242 4242 4242 4242`, any future expiry date and any three-digit CVC.
   Use `4000 0000 0000 9995` to test insufficient funds. Never use real card details.

Official references: [testing](https://docs.stripe.com/testing), [CLI installation](https://docs.stripe.com/stripe-cli), [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment).

## What the portfolio demonstrates

- The backend recomputes nightly prices and reserves inventory transactionally.
- New nonzero bookings begin as `PENDING_PAYMENT / UNPAID`; the initial hold is 35 minutes.
- A durable payment attempt is committed before the provider request. Its UUID is the Stripe idempotency key.
- Repeated clicks/resumed checkout reuse the same Session. No amount, guest ID, return URL or currency is accepted from the checkout request body.
- Card-only hosted Checkout keeps card data outside the application. Supported currencies are MYR, USD, EUR, GBP, SGD, AUD, CAD and JPY.
- The Stripe API version is pinned to `2025-06-30.basil`, verified against this sandbox to preserve explicit card-only Checkout; the newer Endive API rejects `payment_method_types`. Use this version for the deployed webhook endpoint too.
- Webhooks use the raw request bytes, HMAC-SHA256 signature verification, constant-time comparison and a five-minute timestamp tolerance.
- The server retrieves the canonical Session and checks its test mode, booking reference, attempt key, amount, currency and expiry before confirming payment.
- The browser's return URL is not payment proof. The return screen reads backend status; webhooks and the reconciliation worker update it.
- A successful payment produces `CONFIRMED / PAID` and guest/host notifications once. Duplicate event IDs are recorded transactionally.
- A zero-total booking is confirmed as `NOT_REQUIRED` without Stripe. Provider-supported minimum charges still apply to nonzero totals.

## Inventory and failure handling

The initial hold expires after 35 minutes. When the first Checkout is created late, its deadline may extend once to allow at least 31 minutes for Stripe's minimum Session window.
A worker checks up to 25 pending bookings per batch, rotating its cursor, with a one-minute delay between batches.
No-Session holds can expire locally. Once a payment attempt exists, the worker retrieves/retries that exact Session and closes it before releasing inventory.
Provider outages or ambiguous create responses **retain** rooms until the provider state can be verified. They never cause blind release or a second Session.
If a create remains unresolvable beyond Stripe's idempotency retention, operator reconciliation is required; inspect provider records before releasing inventory.

Unpaid cancellation first closes/reconciles Checkout. If payment wins the race, the booking remains paid/confirmed and inventory remains reserved.
Unexpected money received for an already closed reservation is surfaced as `REVIEW_REQUIRED`; the app does not silently reopen it.
Guest, hotel, room, booking and payment locks follow a consistent order; external Stripe calls run outside database transactions.

## Existing data and scope

Existing bookings stay `CONFIRMED / UNPAID` (or cancelled) and are not silently charged or converted to expiring holds.
Online checkout is only available for new pending-payment reservations. Historical unpaid reservations keep their prior cancellation rules.
Paid bookings now support the dedicated [sandbox cancellation/refund workflow](REFUNDS.md). Payouts to hosts and production/live charging remain outside this phase. The original unpaid cancel endpoint cannot bypass the refund workflow.

The checked backend helper `tools/InstallPaymentSchema.java` applies `007_payments.sql` idempotently, preserving booking statuses and enforcing the new unique keys.
It requires the MySQL JDBC driver on Java's classpath and must run from the backend directory so it can read the existing local environment file.
Do not blindly rerun the raw `ALTER TABLE` statements on an existing schema.

## Deployment

Use HTTPS, backend-only secret storage and an HTTPS webhook endpoint `/api/payments/webhook` accessible to Stripe.
Use the deployed endpoint's signing secret, configure `APP_FRONTEND_URL` to the public React origin, and register the four events above.
The webhook path alone is exempted from CSRF because it authenticates Stripe's signature; all user mutations still require session cookies and CSRF.
Keep the app clearly labelled **Sandbox / Test payments only** and include a demo recording plus test scenarios in the portfolio README.

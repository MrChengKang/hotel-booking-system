# Platform admin

The platform workspace is `/admin`: overview, hotel review, a read-only account
directory, bookings and refund tracking. The existing login page redirects ADMIN accounts to this workspace;
their profile menu also contains Admin Dashboard. Guest and host accounts cannot
load admin API data or make review decisions. Public registration still accepts
only User and Hotel Host.

## Create your administrator

Set these values in the **backend** `C:/Users/cheng/hotel-booking/.env.local`:

```dotenv
STAY_ADMIN_BOOTSTRAP_ENABLED=true
STAY_ADMIN_EMAIL=your-separate-admin-email@example.com
STAY_ADMIN_NAME=Platform Admin
STAY_ADMIN_PASSWORD=your-own-strong-password
```

Use your own email and password, not the placeholders above. The email must differ
from existing guest/host accounts. The password requires at least 12 characters and
at most 72 UTF-8 bytes. Never paste it into chat, commit it, or put it in React.

Restart Spring Boot from VS Code once. The server creates an ADMIN with a BCrypt
hash. Then set `STAY_ADMIN_BOOTSTRAP_ENABLED=false`, remove the plaintext password
from the file, and restart again. Sign in using that email/password. There are no
default administrator credentials.

The bootstrap never promotes an existing guest or host and never overwrites an
existing admin password. Use the existing Forgot password flow if an established
admin needs a password reset. Leave the flag false until all values are configured.

## Hotel review

1. Host prepares a draft with a nonempty description, an active room type, at least
   one hotel-level photo and at least one future sellable inventory night.
2. **Submit for review** keeps it DRAFT with `reviewStatus=PENDING` and hidden from
   guests. Hotel, room, inventory and photo edits are frozen during review. A host
   can withdraw the request to edit again, or archive the listing.
3. Admin opens the submission, reviews rooms/photos and explicitly confirms approval
   or requests changes. A rejection requires a note of 1–1000 characters.
4. Approval makes it `PUBLISHED / APPROVED`. Rejection leaves it `DRAFT / REJECTED`
   with a note visible to the owner, who can edit and resubmit. Review decisions and
   submissions notify the host.

Changing a published hotel's name, description, address or city returns it to draft
for another review. Operational room/photo/rate/inventory edits remain available
after approval; this phase doesn't moderate every subsequent operational change.
Existing bookings keep their saved snapshots and inventory reservations. Existing
published hotels are retained during migration rather than automatically delisted.

The review screen submits the version it displayed. The backend locks the hotel,
checks that version and PENDING state, then flushes before returning the new version.
Double/stale decisions or withdrawn submissions return 409 and require a refresh.
The latest decision time, reviewer ID and note are stored on the hotel. Private review
notes/timestamps are excluded from public hotel and guest favorites responses. Admins
can view draft media; other non-owning callers still receive 404.

## Bookings, payments and refund tracking

Open **Bookings** (`/admin/bookings`) to browse reservations across all hosts. Search
by booking reference or guest email, filter by hotel name, booking/payment status,
and narrow the hotel's local check-in date with **Check-in from/to**. Both date
boundaries are inclusive. Filters combine, searches treat `%` and `_` literally,
and results are paginated with newest records first.

**View booking** opens the saved hotel/room names, guest and host contacts, stay
dates, party size and nightly price snapshots. The payment/refund column shows the
current saved attempt, its amount, currency, provider references and timestamps.
Bookings without an online payment or refund attempt show an explicit empty state.
The detail link uses `?booking=<id>` so it can be reloaded or shared with another
authorized administrator. Filters remain in the URL when the detail is closed.

**Refund tracking** (`/admin/refunds`) starts with **Needs review**, covering FAILED
and REVIEW_REQUIRED. Switch to **Processing** for INITIALIZING/PENDING, **Succeeded**,
an individual state, or all refund records. These are saved internal states, not a
live Stripe event log. Booking/payment/refund states are shown separately because
a failed or pending refund can still have a confirmed booking with reserved rooms.

All amounts retain their original currency. Provider attempt amounts are converted
from minor units using that currency's precision (for example, JPY has no decimal
minor unit). The workspace does not add different currencies into a revenue total.

Refresh reloads saved records with GET requests. These screens do not create a
Checkout, cancel a booking, retry a refund, reconcile with Stripe or release rooms.
Existing guest payment/cancellation and background reconciliation flows continue to
own those changes. No schema migration or historical record backfill is required
for the booking/refund query screens.

## APIs and statistics

- `GET /api/admin/overview`
- `GET /api/admin/users?page=0&size=20&search=...`
- `GET /api/admin/hotels?page=0&size=20&reviewStatus=PENDING&search=...`
- `GET /api/admin/hotels/{id}`
- `POST /api/admin/hotels/{id}/decision` with
  `{ "decision": "APPROVE", "expectedVersion": 2, "note": "" }`
- `POST /api/host/hotels/{id}/submit`
- `GET /api/admin/bookings?page=0&size=20`
- `GET /api/admin/bookings/{id}`
- `GET /api/admin/refunds?page=0&size=20&status=NEEDS_REVIEW`

Booking list filters: `search`, `hotel` (saved hotel name), optional positive
`hotelId`, `status`, `paymentStatus`, `checkInFrom`, `checkInTo`, `page`, `size`.
Refund lists accept the same search/hotel/date/paging filters and their own
`status`: `NEEDS_REVIEW`, `PROCESSING`, `INITIALIZING`, `PENDING`, `SUCCEEDED`,
`FAILED`, `REVIEW_REQUIRED`, or empty for all. Page size is 1–100; invalid dates,
reversed date ranges and unknown states return 400. Missing booking details return
404. ADMIN is checked both by the request security rules and the service's current
database role. Guest and Host sessions receive 403, and anonymous callers receive
401.

List rows include the booking summary and minimal guest/host contacts. Details add
nightly prices and nullable payment/refund views. DTOs exclude password hashes,
checkout URLs, idempotency/request keys and unrelated account profile fields.

Mutations use the existing session/CSRF protection. Host PATCH status=PUBLISHED is
rejected; clients must submit for review. Host PATCH status=DRAFT withdraws/unpublishes.

`overview.users` is the total number of accounts, with host/admin subset counts.
Paid bookings include PAID, REFUND_PENDING and REFUND_FAILED because their payments
have not been successfully refunded. Refunded bookings have REFUNDED status. Refund
review counts include FAILED and REVIEW_REQUIRED. These are sandbox counts, not
revenue or combined monetary totals across different currencies.

Account suspension, role changes and manual refund resolution remain outside the
current workspace. Admin/Host workspaces currently use
English; the existing guest pages retain their six-language support.

Schema: backend `src/main/resources/db/manual/009_admin_review.sql` and guarded
`tools/InstallAdminReviewSchema.java`. The migration adds review metadata and a queue
index, keeps publication/booking states unchanged, and marks legacy published hotels
approved. No admin is created by the schema installer.

# Portfolio demo hotels

The optional offline importer adds a clearly marked fictional hotel catalogue to
the existing database. It is never executed by normal Spring Boot startup.

## Dataset

- One **STAY Demo Host** account owns all demo hotels. A Host can own multiple hotels.
- 16 hotels, two in each city: Kuala Lumpur, George Town, Langkawi, Singapore,
  Tokyo, Paris, London and New York.
- Two room types per hotel: Standard King and Deluxe Twin, with native hotel
  currencies, capacities and prices.
- 90 nights of inventory per room type, starting on the hotel's local current date:
  32 room types and 2,880 daily inventory rows.
- Three hotel-level images and one image per room type: 80 image records/files,
  reusing a bank of eight stock photographs. These illustrate fictional properties.

Every name begins with `[Demo]`; descriptions identify the fictional address and
stock photos. The import publishes these demo listings after the existing readiness
checks. This is a trusted offline import; the public Host API still requires Admin
approval. No guest accounts, bookings, payments, reviews or notifications are seeded.

## Run from the backend

Requires Python 3, JDK 21+ in `JAVA_HOME`, a packaged backend jar, and the existing
backend `.env.local` database/media configuration. Example backend location:
`C:/Users/cheng/hotel-booking`.

```powershell
./mvnw.cmd package -DskipTests
python tools/download-demo-photos.py
python tools/seed-demo-hotels.py
python tools/seed-demo-hotels.py --verify-h2
python tools/seed-demo-hotels.py --apply-demo
```

The command without a flag only prints the plan. H2 verification uses a separate
in-memory database, temporary media, and no `.env.local` import. The H2 driver is
available after the normal backend tests have downloaded it.

The apply command loads the backend configuration privately. It uses a temporary
loopback server on a random port to initialize the existing application services;
the server closes after completion. Admin bootstrap, payment scheduling and payment
provider keys are disabled for this import process. Database schema is validated,
not changed. The normal backend on port 8080 is not restarted or reconfigured.

Hotels, rooms, inventory and photo metadata are committed in one transaction. The
existing upload validator/storage service handles photo files and removes newly
stored files if the transaction rolls back. Only new room IDs receive inventory
inserts. The tool rejects a reserved demo email/slug owned by a different account.

Repeating the importer skips existing demo slugs. It does not restore user edits,
reset passwords, reopen archived hotels, extend old date ranges or change prices,
booked rooms, closures or any existing reservations. Future inventory can be
initialized normally in the Host Dashboard.

## Manage the demo hotels

The newly generated Host password is hashed in MySQL. Its initial login details are
written only to the ignored backend file **`.env.demo-host.local`**. Open that file
locally, sign in through the normal login page, then manage the 16 hotels at `/host`.
Do not paste the password into chat or commit the file. The reserved example email
is for local demonstration and does not receive password-reset email. Existing
Host/Admin passwords and roles are preserved.

Photos use the configured `STAY_MEDIA_DIRECTORY`, just like manual uploads. Keep
that directory on persistent storage when deploying. The source bank is cached in
ignored `.demo-assets/`; tool classes and a private execution log live in ignored
`.tools/demo-seed/`.

## Photo sources

The eight exact Unsplash photo IDs and captions are recorded in backend
`tools/demo-photo-sources.json`. Downloads use `images.unsplash.com` at a bounded
resolution and are re-encoded by the normal upload service. The images are reused
as stock illustrations, with no claim that they depict the fictional properties.
See the [Unsplash License](https://unsplash.com/license).

The isolated verification checks counts, available room quotes, public city/photo
responses, BCrypt login, idempotence, and preservation of existing hotel, account,
booking and booked-inventory records.

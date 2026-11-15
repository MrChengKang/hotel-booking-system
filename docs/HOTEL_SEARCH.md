# Hotel search

The public catalogue now filters in the database **before** counting and paginating. It does not fetch one page and then check individual hotels from the browser.

`GET /api/hotels` accepts:

| Parameter | Meaning |
| --- | --- |
| `city` | Optional exact city, case insensitive and trimmed; omit for all destinations |
| `checkIn`, `checkOut` | Both required together, ISO dates; checkout excluded; 1–366 nights |
| `rooms`, `guests` | 1–20 rooms, 1–1000 total guests; defaults 1 room and 2 guests |
| `minBeds` | Minimum beds **per room**, default 0, maximum 100 |
| `currency` | Optional ISO currency of the hotel, e.g. MYR, GBP or SGD |
| `minPrice`, `maxPrice` | Inclusive nightly price range, nonnegative, up to 2 decimals; requires currency |
| `sort` | `newest` (default), `price_asc`, `price_desc`; price sorting requires currency |
| `amenities` | Comma-separated codes; the hotel must offer **all** selected amenities |
| `page`, `size` | Zero-based page, size 1–100 |

Example:

```text
/api/hotels?city=Kuala%20Lumpur&checkIn=2027-01-01&checkOut=2027-01-04&rooms=2&guests=4&currency=MYR&maxPrice=300&amenities=WIFI,PARKING&sort=price_asc&page=0&size=12
```

The page keeps its existing `items`, `page`, `size`, `totalElements`, `totalPages` shape. Each hotel includes `amenities`, `startingNightlyPrice` and the corresponding matching `roomTypeId`. Public responses continue to omit private review metadata values.

## Price and availability rules

- With dates, the same active room type must cover **every** night with enough sellable stock (`total - booked - blocked`), no stop-sell night, sufficient guest capacity and enough beds. The nightly search price is that room's average inventory price rounded to 2 decimals, per room. Searching does not reserve inventory.
- Without dates, active room types are matched by their capacity, beds, physical room count and **base** rate. This is inspiration pricing; availability still requires dates.
- A room type must satisfy the price, capacity and bed conditions together. A hotel's cheap single room cannot qualify its expensive family room for a lower price filter.
- Price bounds apply to the room offer before choosing the lowest matching offer per hotel. The UI carries that room type into the detail page. Other room types remain visible there.
- Currency values are never treated as equivalent or converted using the homepage's sample exchange factors. Price filtering and sorting require an explicit hotel currency.
- Dated search excludes hotels where check-in is already in the past in the hotel's timezone. Java computes per-zone local dates, so MySQL timezone tables are unnecessary.
- Search results are an availability snapshot. The existing quote and transactional booking API always revalidate stock and the exact total before creating a reservation.
- Price ties use the hotel ID descending for stable pagination; newest means hotel ID descending. Inventory changes between separate page requests can still change results.

## Amenities

Supported hotel-level codes: `WIFI`, `PARKING`, `POOL`, `GYM`, `RESTAURANT`, `AIR_CONDITIONING`, `BREAKFAST`, `ACCESSIBLE`.

Hosts edit these through the existing hotel creation/edit form and API using an optional `amenities` array. Omitted/null preserves amenities for older clients; an explicit empty array clears them. Unknown codes are rejected. Ownership, pending-review and archived-hotel protections also apply. A changed set on a published hotel takes it back to draft for another admin review. Admin submission review displays the supplied facilities.

Existing hotels start with no declared facilities. **Do not infer or invent amenities from photos or descriptions.** A facility filter excludes a hotel until its host has supplied the matching value. “Breakfast available” does not imply breakfast is included in the rate, and general accessible facilities do not guarantee a particular room's suitability.

## Setup and verification

The amenities table has an explicit composite primary key `(hotel_id, amenity)`. Aiven enables `sql_require_primary_key`, so a UNIQUE constraint alone is insufficient. The JPA mapping uses the keyed `HotelFacility` entity so automatic schema creation also supplies this primary key.

Restart Spring Boot after installing these changes, then refresh React. The existing development `spring.jpa.hibernate.ddl-auto=update` creates `stay_hotel_amenities` without resetting data. The backend's `db/manual/010_hotel_amenities.sql` supplies additive MySQL DDL for environments using `validate` instead. Never drop or recreate the existing hotel/inventory/booking tables.

The SQL search uses MySQL 8 window functions and bound parameters with allowlisted sort expressions. H2 in MySQL mode covers search correctness and HTTP validation, including unavailable hotels preceding valid matches, full-night coverage, blocked/booked/closed stock, all-amenity matching, same-room qualification, base versus dated pricing, currencies, ownership and review behavior. Existing auth/payment/refund/admin regressions should also pass. Browser QA covers responsive layout; a live Aiven deployment still needs a smoke test after restart.

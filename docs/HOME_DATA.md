# Homepage data and working actions

The homepage uses the published hotel catalogue and guest review records. It no longer renders a static second destination list, a newsletter preview, invented hotel-type destinations, or illustrative guest quotes.

| Section | Source / action |
| --- | --- |
| Search city suggestions | Shared `GET /api/hotels/destinations` response; the city cards and suggestions make one request per homepage mount |
| Destination cards | Published hotels grouped by city, actual hotel count and uploaded cover |
| Featured hotels | `GET /api/hotels`; database room rates and links to real hotel IDs |
| Room search collections | Real `rooms`, `guests` and `minBeds` query parameters on `/hotels`; no claims about boutique/luxury/beachfront classification |
| Recent guest reviews | `GET /api/hotels/review-highlights`; latest three review records, including low ratings |
| Saved-stay planning | Logged-in visitors open `/wishlist`; anonymous visitors open `/login?next=%2Fwishlist` |

The hero photography, benefits text, booking instructions and planning illustration are presentation content. They do not claim to be live inventory, guest ratings or hotel counts. No email address is collected or subscription success simulated.

## Review highlights contract

`GET /api/hotels/review-highlights` is a public, read-only endpoint returning an array with up to three objects:

```json
{
  "id": 1,
  "authorName": "Guest display name",
  "rating": 4,
  "comment": "The comment the guest actually submitted",
  "createdAt": "2026-11-15T00:00:00Z",
  "hotelId": 10,
  "hotelName": "Current published hotel name",
  "city": "Raub"
}
```

- Reviews are created through the existing booking review API, which checks the guest's ownership, confirmed reservation status and the hotel's local checkout date.
- Highlights exclude draft/archived hotels and reservations that are no longer confirmed. Filtering happens before the limit.
- Sort order is `createdAt DESC, id DESC`. Editing a review updates its text/rating without inventing another record or boosting its original creation date.
- No minimum star rating, sample text, author photos or fabricated fallback reviews are applied.
- Only fields already suitable for public reviews are returned: no emails, user/booking IDs, booking references, payment details or password hashes.
- Zero reviews hides this optional section. One or two reviews use an appropriately sized grid. Network/server failures offer a retry. During a frontend-first rollout, a 400 (numeric-ID route fallback) or 404 from an older backend hides the optional section until the backend is restarted.
- Links open the corresponding real hotel page, where the existing review list is available.

## Searching

City suggestions show up to the 12 cities provided by the destination endpoint. Free-text city entry still works if that request fails or a city is not in the first 12. Full city names, including commas, are preserved.

Room collections describe room requirements rather than asserting that particular hotel categories exist. Without dates, the search uses active room types and physical capacity; the visitor adds dates to check actual nightly inventory.

## Operation

No database migration or seed data is required. Restart Spring Boot to load the review endpoint, then refresh the frontend. Existing hotels, reviews and bookings are unchanged. All new guest-facing copy is translated into the six supported languages.

Tests cover shared city suggestions, comma-containing city names, actual collection query parameters, sign-in return paths, real review text/ratings/links, empty and retry states, latest-three ordering, listing visibility, reservation status and response privacy. Backend smoke validation can run with `ddl-auto=validate` and a read-only connection against Aiven without altering records.

import { saveBookingReview, replyToReview } from "./reviewApi";
import { markNotificationRead, markAllNotificationsRead, notificationTarget } from "./notificationApi";
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ headerName: "X-CSRF-TOKEN", token: "csrf" }) }); });
afterEach(() => { delete global.fetch; });
test("reviews and notification reads use session cookies and CSRF", async () => {
  await saveBookingReview(7, { rating: 5, comment: "Great" }); await replyToReview(3, 2, "Thank you"); await markNotificationRead(9); await markAllNotificationsRead();
  const changes = fetch.mock.calls.filter(([, options]) => options.method); expect(changes.map(([, options]) => options.method)).toEqual(["PUT", "PUT", "POST", "POST"]);
  for (const [, options] of changes) { expect(options.credentials).toBe("include"); expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf"); }
});
test("notification destinations only allow supported internal pages", () => {
  expect(notificationTarget("/bookings?booking=4")).toBe("/bookings?booking=4"); expect(notificationTarget("/host/reviews?hotelId=3")).toBe("/host/reviews?hotelId=3"); expect(notificationTarget("https://untrusted.invalid")).toBe("/notifications"); expect(notificationTarget("//untrusted.invalid")).toBe("/notifications");
});

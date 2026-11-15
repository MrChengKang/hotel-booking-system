import { finishRequest, hotelToday, loginDestination, money, requestKey, safeReturnPath } from "./liveBooking";

test("login routing respects roles and ignores stale booking-history destinations", () => {
  expect(loginDestination("user", "/bookings?booking=9")).toBe("/");
  expect(loginDestination("host", "/bookings")).toBe("/host");
  expect(loginDestination("host", "/host/bookings?hotelId=4")).toBe("/host");
  expect(loginDestination("user", null)).toBe("/");
  expect(loginDestination("host", null)).toBe("/host");
  expect(loginDestination("admin", null)).toBe("/admin");
  expect(loginDestination("admin", "/admin/hotels?page=2")).toBe("/admin/hotels?page=2");
  expect(loginDestination("admin", "/admin/bookings?search=guest%40example.com&booking=12&page=2")).toBe("/admin/bookings?search=guest%40example.com&booking=12&page=2");
  expect(loginDestination("admin", "/admin/refunds?status=NEEDS_REVIEW&booking=12")).toBe("/admin/refunds?status=NEEDS_REVIEW&booking=12");
  expect(loginDestination("host", "/admin/refunds?booking=12")).toBe("/host");
  expect(loginDestination("user", "/admin/bookings?booking=12")).toBe("/");
  expect(loginDestination("admin", "/host/rooms?hotelId=4")).toBe("/admin");
  expect(loginDestination("user", "/admin/hotels")).toBe("/");
  expect(loginDestination("user", "/host/inventory?hotelId=4")).toBe("/");
  expect(loginDestination("host", "/hotel/42?rooms=2")).toBe("/host");
  expect(loginDestination("host", "/host/rooms?hotelId=4")).toBe("/host/rooms?hotelId=4");
  expect(loginDestination("user", "/hotel/42?rooms=2&guests=3")).toBe("/hotel/42?rooms=2&guests=3");
  expect(loginDestination("user", "https://example.com")).toBe("/");
});

test("login return paths cannot redirect outside the booking site", () => {
  expect(safeReturnPath("https://example.com")).toBe("/");
  expect(safeReturnPath("//example.com")).toBe("/");
  expect(safeReturnPath("/login?next=anything")).toBe("/");
  expect(safeReturnPath("/hotel/42?rooms=2&guests=3")).toBe("/hotel/42?rooms=2&guests=3");
  expect(safeReturnPath("/bookings?booking=9")).toBe("/bookings?booking=9");
});
test("an uncertain request retains its UUID until success, separately for each account", () => {
  let count = 0;
  Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: () => `11111111-1111-4111-8111-${String(++count).padStart(12, "0")}` } });
  const intent = { roomTypeId: 77, checkIn: "2027-01-01", checkOut: "2027-01-03", rooms: 1, guests: 2 };
  const first = requestKey(800, intent);
  expect(requestKey(800, intent)).toBe(first);
  expect(requestKey(801, intent)).not.toBe(first);
  finishRequest(800, intent);
  expect(requestKey(800, intent)).not.toBe(first);
  sessionStorage.clear();
});
test("actual totals retain their database currency instead of applying demo conversion factors", () => {
  expect(money("750.00", "MYR", "en-US")).toContain("MYR");
  expect(money("750.00", "MYR", "en-US")).toContain("750.00");
  expect(hotelToday("Asia/Kuala_Lumpur")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("payment returns preserve an explicit checkout return without restoring ordinary bookings redirects", () => {
 expect(loginDestination("user", "/bookings?booking=7&payment=return")).toBe("/bookings?booking=7&payment=return");
 expect(loginDestination("user", "/bookings?booking=7&payment=cancelled")).toBe("/bookings?booking=7&payment=cancelled");
 expect(loginDestination("user", "/bookings?booking=7")).toBe("/");
 expect(loginDestination("host", "/bookings?booking=7&payment=return")).toBe("/host");
});

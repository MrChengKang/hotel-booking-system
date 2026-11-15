import { getAdminOverview, getAdminHotels, getAdminHotel, getAdminUsers, decideHotel, getAdminBookings, getAdminBooking, getAdminRefunds } from "./adminApi";
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ headerName: "X-CSRF-TOKEN", token: "csrf" }) }); });
afterEach(() => { delete global.fetch; });
test("administrator listing requests keep pagination and encode search filters", async () => {
  await getAdminOverview(); await getAdminHotels({ page: 2, reviewStatus: "PENDING", search: "Hotel & Spa" }); await getAdminUsers({ search: "host@example.com" }); await getAdminHotel(41);
  expect(fetch.mock.calls[0][0]).toMatch(/\/admin\/overview$/);
  const url = new URL(fetch.mock.calls[1][0]); expect(url.searchParams.get("page")).toBe("2"); expect(url.searchParams.get("reviewStatus")).toBe("PENDING"); expect(url.searchParams.get("search")).toBe("Hotel & Spa");
  expect(fetch.mock.calls[2][0]).toMatch(/\/admin\/users\?/); expect(fetch.mock.calls[3][0]).toMatch(/\/admin\/hotels\/41$/);
  expect(fetch.mock.calls[3][1].credentials).toBe("include");
});
test("review mutation includes CSRF and only the inspected decision payload", async () => {
  const payload = { decision: "REJECT", expectedVersion: 3, note: "Improve photos" };
  await decideHotel(41, payload); const [url, options] = fetch.mock.calls[1];
  expect(url).toMatch(/\/admin\/hotels\/41\/decision$/); expect(options.method).toBe("POST");
  expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf"); expect(options.credentials).toBe("include"); expect(JSON.parse(options.body)).toEqual(payload);
});
test("booking and refund monitoring use authenticated GET requests with encoded filters", async () => {
  const filters = { page: 2, search: "guest+test@example.com", hotel: "Hotel & Spa", status: "PENDING_PAYMENT", paymentStatus: "UNPAID", checkInFrom: "2026-12-01", checkInTo: "2026-12-31", hotelId: 41 };
  await getAdminBookings(filters); await getAdminBooking(72); await getAdminRefunds({ page: 1, status: "NEEDS_REVIEW", search: "ref & 2" });
  const bookingUrl = new URL(fetch.mock.calls[0][0]);
  Object.entries(filters).forEach(([key, value]) => expect(bookingUrl.searchParams.get(key)).toBe(String(value)));
  expect(bookingUrl.searchParams.get("size")).toBe("20");
  expect(fetch.mock.calls[1][0]).toMatch(/\/admin\/bookings\/72$/);
  expect(new URL(fetch.mock.calls[2][0]).searchParams.get("status")).toBe("NEEDS_REVIEW");
  expect(fetch.mock.calls.every(([, options]) => options.credentials === "include" && !options.method && !options.body)).toBe(true);
  expect(fetch.mock.calls.some(([url]) => url.endsWith("/auth/csrf"))).toBe(false);
});

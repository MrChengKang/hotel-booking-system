import { adminBookingPath, adminListPath, originalMoney, readAdminFilters, selectedBooking } from "./adminBookingUtils";

test("record currency formatting respects two, zero and three decimal minor units", () => {
  expect(originalMoney(14900, "MYR", "en-US", true)).toContain("149.00");
  expect(originalMoney(14900, "JPY", "en-US", true)).toContain("14,900");
  expect(originalMoney(14900, "KRW", "en-US", true)).toContain("14,900");
  expect(originalMoney(14900, "KWD", "en-US", true)).toContain("14.900");
  expect(originalMoney("149.00", "MYR")).toContain("MYR");
});
test("refund all statuses is distinct from the default needs-review filter", () => {
  expect(readAdminFilters(new URLSearchParams(), true).status).toBe("NEEDS_REVIEW");
  const allPath = adminListPath("refunds", { page: 0, status: "" });
  expect(allPath).toBe("/admin/refunds?status=ALL");
  expect(readAdminFilters(new URL(allPath, "http://localhost").searchParams, true).status).toBe("");
});
test("opening and closing a record preserves filters and paging for browser navigation", () => {
  const params = new URLSearchParams("search=guest%40example.com&hotel=City+Hotel&page=2&checkInFrom=2026-12-01");
  const opened = adminBookingPath("bookings", params, 72);
  expect(selectedBooking(new URL(opened, "http://localhost").searchParams)).toBe("72");
  expect(adminBookingPath("bookings", new URL(opened, "http://localhost").searchParams, null)).toBe(`/admin/bookings?${params}`);
  expect(readAdminFilters(new URLSearchParams("page=-1&size=500&status=UNKNOWN&checkInFrom=2026-02-30&hotelId=bad"))).toMatchObject({ page: 0, size: 20, status: "", checkInFrom: "" });
  expect(readAdminFilters(new URLSearchParams("page=2&size=50"))).toMatchObject({ page: 2, size: 50 });
  expect(selectedBooking(new URLSearchParams("booking=unsafe"))).toBeNull();
});

import { createBooking, getHotels, cancelBooking } from "./hotelApi";
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });
test("hotel filters are encoded and read with the same session cookie", async () => {
  fetch.mockResolvedValue(response(200, { items: [] }));
  await getHotels({ city: "Kuala Lumpur", page: 1 });
  expect(fetch.mock.calls[0][0]).toContain("city=Kuala+Lumpur");
  expect(fetch.mock.calls[0][0]).toContain("page=1");
  expect(fetch.mock.calls[0][1].credentials).toBe("include");
});
test("creation forwards the confirmed quote and CSRF header without an automatic retry", async () => {
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "csrf" })).mockRejectedValueOnce(new Error("Network failed"));
  const body = { roomTypeId: 70, requestKey: "11111111-1111-4111-8111-111111111111", expectedTotal: "750.00" };
  await expect(createBooking(body)).rejects.toThrow("Cannot reach");
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("csrf");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(body);
});
test("cancellation is a CSRF-protected POST and never a destructive GET", async () => {
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "csrf" })).mockResolvedValueOnce(response(200, { booking: { status: "CANCELLED" } }));
  await cancelBooking(90);
  expect(fetch.mock.calls[1][0]).toMatch(/\/bookings\/90\/cancel$/);
  expect(fetch.mock.calls[1][1].method).toBe("POST");
});

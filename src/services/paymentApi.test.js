import { startCheckout, getBookingPayment, checkoutUrl, getPaymentConfig, getCancellation, requestRefund } from "./paymentApi";
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ headerName: "X-CSRF-TOKEN", token: "csrf" }) }); });
afterEach(() => { delete global.fetch; });
test("checkout uses the session owner and CSRF without client amounts", async () => {
  await startCheckout(7); const [url, options] = fetch.mock.calls[1]; expect(url).toMatch(/\/bookings\/7\/checkout$/); expect(options.method).toBe("POST"); expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf"); expect(options.credentials).toBe("include"); expect(options.body).toBeUndefined(); await getBookingPayment(7); await getPaymentConfig();
});
test("checkout redirect only accepts the Stripe HTTPS host", () => {
  expect(checkoutUrl("https://checkout.stripe.com/c/pay/cs_test_example")).toBe("https://checkout.stripe.com/c/pay/cs_test_example");
  for (const url of ["http://checkout.stripe.com/pay", "https://checkout.stripe.com.evil.invalid/pay", "javascript:alert(1)", "https://user@checkout.stripe.com/pay", "https://checkout.stripe.com:123/pay"]) expect(() => checkoutUrl(url)).toThrow("invalid checkout link");
});

test("refund requires CSRF and sends only the expected server quote for confirmation", async () => {
  await getCancellation(7); expect(fetch.mock.calls[0][0]).toMatch(/\/bookings\/7\/cancellation$/);
  fetch.mockClear(); await requestRefund(7, 149);
  const [url, options] = fetch.mock.calls[1];
  expect(url).toMatch(/\/bookings\/7\/refund$/); expect(options.method).toBe("POST");
  expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf");
  expect(JSON.parse(options.body)).toEqual({ expectedAmount: 149 });
  expect(options.credentials).toBe("include");
});

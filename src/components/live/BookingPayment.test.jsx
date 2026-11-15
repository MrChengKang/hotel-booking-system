import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookingPayment from "./BookingPayment";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/paymentApi";
import { bookingStatus, canCancelBooking } from "../../utils/payment";
jest.mock("../../context/AuthContext"); jest.mock("../../services/paymentApi");
const booking = { id: 7, status: "PENDING_PAYMENT", paymentStatus: "UNPAID", expiresAt: "2026-12-01T12:00:00Z" };
const view = { bookingId: 7, bookingStatus: "PENDING_PAYMENT", paymentStatus: "UNPAID", expiresAt: booking.expiresAt, checkoutAvailable: true, cancellationRequested: false };
beforeEach(() => { jest.clearAllMocks(); useAuth.mockReturnValue({ user: { id: 1 } }); api.getBookingPayment.mockResolvedValue(view); api.startCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_fixture" }); });
test("return URL does not claim payment success until the backend confirms", async () => {
  render(<BookingPayment booking={booking} returnState="return" onChanged={jest.fn()} />);
  expect(screen.getByText(/Returning from Checkout does not confirm/)).toBeInTheDocument(); expect(screen.queryByText(/Sandbox payment confirmed by the server/)).not.toBeInTheDocument(); expect(await screen.findByRole("button", { name: "Pay with Stripe · Test mode" })).toBeEnabled();
});
test("checkout opens only through the backend and retains the room hold on errors", async () => {
  api.startCheckout.mockRejectedValueOnce(new Error("Checkout unavailable; hold retained")); render(<BookingPayment booking={booking} onChanged={jest.fn()} />); fireEvent.click(await screen.findByRole("button", { name: "Pay with Stripe · Test mode" })); expect(await screen.findByRole("alert")).toHaveTextContent("hold retained"); expect(api.redirectToCheckout).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Pay with Stripe · Test mode" })); await waitFor(() => expect(api.redirectToCheckout).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_fixture")); expect(api.startCheckout).toHaveBeenCalledWith(7);
});
test("unconfigured payments show setup information and disable checkout", async () => {
  api.getBookingPayment.mockResolvedValue({ ...view, checkoutAvailable: false }); render(<BookingPayment booking={booking} onChanged={jest.fn()} />); expect(await screen.findByRole("button", { name: "Pay with Stripe · Test mode" })).toBeDisabled(); expect(screen.getByText(/backend needs Stripe sandbox keys/)).toBeInTheDocument();
});
test("server-confirmed state requests booking refresh", async () => {
  api.getBookingPayment.mockResolvedValue({ ...view, bookingStatus: "CONFIRMED", paymentStatus: "PAID", checkoutAvailable: false }); const onChanged = jest.fn(); render(<BookingPayment booking={booking} onChanged={onChanged} />); await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
});
test("status labels distinguish paid, expired, legacy and zero-price reservations", () => {
  expect(bookingStatus(booking)).toBe("Awaiting test payment"); expect(bookingStatus({ ...booking, status: "EXPIRED" })).toBe("Expired · Unpaid"); expect(bookingStatus({ status: "CONFIRMED", paymentStatus: "PAID" })).toBe("Confirmed · Paid (test)"); expect(canCancelBooking({ status: "CONFIRMED", paymentStatus: "PAID" })).toBe(false); expect(canCancelBooking(booking)).toBe(true);
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BookingRefund from "./BookingRefund";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/paymentApi";
import { canCancelBooking, bookingStatus } from "../../utils/payment";
jest.mock("../../context/AuthContext");
jest.mock("../../services/paymentApi");
const booking = { id: 7, status: "CONFIRMED", paymentStatus: "PAID" };
const policy = { bookingId: 7, allowed: true, deadline: "2030-01-01T16:00:00Z", hotelTimeZone: "Asia/Kuala_Lumpur", refundAmount: 149, currencyCode: "MYR", status: "NOT_REQUESTED" };
beforeEach(() => {
  jest.clearAllMocks(); useAuth.mockReturnValue({ user: { id: 1 } });
  api.getCancellation.mockResolvedValue(policy);
  api.requestRefund.mockResolvedValue({ ...policy, allowed: false, status: "PENDING" });
});

test("paid cancellation requires explicit confirmation and uses the server refund quote", async () => {
  const onChanged = jest.fn(); render(<BookingRefund booking={booking} onChanged={onChanged} />);
  fireEvent.click(await screen.findByRole("button", { name: "Cancel booking and request refund" }));
  expect(api.requestRefund).not.toHaveBeenCalled();
  const confirmation = screen.getByRole("group", { name: "Confirm cancellation and refund" });
  expect(screen.getByText("Refund amount: MYR 149.00")).toBeInTheDocument();
  fireEvent.click(within(confirmation).getByRole("button", { name: "Keep booking" }));
  expect(api.requestRefund).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel booking and request refund" }));
  api.getCancellation.mockResolvedValue({ ...policy, allowed: false, status: "PENDING" });
  fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation and refund" }));
  await waitFor(() => expect(api.requestRefund).toHaveBeenCalledWith(7, 149));
  expect(await screen.findByText(/Refund pending. Your rooms stay reserved/)).toBeInTheDocument();
  expect(onChanged).toHaveBeenCalled();
});

test("expired policy cannot initiate refunds and failed refunds do not offer a second refund", async () => {
  api.getCancellation.mockResolvedValue({ ...policy, allowed: false, reason: "Online cancellation closes at midnight on the hotel's local check-in date." });
  const view = render(<BookingRefund booking={booking} onChanged={jest.fn()} />);
  expect(await screen.findByText(/Online cancellation closes/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cancel booking and request refund" })).not.toBeInTheDocument();
  view.unmount();
  api.getCancellation.mockResolvedValue({ ...policy, allowed: false, status: "FAILED" });
  render(<BookingRefund booking={{ ...booking, paymentStatus: "REFUND_FAILED" }} onChanged={jest.fn()} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("The refund failed. Your booking and rooms are retained.");
  expect(api.requestRefund).not.toHaveBeenCalled();
});

test("network ambiguity reloads authoritative status and never claims refund success", async () => {
  api.requestRefund.mockRejectedValue(new Error("Refund unavailable; rooms retained"));
  const onChanged = jest.fn(); render(<BookingRefund booking={booking} onChanged={onChanged} />);
  fireEvent.click(await screen.findByRole("button", { name: "Cancel booking and request refund" }));
  api.getCancellation.mockResolvedValue({ ...policy, allowed: false, status: "INITIALIZING" });
  fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation and refund" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("rooms retained");
  expect(await screen.findByText(/Refund request received/)).toBeInTheDocument();
  expect(screen.queryByText(/full test payment was refunded/)).not.toBeInTheDocument();
  expect(onChanged).toHaveBeenCalled();
});

test("server refund success refreshes the booking and displays cancellation only after success", async () => {
  api.getCancellation.mockResolvedValue({ ...policy, allowed: false, status: "SUCCEEDED" });
  const onChanged = jest.fn(); render(<BookingRefund booking={{ ...booking, paymentStatus: "REFUND_PENDING" }} onChanged={onChanged} />);
  expect(await screen.findByText("Your booking is cancelled and the full test payment was refunded. Your rooms have been released.")).toBeInTheDocument();
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  expect(canCancelBooking({ ...booking, paymentStatus: "REFUND_PENDING" })).toBe(false);
  expect(canCancelBooking({ ...booking, paymentStatus: "REFUND_FAILED" })).toBe(false);
  expect(bookingStatus({ status: "CANCELLED", paymentStatus: "REFUNDED" })).toBe("Cancelled · Refunded (test)");
});

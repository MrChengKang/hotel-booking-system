export function bookingStatus(booking) {
  if (booking.paymentStatus === "REFUNDED") return "Cancelled · Refunded (test)";
  if (booking.paymentStatus === "REFUND_PENDING") return "Refund pending · Rooms reserved";
  if (booking.paymentStatus === "REFUND_FAILED") return "Refund failed · Booking retained";
  if (booking.paymentStatus === "REVIEW_REQUIRED") return "Payment needs review";
  if (booking.status === "PENDING_PAYMENT") return "Awaiting test payment";
  if (booking.status === "EXPIRED") return "Expired · Unpaid";
  if (booking.status === "CANCELLED") return "Cancelled";
  if (booking.paymentStatus === "PAID") return "Confirmed · Paid (test)";
  if (booking.paymentStatus === "NOT_REQUIRED") return "Confirmed · No payment required";
  return "Confirmed · Unpaid";
}
export const canCancelBooking = booking => ["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && !["PAID", "REVIEW_REQUIRED", "REFUND_PENDING", "REFUND_FAILED", "REFUNDED"].includes(booking.paymentStatus);

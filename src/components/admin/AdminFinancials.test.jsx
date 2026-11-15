import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminBookings from "./AdminBookings";
import AdminRefunds from "./AdminRefunds";
import useDestinationRoute from "../../hooks/useDestinationRoute";
import * as api from "../../services/adminApi";
jest.mock("../../services/adminApi");

const booking = { id: 72, reference: "STAY-REFERENCE-72", hotelId: 41, roomTypeId: 7, hotelName: "City Hotel", roomName: "Courtyard King", checkIn: "2026-12-01", checkOut: "2026-12-03", rooms: 2, guests: 3, currencyCode: "MYR", total: "596.00", status: "CONFIRMED", paymentStatus: "PAID", createdAt: "2026-11-01T10:00:00Z", cancelledAt: null, expiresAt: null };
const guest = { id: 3, name: "Casey Guest", email: "guest@example.com" };
const host = { id: 4, name: "Avery Host", email: "host@example.com" };
const refund = { id: 6, status: "FAILED", amountMinor: 59600, currencyCode: "MYR", refundId: "re_fixture", paymentIntentId: "pi_fixture", policyVersion: "full-refund-v1", createdAt: "2026-11-01T11:00:00Z", updatedAt: "2026-11-01T12:00:00Z" };
const payment = { id: 5, status: "PAID", amountMinor: 59600, currencyCode: "MYR", sessionId: "cs_test_fixture", paymentIntentId: "pi_fixture", createdAt: booking.createdAt, paidAt: "2026-11-01T10:05:00Z", expiresAt: "2026-11-01T11:00:00Z", cancellationRequested: false };
const details = { booking, guest, host, nights: [{ date: "2026-12-01", unitPrice: "149.00" }, { date: "2026-12-02", unitPrice: "149.00" }], payment, refund, paymentMode: "test" };
const page = (items, extra = {}) => ({ items, page: 0, size: 20, totalPages: 1, totalElements: items.length, ...extra });
function Harness() {
  const route = useDestinationRoute();
  return route.adminView === "refunds" ? <AdminRefunds userId={21} params={route.params} onNavigate={route.navigatePath} /> : <AdminBookings userId={21} params={route.params} onNavigate={route.navigatePath} />;
}
function open(path) { window.history.replaceState({}, "", path); return render(<Harness />); }
beforeAll(() => {
  window.scrollTo = jest.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => {
  jest.clearAllMocks();
  api.getAdminBookings.mockResolvedValue(page([{ booking, guest, host, refundStatus: "FAILED" }]));
  api.getAdminBooking.mockResolvedValue(details);
  api.getAdminRefunds.mockResolvedValue(page([{ booking, guest, host, refund }]));
});
afterEach(() => { window.history.replaceState({}, "", "/"); });

test("booking filters initialize from the URL, submit on page zero, and reset", async () => {
  open("/admin/bookings?page=2&size=50&search=guest%40example.com&hotel=City&status=CONFIRMED&paymentStatus=PAID&checkInFrom=2026-12-01&checkInTo=2026-12-03&hotelId=41");
  await screen.findByRole("link", { name: `View booking ${booking.reference}` });
  expect(screen.getByLabelText("Reference or guest email")).toHaveValue("guest@example.com");
  expect(screen.getByLabelText("Check-in from (inclusive)")).toHaveValue("2026-12-01");
  expect(api.getAdminBookings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, size: 50, hotelId: "41", status: "CONFIRMED", paymentStatus: "PAID" }), expect.anything());
  fireEvent.change(screen.getByLabelText("Hotel name"), { target: { value: "Orchard" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => expect(api.getAdminBookings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, size: 50, hotel: "Orchard", search: "guest@example.com" }), expect.anything()));
  expect(new URLSearchParams(window.location.search).has("page")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
  await waitFor(() => expect(api.getAdminBookings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, search: "", hotel: "", status: "" }), expect.anything()));
  expect(window.location.search).toBe("");
});

test("invalid date ranges do not request a new list", async () => {
  open("/admin/bookings"); await screen.findByText("Courtyard King");
  fireEvent.change(screen.getByLabelText("Check-in from (inclusive)"), { target: { value: "2026-12-03" } });
  fireEvent.change(screen.getByLabelText("Check-in to (inclusive)"), { target: { value: "2026-12-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  expect(screen.getByRole("alert")).toHaveTextContent("on or before");
  expect(api.getAdminBookings).toHaveBeenCalledTimes(1);
});

test("pagination and a shared booking URL preserve the list filters when closing and going back", async () => {
  api.getAdminBookings.mockResolvedValue(page([{ booking, guest, host, refundStatus: "NOT_REQUESTED" }], { totalPages: 3, totalElements: 42 }));
  open("/admin/bookings?search=guest%40example.com");
  fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
  await waitFor(() => expect(api.getAdminBookings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: "guest@example.com" }), expect.anything()));
  const listPath = window.location.pathname + window.location.search;
  fireEvent.click(await screen.findByRole("link", { name: `View booking ${booking.reference}` }));
  const modal = await screen.findByRole("dialog", { name: "Booking details" });
  expect(await within(modal).findByText("Current payment record")).toBeInTheDocument();
  expect(new URLSearchParams(window.location.search).get("booking")).toBe("72");
  expect(new URLSearchParams(window.location.search).get("page")).toBe("1");
  expect(api.getAdminBookings).toHaveBeenCalledTimes(2);
  fireEvent.click(within(modal).getByRole("button", { name: "Close dialog" }));
  expect(window.location.pathname + window.location.search).toBe(listPath);
  const calls = api.getAdminBookings.mock.calls.length;
  act(() => { window.history.replaceState({}, "", `${listPath}&booking=72`); window.dispatchEvent(new PopStateEvent("popstate")); });
  expect(await screen.findByRole("dialog", { name: "Booking details" })).toBeInTheDocument();
  expect(api.getAdminBookings).toHaveBeenCalledTimes(calls);
});

test("direct detail links show original currency, current record identifiers and refresh without mutations", async () => {
  open("/admin/bookings?booking=72");
  const modal = await screen.findByRole("dialog", { name: "Booking details" });
  expect(await within(modal).findByText("cs_test_fixture")).toBeInTheDocument();
  expect(within(modal).getByText("re_fixture")).toBeInTheDocument();
  expect(within(modal).getByText("The refund failed and needs platform follow-up.")).toBeInTheDocument();
  expect(within(modal).getAllByText(/MYR\s*596\.00/).length).toBeGreaterThanOrEqual(3);
  expect(within(modal).getByText("host@example.com")).toBeInTheDocument();
  fireEvent.click(within(modal).getByRole("button", { name: "Refresh details" }));
  await waitFor(() => expect(api.getAdminBooking).toHaveBeenCalledTimes(2));
  expect(within(modal).queryByRole("button", { name: /Cancel booking|Pay|Retry|Issue refund/ })).not.toBeInTheDocument();
  expect(api.decideHotel).not.toHaveBeenCalled();
});

test("detail handles bookings without payment or refund records", async () => {
  api.getAdminBooking.mockResolvedValue({ ...details, payment: null, refund: null });
  open("/admin/bookings?booking=72");
  expect(await screen.findByText("No payment record has been created for this booking.")).toBeInTheDocument();
  expect(screen.getByText("No refund has been requested for this booking.")).toBeInTheDocument();
});

test("refund queue defaults to needs review, includes all and processing filters, and opens shared details", async () => {
  open("/admin/refunds");
  await screen.findByText("Courtyard King");
  expect(api.getAdminRefunds).toHaveBeenLastCalledWith(expect.objectContaining({ status: "NEEDS_REVIEW", page: 0 }), expect.anything());
  expect(screen.getByLabelText("Refund status")).toHaveValue("NEEDS_REVIEW");
  fireEvent.change(screen.getByLabelText("Refund status"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => expect(api.getAdminRefunds).toHaveBeenLastCalledWith(expect.objectContaining({ status: "" }), expect.anything()));
  expect(new URLSearchParams(window.location.search).get("status")).toBe("ALL");
  fireEvent.change(screen.getByLabelText("Refund status"), { target: { value: "PROCESSING" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => expect(api.getAdminRefunds).toHaveBeenLastCalledWith(expect.objectContaining({ status: "PROCESSING" }), expect.anything()));
  fireEvent.click(await screen.findByRole("link", { name: `View booking ${booking.reference}` }));
  expect(await screen.findByRole("dialog", { name: "Booking details" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/admin/refunds");
  expect(new URLSearchParams(window.location.search).get("status")).toBe("PROCESSING");
});

test.each([
  ["INITIALIZING", /being initialized/], ["PENDING", /refund is processing/], ["SUCCEEDED", /sandbox refund succeeded/], ["REVIEW_REQUIRED", /requires manual review/],
])("refund detail clearly describes %s without offering financial actions", async (status, message) => {
  api.getAdminBooking.mockResolvedValue({ ...details, refund: { ...refund, status, currencyCode: "JPY", amountMinor: 14900 } });
  open(`/admin/refunds?status=${status}&booking=72`);
  const modal = await screen.findByRole("dialog", { name: "Booking details" });
  expect(await within(modal).findByText(message)).toBeInTheDocument();
  expect(within(modal).getByText(/JPY\s*14,900/)).toBeInTheDocument();
  expect(within(modal).queryByRole("button", { name: /Retry|Refund|Approve|Cancel booking/ })).not.toBeInTheDocument();
});

test("booking lists expose loading, recoverable errors, empty states and refresh", async () => {
  let resolve;
  api.getAdminBookings.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  open("/admin/bookings");
  expect(await screen.findByText("Loading platform bookings…")).toBeInTheDocument();
  await act(async () => { resolve(page([])); });
  expect(await screen.findByText("No bookings match these filters")).toBeInTheDocument();
  api.getAdminBookings.mockRejectedValueOnce(new Error("Monitoring is temporarily unavailable."));
  fireEvent.click(screen.getByRole("button", { name: "Refresh bookings" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("temporarily unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Courtyard King")).toBeInTheDocument();
});

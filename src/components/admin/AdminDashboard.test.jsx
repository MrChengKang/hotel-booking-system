import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../../App";
import * as authApi from "../../services/authApi";
import * as adminApi from "../../services/adminApi";
import * as accountApi from "../../services/accountApi";
import * as notificationApi from "../../services/notificationApi";
jest.mock("../../services/authApi");
jest.mock("../../services/adminApi");
jest.mock("../../services/accountApi");
jest.mock("../../services/notificationApi");

const admin = { id: 21, name: "Platform Admin", email: "admin@example.com", role: "admin" };
const host = { id: 4, name: "Host Alex", email: "host@example.com", role: "HOST", createdAt: "2026-10-01T00:00:00Z" };
const hotel = { id: 41, name: "City Hotel", description: "A complete city hotel", address: "1 Main Road", city: "Kuala Lumpur", countryCode: "MY", currencyCode: "MYR", timeZone: "Asia/Kuala_Lumpur", status: "DRAFT", reviewStatus: "PENDING", reviewNote: "", submittedAt: "2026-11-01T00:00:00Z", reviewedAt: null, version: 3 };
const detail = { hotel, host, rooms: [{ id: 71, name: "Deluxe King", active: true, totalRooms: 3, maxGuests: 2, beds: 1, basePrice: 250, currencyCode: "MYR", description: "Room details" }], images: [{ id: 1, roomTypeId: null, url: "/api/media/1", altText: "Lobby" }] };
const page = items => ({ items, page: 0, size: 20, totalPages: 1, totalElements: items.length });
beforeAll(() => {
  window.scrollTo = jest.fn();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => {
  jest.clearAllMocks();
  authApi.readCurrentUser.mockResolvedValue(admin);
  accountApi.getFavorites.mockResolvedValue([]);
  notificationApi.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
  notificationApi.getNotifications.mockResolvedValue(page([]));
  adminApi.getAdminOverview.mockResolvedValue({ users: 12, hosts: 4, admins: 1, hotels: 5, pendingHotels: 1, publishedHotels: 3, bookings: 20, pendingPayments: 2, paidBookings: 10, refundedBookings: 3, refundsNeedingReview: 0, paymentMode: "test" });
  adminApi.getAdminHotels.mockResolvedValue(page([{ hotel, host, activeRooms: 1, photos: 1 }]));
  adminApi.getAdminHotel.mockResolvedValue(detail);
  adminApi.getAdminUsers.mockResolvedValue(page([{ ...host, role: "HOST" }]));
  adminApi.getAdminBookings.mockResolvedValue(page([]));
  adminApi.getAdminRefunds.mockResolvedValue(page([]));
  adminApi.decideHotel.mockResolvedValue({ ...hotel, status: "PUBLISHED", reviewStatus: "APPROVED", version: 4 });
});
afterEach(() => { window.history.replaceState({}, "", "/"); localStorage.removeItem("stay-preferences"); });
function open(path) { window.history.replaceState({}, "", path); return render(<App />); }

test.each(["user", "host"])("%s accounts cannot request administrator data", async role => {
  authApi.readCurrentUser.mockResolvedValue({ id: 1, name: "Other", role }); open("/admin/hotels");
  expect(await screen.findByRole("heading", { name: "Administrator access required" })).toBeInTheDocument();
  expect(adminApi.getAdminOverview).not.toHaveBeenCalled(); expect(adminApi.getAdminHotels).not.toHaveBeenCalled(); expect(adminApi.getAdminUsers).not.toHaveBeenCalled();
});

test("admin login returns to the requested review queue and profile exposes the dashboard", async () => {
  authApi.readCurrentUser.mockResolvedValue(null); authApi.login.mockResolvedValue(admin); open("/admin/hotels");
  await screen.findByRole("heading", { name: "Welcome back" });
  expect(new URLSearchParams(window.location.search).get("next")).toBe("/admin/hotels");
  fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: admin.email } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
  fireEvent.submit(screen.getByRole("form", { name: "Login" }));
  expect(await screen.findByRole("heading", { name: "Hotel submissions" })).toBeInTheDocument();
  expect(window.location.pathname).toBe("/admin/hotels");
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main navigation" })).getByRole("button", { name: "Your account", exact: true }));
  expect(screen.getByRole("menuitem", { name: "Admin Dashboard" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "My Bookings" })).not.toBeInTheDocument();
});

test("overview shows platform counts with a sandbox label", async () => {
  open("/admin");
  expect(await screen.findByText("Total accounts")).toBeInTheDocument();
  expect(screen.getByText("STRIPE SANDBOX · TEST DATA")).toBeInTheDocument();
  expect(screen.getByText("Awaiting review")).toBeInTheDocument();
  expect(screen.getByText(/not real revenue/)).toBeInTheDocument();
});

test("approving a hotel requires explicit confirmation and the inspected version", async () => {
  open("/admin/hotels"); fireEvent.click(await screen.findByRole("button", { name: "Review City Hotel" }));
  const modal = await screen.findByRole("dialog", { name: "Review hotel submission" });
  expect(await within(modal).findByText("A complete city hotel")).toBeInTheDocument();
  expect(within(modal).getByText("Deluxe King")).toBeInTheDocument();
  fireEvent.click(within(modal).getByRole("button", { name: "Approve hotel" }));
  expect(adminApi.decideHotel).not.toHaveBeenCalled();
  fireEvent.change(within(modal).getByLabelText("Review note (optional)"), { target: { value: "Listing checked" } });
  fireEvent.click(within(modal).getByRole("button", { name: "Confirm approval" }));
  await waitFor(() => expect(adminApi.decideHotel).toHaveBeenCalledWith(41, { decision: "APPROVE", expectedVersion: 3, note: "Listing checked" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("requesting changes requires an actionable note and never publishes", async () => {
  adminApi.decideHotel.mockResolvedValue({ ...hotel, reviewStatus: "REJECTED", reviewNote: "Add a clear lobby photo" });
  open("/admin/hotels"); fireEvent.click(await screen.findByRole("button", { name: "Review City Hotel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Request changes" }));
  fireEvent.submit(screen.getByRole("form", { name: "Confirm hotel decision" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Explain what the host needs to change.");
  expect(adminApi.decideHotel).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Review note (required)"), { target: { value: "Add a clear lobby photo" } });
  fireEvent.submit(screen.getByRole("form", { name: "Confirm hotel decision" }));
  await waitFor(() => expect(adminApi.decideHotel).toHaveBeenCalledWith(41, { decision: "REJECT", expectedVersion: 3, note: "Add a clear lobby photo" }));
});

test("stale review decisions require refresh instead of silently overwriting another decision", async () => {
  adminApi.decideHotel.mockRejectedValueOnce(Object.assign(new Error("Hotel review changed. Refresh."), { status: 409 }));
  open("/admin/hotels"); fireEvent.click(await screen.findByRole("button", { name: "Review City Hotel" }));
  fireEvent.click(await screen.findByRole("button", { name: "Approve hotel" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Hotel review changed");
  expect(screen.getByRole("button", { name: "Confirm approval" })).toBeDisabled();
  adminApi.getAdminHotel.mockResolvedValue({ ...detail, hotel: { ...hotel, version: 4 } });
  fireEvent.click(screen.getByRole("button", { name: "Refresh submission" }));
  fireEvent.click(await screen.findByRole("button", { name: "Approve hotel" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));
  await waitFor(() => expect(adminApi.decideHotel).toHaveBeenLastCalledWith(41, { decision: "APPROVE", expectedVersion: 4, note: "" }));
});

test("users list is read-only and searches with explicit filters", async () => {
  open("/admin/users");
  expect(await screen.findByRole("cell", { name: "host@example.com" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search accounts"), { target: { value: "Alex" } });
  fireEvent.click(screen.getByRole("button", { name: "Search users" }));
  await waitFor(() => expect(adminApi.getAdminUsers).toHaveBeenLastCalledWith({ page: 0, search: "Alex" }, expect.anything()));
  expect(screen.queryByRole("button", { name: /Delete|Suspend|Change role/ })).not.toBeInTheDocument();
});

test.each([["user", "bookings"], ["host", "bookings"], ["user", "refunds"], ["host", "refunds"]])("%s accounts cannot load admin %s or financial details", async (role, view) => {
  authApi.readCurrentUser.mockResolvedValue({ id: 1, name: "Other", role }); open(`/admin/${view}?booking=72`);
  expect(await screen.findByRole("heading", { name: "Administrator access required" })).toBeInTheDocument();
  expect(adminApi.getAdminBookings).not.toHaveBeenCalled(); expect(adminApi.getAdminRefunds).not.toHaveBeenCalled(); expect(adminApi.getAdminBooking).not.toHaveBeenCalled();
});

test("admin login preserves a shared financial record and queue filters", async () => {
  authApi.readCurrentUser.mockResolvedValue(null); authApi.login.mockResolvedValue(admin);
  adminApi.getAdminBooking.mockResolvedValue({ booking: { id: 72, reference: "SHARED-72", hotelName: "City Hotel", roomName: "King", rooms: 1, guests: 2, currencyCode: "MYR", total: "149.00", status: "CANCELLED", paymentStatus: "REFUNDED", checkIn: "2026-12-01", checkOut: "2026-12-02" }, guest: host, host, nights: [], payment: null, refund: null, paymentMode: "test" });
  const path = "/admin/refunds?status=SUCCEEDED&search=guest%40example.com&page=2&booking=72";
  open(path); await screen.findByRole("heading", { name: "Welcome back" });
  expect(new URLSearchParams(window.location.search).get("next")).toBe(path);
  fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: admin.email } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
  fireEvent.submit(screen.getByRole("form", { name: "Login" }));
  expect(await screen.findByRole("dialog", { name: "Booking details" })).toBeInTheDocument();
  expect(window.location.pathname + window.location.search).toBe(path);
  expect(await screen.findByText("Reference: SHARED-72")).toBeInTheDocument();
  expect(adminApi.getAdminRefunds).toHaveBeenLastCalledWith(expect.objectContaining({ status: "SUCCEEDED", search: "guest@example.com", page: 2 }), expect.anything());
});

test("overview pending payment and refund cards link to their filtered queues", async () => {
  open("/admin");
  fireEvent.click(await screen.findByRole("button", { name: "View pending payments" }));
  expect(await screen.findByRole("heading", { name: "Platform bookings" })).toBeInTheDocument();
  expect(screen.getByLabelText("Booking status")).toHaveValue("PENDING_PAYMENT");
  fireEvent.click(within(screen.getByRole("navigation", { name: "Admin navigation" })).getByRole("link", { name: /Overview/ }));
  fireEvent.click(await screen.findByRole("button", { name: "View refunds needing review" }));
  expect(await screen.findByLabelText("Refund status")).toHaveValue("NEEDS_REVIEW");
});

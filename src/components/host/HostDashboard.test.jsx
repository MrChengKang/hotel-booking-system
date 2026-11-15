import * as paymentApi from "../../services/paymentApi";
jest.mock("../../services/paymentApi");
import * as notificationApi from "../../services/notificationApi";
import * as reviewApi from "../../services/reviewApi";
jest.mock("../../services/notificationApi");
jest.mock("../../services/reviewApi");
import * as accountApi from "../../services/accountApi";
jest.mock("../../services/accountApi");
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import App from "../../App";
import * as auth from "../../services/authApi";
import * as api from "../../services/hostApi";
import { hotelToday } from "../../utils/liveBooking";
jest.mock("../../services/authApi");
jest.mock("../../services/hostApi");
const host = { id: 4, name: "Host Alex", role: "host" };
const hotel = { id: 41, name: "City Hotel", slug: "city-hotel", city: "Kuala Lumpur", address: "1 Main Road", countryCode: "MY", currencyCode: "MYR", timeZone: "Asia/Kuala_Lumpur", status: "DRAFT", description: "City stay" };
const room = { id: 71, hotelId: 41, name: "Deluxe King", code: "KING", maxGuests: 2, beds: 1, totalRooms: 3, basePrice: 250, active: true, description: "Room details" };
const today = hotelToday("Asia/Kuala_Lumpur");
const day = { date: today, totalRooms: 3, bookedRooms: 1, blockedRooms: 0, availableRooms: 2, nightlyPrice: 250, stopSell: false };
const page = items => ({ items, page: 0, size: 20, totalPages: 1, totalElements: items.length });
beforeAll(() => { window.scrollTo = jest.fn(); HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); }; });
beforeEach(() => {
 jest.clearAllMocks();
 paymentApi.getPaymentConfig.mockResolvedValue({ enabled: true, mode: "test", holdMinutes: 35 });
 paymentApi.getBookingPayment.mockResolvedValue(null);
 notificationApi.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
 notificationApi.getNotifications.mockResolvedValue({ items: [], page: 0, totalPages: 0 });
 reviewApi.getHotelReviews.mockResolvedValue({ summary: { reviewCount: 0, averageRating: null }, reviews: { items: [], page: 0, totalPages: 0 } });
 reviewApi.getBookingReview.mockResolvedValue({ eligible: false, reason: "Review available after check-out.", review: null });
 accountApi.getFavorites.mockResolvedValue([]);
 auth.readCurrentUser.mockResolvedValue(host);
 api.getHostOverview.mockResolvedValue({ hotels: 1, publishedHotels: 0, bookings: 7, confirmedBookings: 3 });
 api.getHostHotels.mockResolvedValue(page([hotel])); api.getHostHotel.mockResolvedValue(hotel); api.getHostRooms.mockResolvedValue([room]); api.getHostInventory.mockResolvedValue([day]);
 api.getHostBookings.mockResolvedValue(page([])); api.createHostHotel.mockResolvedValue(hotel); api.editHostHotel.mockResolvedValue(hotel); api.changeHotelStatus.mockResolvedValue(hotel); api.submitHostHotel.mockResolvedValue({ ...hotel, reviewStatus: "PENDING" }); api.createHostRoom.mockResolvedValue(room); api.editHostRoom.mockResolvedValue(room); api.initializeHostInventory.mockResolvedValue({ createdNights: 14 }); api.editHostInventory.mockResolvedValue(day);
});
afterEach(() => { window.history.replaceState({}, "", "/"); });
function open(path) { window.history.replaceState({}, "", path); render(<App />); }

test("Host overview displays actual aggregate statistics and links to management", async () => {
 open("/host");
 expect(await screen.findByRole("heading", { name: "Overview", exact: true })).toBeInTheDocument();
 expect(await screen.findByText("Total bookings", { exact: true })).toBeInTheDocument();
 expect(screen.getByText("7", { exact: true })).toBeInTheDocument();
 expect(api.getHostOverview).toHaveBeenCalled();
 fireEvent.click(within(screen.getByRole("navigation", { name: "Host navigation" })).getByRole("link", { name: "Hotels", exact: true }));
 expect(await screen.findByRole("heading", { name: "Your hotels" })).toBeInTheDocument();
 expect(window.location.pathname).toBe("/host/hotels");
});
test("User accounts cannot open host pages or request any host data", async () => {
 auth.readCurrentUser.mockResolvedValue({ id: 1, name: "Guest", role: "user" }); open("/host/inventory?hotelId=41");
 expect(await screen.findByRole("heading", { name: "Host access required" })).toBeInTheDocument();
 expect(api.getHostHotels).not.toHaveBeenCalled(); expect(api.getHostInventory).not.toHaveBeenCalled();
});
test("anonymous visitors return to the requested host page after login", async () => {
 auth.readCurrentUser.mockResolvedValue(null); auth.login.mockResolvedValue(host); open("/host/rooms?hotelId=41");
 await screen.findByRole("heading", { name: "Welcome back" });
 expect(new URLSearchParams(window.location.search).get("next")).toBe("/host/rooms?hotelId=41");
 fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "host@example.com" } });
 fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
 fireEvent.submit(screen.getByRole("form", { name: "Login" }));
 expect(await screen.findByRole("heading", { name: "Deluxe King" })).toBeInTheDocument();
 expect(window.location.pathname).toBe("/host/rooms");
});
test("default Host login lands on the dashboard and profile menu exposes it", async () => {
 auth.readCurrentUser.mockResolvedValue(null); auth.login.mockResolvedValue(host); open("/login");
 await waitFor(() => expect(screen.queryByText("Checking account…")).not.toBeInTheDocument());
 fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "host@example.com" } });
 fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } }); fireEvent.submit(screen.getByRole("form", { name: "Login" }));
 await screen.findByRole("heading", { name: "Overview", exact: true });
 expect(window.location.pathname).toBe("/host");
 fireEvent.click(screen.getByLabelText("Your account", { exact: true }));
 expect(screen.getByRole("menuitem", { name: "Host Dashboard" })).toBeInTheDocument();
 expect(screen.queryByRole("menuitem", { name: "My Bookings" })).not.toBeInTheDocument();
});
test("creating a hotel sends only editable fields and moves to room setup", async () => {
 api.getHostHotels.mockResolvedValue(page([])); open("/host/hotels");
 fireEvent.click(await screen.findByRole("button", { name: "Add hotel", exact: true }));
 const modal = within(screen.getByRole("dialog", { name: "Add hotel" }));
 fireEvent.change(modal.getByLabelText("Hotel name"), { target: { value: "New City Hotel" } });
 fireEvent.change(modal.getByLabelText("City"), { target: { value: "Kuala Lumpur" } });
 fireEvent.change(modal.getByLabelText("Address"), { target: { value: "1 New Road" } });
 fireEvent.click(modal.getByLabelText("Wi-Fi"));
 fireEvent.submit(modal.getByRole("form", { name: "Add hotel" }));
 await screen.findByRole("heading", { name: "Deluxe King" });
 expect(api.createHostHotel).toHaveBeenCalledWith({ name: "New City Hotel", slug: "new-city-hotel", description: "", address: "1 New Road", city: "Kuala Lumpur", countryCode: "MY", currencyCode: "MYR", timeZone: "Asia/Kuala_Lumpur", amenities: ["WIFI"] });
 expect(window.location.pathname).toBe("/host/rooms");
 expect(new URLSearchParams(window.location.search).get("hotelId")).toBe("41");
});
test("submitting for review requires confirmation, and failed saves keep form values", async () => {
 open("/host/hotels"); fireEvent.click(await screen.findByRole("button", { name: "Submit for review", exact: true }));
 expect(api.submitHostHotel).not.toHaveBeenCalled();
 fireEvent.submit(screen.getByRole("form", { name: "Submit hotel for review?" }));
 await waitFor(() => expect(api.submitHostHotel).toHaveBeenCalledWith(41));
 await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
 api.editHostHotel.mockRejectedValue(new Error("Server unavailable"));
 fireEvent.click(await screen.findByRole("button", { name: "Edit hotel", exact: true }));
 fireEvent.change(screen.getByLabelText("Hotel name"), { target: { value: "Changed hotel" } });
 fireEvent.submit(screen.getByRole("form", { name: "Edit hotel" }));
 expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
 expect(screen.getByLabelText("Hotel name")).toHaveValue("Changed hotel");
});
test("room creation and editing follow the immutable API field rules", async () => {
 open("/host/rooms?hotelId=41"); fireEvent.click(await screen.findByRole("button", { name: "Edit room type", exact: true }));
 fireEvent.change(screen.getByLabelText("Room type name"), { target: { value: "Updated King" } });
 fireEvent.click(screen.getByLabelText("Active and available for booking"));
 fireEvent.submit(screen.getByRole("form", { name: "Edit room type" }));
 await waitFor(() => expect(api.editHostRoom).toHaveBeenCalledWith(71, { name: "Updated King", description: "Room details", basePrice: "250", active: false }));
});
test("inventory initialization is explicit and daily editing never sends bookedRooms", async () => {
 open("/host/inventory?hotelId=41&roomId=71");
 fireEvent.click(await screen.findByRole("button", { name: `Edit inventory ${today}` }));
 expect(api.initializeHostInventory).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText("Total rooms for this date"), { target: { value: "2" } });
 fireEvent.change(screen.getByLabelText("Blocked rooms"), { target: { value: "1" } });
 fireEvent.change(screen.getByLabelText("Nightly rate (MYR)"), { target: { value: "300" } });
 fireEvent.click(screen.getByLabelText("Stop selling this date"));
 fireEvent.submit(screen.getByRole("form", { name: `Edit inventory · ${today}` }));
 await waitFor(() => expect(api.editHostInventory).toHaveBeenCalledWith(71, today, { totalRooms: 2, blockedRooms: 1, nightlyPrice: "300", stopSell: true }));
 await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
 fireEvent.click(screen.getByRole("button", { name: "Initialize dates", exact: true }));
 fireEvent.submit(screen.getByRole("form", { name: "Initialize inventory dates" }));
 await waitFor(() => expect(api.initializeHostInventory).toHaveBeenCalledWith(71, expect.objectContaining({ from: today })));
});
test("orders are read-only and unavailable hotel ids never expose other hotel rooms", async () => {
 api.getHostHotel.mockRejectedValue(Object.assign(new Error("Resource not found."), { status: 404 }));
 open("/host/rooms?hotelId=999");
 expect(await screen.findByRole("alert")).toHaveTextContent("Resource not found");
 expect(api.getHostRooms).not.toHaveBeenCalled();
});


test("pending hotels can be inspected but require withdrawal before room edits", async () => {
 api.getHostHotel.mockResolvedValue({ ...hotel, reviewStatus: "PENDING" });
 open("/host/rooms?hotelId=41");
 expect(await screen.findByRole("heading", { name: "Deluxe King" })).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Add room type" })).toBeDisabled();
 expect(screen.getByRole("button", { name: "Edit room type" })).toBeDisabled();
 expect(screen.getByText(/Withdraw it from Hotels/)).toBeInTheDocument();
 expect(api.getHostRooms).toHaveBeenCalledWith(41, expect.anything());
});

test("pending submissions can be withdrawn only after confirmation", async () => {
 api.getHostHotels.mockResolvedValue(page([{ ...hotel, reviewStatus: "PENDING" }]));
 open("/host/hotels");
 fireEvent.click(await screen.findByRole("button", { name: "Withdraw submission" }));
 expect(api.changeHotelStatus).not.toHaveBeenCalled();
 fireEvent.submit(screen.getByRole("form", { name: "Withdraw submission?" }));
 await waitFor(() => expect(api.changeHotelStatus).toHaveBeenCalledWith(41, "DRAFT"));
});

test("rejected hotels show the review note and can be edited and resubmitted", async () => {
 api.getHostHotels.mockResolvedValue(page([{ ...hotel, reviewStatus: "REJECTED", reviewNote: "Add a lobby photo" }]));
 open("/host/hotels");
 expect(await screen.findByText("Add a lobby photo")).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Edit hotel" })).toBeEnabled();
 expect(screen.getByRole("button", { name: "Submit for review" })).toBeEnabled();
});

import * as paymentApi from "./services/paymentApi";
jest.mock("./services/paymentApi");
import * as notificationApi from "./services/notificationApi";
import * as reviewApi from "./services/reviewApi";
jest.mock("./services/notificationApi");
jest.mock("./services/reviewApi");
import * as accountApi from "./services/accountApi";
jest.mock("./services/accountApi");
import { act, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import App from "./App";
import i18n from "./i18n";
import * as api from "./services/hotelApi";
import * as authApi from "./services/authApi";
import * as hostApi from "./services/hostApi";
import { addDays, todayKey } from "./utils/dates";
jest.mock("./services/hotelApi");
jest.mock("./services/authApi");
jest.mock("./services/hostApi");
const hotel = { id: 42, name: "STAY City Hotel", address: "1 Main Road", city: "Kuala Lumpur", countryCode: "MY", currencyCode: "MYR", timeZone: "Asia/Kuala_Lumpur", description: "A real hotel description", status: "PUBLISHED" };
const room = { id: 70, hotelId: 42, name: "Deluxe King", maxGuests: 2, beds: 1, basePrice: 200, active: true };
const start = todayKey(); const end = addDays(start, 3);
const quote = { roomTypeId: 70, roomName: room.name, currencyCode: "MYR", total: 750, nights: [{ date: start, unitPrice: 200 }, { date: addDays(start, 1), unitPrice: 250 }, { date: addDays(start, 2), unitPrice: 300 }] };
const summary = { id: 90, reference: "STAY-REAL-90", hotelId: 42, roomTypeId: 70, hotelName: hotel.name, roomName: room.name, checkIn: start, checkOut: end, rooms: 1, guests: 2, total: 750, currencyCode: "MYR", status: "CONFIRMED", paymentStatus: "UNPAID" };
const detail = { booking: summary, nights: quote.nights };
const page = items => ({ items, page: 0, size: 12, totalPages: 1, totalElements: items.length });
beforeAll(() => { window.scrollTo = jest.fn(); Element.prototype.scrollIntoView = jest.fn(); HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); }; Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: () => "11111111-1111-4111-8111-111111111111" } }); });
beforeEach(() => {
 jest.clearAllMocks();
 paymentApi.getPaymentConfig.mockResolvedValue({ enabled: true, mode: "test", holdMinutes: 35 });
 paymentApi.getBookingPayment.mockResolvedValue(null);
 notificationApi.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
 notificationApi.getNotifications.mockResolvedValue({ items: [], page: 0, totalPages: 0 });
 reviewApi.getReviewHighlights.mockResolvedValue([]);
 reviewApi.getHotelReviews.mockResolvedValue({ summary: { reviewCount: 0, averageRating: null }, reviews: { items: [], page: 0, totalPages: 0 } });
 reviewApi.getBookingReview.mockResolvedValue({ eligible: false, reason: "Review available after check-out.", review: null });
 accountApi.getFavorites.mockResolvedValue([]);
 hostApi.getHostOverview.mockResolvedValue({ hotels: 0, publishedHotels: 0, bookings: 0, confirmedBookings: 0 });
 hostApi.getHostHotels.mockResolvedValue(page([]));
 authApi.readCurrentUser.mockResolvedValue({ id: 1, name: "Alex", role: "user" });
 api.getHotelDestinations.mockResolvedValue([{ city: hotel.city, hotelCount: 1, coverImageUrl: null }]);
 api.getHotels.mockResolvedValue(page([hotel])); api.getHotel.mockResolvedValue(hotel); api.getRoomTypes.mockResolvedValue([room]); api.getAvailability.mockImplementation((id, values) => Promise.resolve([{ ...quote, total: 750 * Number(values.rooms || 1) }]));
 api.getBookings.mockResolvedValue(page([summary])); api.getBooking.mockResolvedValue(detail); api.createBooking.mockResolvedValue(detail); api.cancelBooking.mockResolvedValue({ ...detail, booking: { ...summary, status: "CANCELLED" } });
});
afterEach(() => { window.history.replaceState({}, "", "/"); sessionStorage.clear(); localStorage.removeItem("stay-preferences"); });
async function openHotel() { window.history.replaceState({}, "", "/hotel/42"); render(<App />); await screen.findByRole("heading", { level: 1, name: hotel.name }); await screen.findByLabelText("Reservation total"); }

test("homepage displays API hotels and opens the actual database id", async () => {
 render(<App />);
 const link = await screen.findByRole("link", { name: "View STAY City Hotel" });
 expect(api.getHotels).toHaveBeenCalled();
 expect(api.getHotelDestinations).toHaveBeenCalledTimes(1);
 expect(screen.queryByText("Double room at Hart House")).not.toBeInTheDocument();
 fireEvent.click(link);
 expect(window.location.pathname).toBe("/hotel/42");
 expect(await screen.findByRole("heading", { level: 1, name: hotel.name })).toBeInTheDocument();
 expect(await screen.findByLabelText("Reservation total")).toHaveTextContent("MYR");
});
test("search forwards city, dates and guests for server-side filtering", async () => {
 render(<App />);
 fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Kuala Lumpur" } });
 fireEvent.click(screen.getByRole("button", { name: /2 Guests/ })); fireEvent.click(screen.getByRole("button", { name: "Add child" }));
 fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
 await screen.findByRole("link", { name: "View STAY City Hotel" });
 expect(new URLSearchParams(window.location.search).get("city")).toBe("Kuala Lumpur");
 expect(new URLSearchParams(window.location.search).get("guests")).toBe("3");
 expect(api.getHotels).toHaveBeenLastCalledWith(expect.objectContaining({ city: "Kuala Lumpur", guests: "3", checkIn: start }), expect.anything());
 expect(api.getAvailability).not.toHaveBeenCalled();
});
test("anonymous reserve preserves stay details through login and never creates an order automatically", async () => {
 authApi.readCurrentUser.mockResolvedValue(null);
 await openHotel();
 fireEvent.change(screen.getByLabelText("Rooms", { exact: true }), { target: { value: "2" } });
 fireEvent.change(screen.getByLabelText("Guests", { exact: true }), { target: { value: "3" } });
 await waitFor(() => expect(screen.getByRole("button", { name: "Sign in to reserve" })).toBeEnabled());
 fireEvent.click(screen.getByRole("button", { name: "Sign in to reserve" }));
 expect(window.location.pathname).toBe("/login");
 const next = new URLSearchParams(window.location.search).get("next");
 expect(next).toContain("/hotel/42?"); expect(next).toContain("rooms=2"); expect(next).toContain("guests=3");
 fireEvent.click(screen.getByRole("link", { name: "Create an account" })); expect(new URLSearchParams(window.location.search).get("next")).toBe(next);
 expect(api.createBooking).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("link", { name: "Sign in", exact: true }));
 authApi.login.mockResolvedValue({ id: 1, name: "Alex", role: "user" });
 fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "alex@example.com" } });
 fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
 fireEvent.submit(screen.getByRole("form", { name: "Login" }));
 await screen.findByRole("heading", { level: 1, name: hotel.name });
 expect(screen.getByLabelText("Rooms", { exact: true })).toHaveValue(2);
 expect(screen.getByLabelText("Guests", { exact: true })).toHaveValue(3);
 expect(api.createBooking).not.toHaveBeenCalled();
});
test("reserve requires confirmation and sends server quote, real room id and stable request key", async () => {
 await openHotel();
 fireEvent.click(screen.getByRole("button", { name: "Reserve", exact: true }));
 const modal = await screen.findByRole("dialog", { name: "Confirm your reservation" });
 expect(api.createBooking).not.toHaveBeenCalled();
 fireEvent.click(within(modal).getByRole("button", { name: "Confirm reservation" }));
 await screen.findByRole("heading", { name: "My Bookings" });
 expect(api.createBooking).toHaveBeenCalledWith(expect.objectContaining({ roomTypeId: 70, checkIn: start, checkOut: end, rooms: 1, guests: 2, expectedTotal: 750, requestKey: "11111111-1111-4111-8111-111111111111" }));
 expect(window.location.pathname).toBe("/bookings");
 expect(await screen.findByRole("dialog", { name: "Booking details" })).toBeInTheDocument();
 expect(screen.getAllByText(/STAY-REAL-90/).length).toBeGreaterThan(0);
});
test("failed network retries keep the same idempotency key", async () => {
 api.createBooking.mockRejectedValueOnce(new Error("Network failed")).mockResolvedValueOnce(detail);
 await openHotel(); fireEvent.click(screen.getByRole("button", { name: "Reserve", exact: true }));
 fireEvent.click(screen.getByRole("button", { name: "Confirm reservation" }));
 expect(await screen.findByRole("alert")).toHaveTextContent("Network failed");
 fireEvent.click(screen.getByRole("button", { name: "Confirm reservation" }));
 await screen.findByRole("heading", { name: "My Bookings" });
 expect(api.createBooking.mock.calls[0][0].requestKey).toBe(api.createBooking.mock.calls[1][0].requestKey);
});
test("no availability or an unavailable API never falls back to demo rooms", async () => {
 api.getAvailability.mockResolvedValue([]);
 await openHotelWithoutQuote();
 expect(await screen.findByText(/No rooms of this type/)).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Reserve", exact: true })).toBeDisabled();
});
async function openHotelWithoutQuote() { window.history.replaceState({}, "", "/hotel/42"); render(<App />); await screen.findByRole("heading", { name: hotel.name, exact: true }); }
test("bookings cancellation needs explicit confirmation and refreshes the list", async () => {
 window.history.replaceState({}, "", "/bookings"); render(<App />);
 fireEvent.click(await screen.findByRole("button", { name: "View booking STAY-REAL-90" }));
 await screen.findByRole("button", { name: "Cancel booking", exact: true });
 fireEvent.click(screen.getByRole("button", { name: "Cancel booking", exact: true }));
 expect(api.cancelBooking).not.toHaveBeenCalled();
 api.getBookings.mockResolvedValue(page([{ ...summary, status: "CANCELLED" }]));
 fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
 expect(await screen.findByText("Cancelled", { exact: true })).toBeInTheDocument();
 expect(api.cancelBooking).toHaveBeenCalledWith(90);
});
test("API failure shows retry and empty inventory shows an honest empty state", async () => {
 api.getHotels.mockRejectedValueOnce(new Error("Backend unavailable")); render(<App />);
 expect(await screen.findByRole("alert")).toHaveTextContent("Backend unavailable");
 api.getHotels.mockResolvedValue(page([])); fireEvent.click(screen.getByRole("button", { name: "Try again" }));
 expect(await screen.findByRole("heading", { name: "No matching hotels" })).toBeInTheDocument();
 expect(screen.queryByText("Double room at Hart House")).not.toBeInTheDocument();
});
test("direct city paths use API city filters and browser back navigation works", async () => {
 window.history.replaceState({}, "", "/hotels/new-york-usa"); render(<App />);
 await screen.findByRole("link", { name: "View STAY City Hotel" });
 expect(api.getHotels).toHaveBeenCalledWith(expect.objectContaining({ city: "New York" }), expect.anything());
 act(() => { window.history.pushState({}, "", "/hotel/42"); window.dispatchEvent(new PopStateEvent("popstate")); });
 expect(await screen.findByRole("heading", { level: 1, name: hotel.name })).toBeInTheDocument();
});
test("host accounts cannot use user booking actions", async () => {
 authApi.readCurrentUser.mockResolvedValue({ id: 2, name: "Host", role: "host" });
 await openHotel();
 expect(screen.getByRole("button", { name: "Reserve", exact: true })).toBeDisabled();
 expect(screen.getByText(/Reservations are available for User accounts/)).toBeInTheDocument();
});


test("old availability responses cannot overwrite a newer date or room search", async () => {
 let resolveOld;
 api.getAvailability.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
   .mockResolvedValueOnce([{ ...quote, total: 1500 }]);
 await openHotelWithoutQuote();
 await waitFor(() => expect(api.getAvailability).toHaveBeenCalledTimes(1));
 fireEvent.change(screen.getByLabelText("Rooms", { exact: true }), { target: { value: "2" } });
 expect(await screen.findByLabelText("Reservation total")).toHaveTextContent("1,500.00");
 await act(async () => { resolveOld([]); });
 expect(screen.getByLabelText("Reservation total")).toHaveTextContent("1,500.00");
 expect(screen.getByRole("button", { name: "Reserve", exact: true })).toBeEnabled();
});


test("a changed price requires a fresh quote and another explicit confirmation", async () => {
 api.createBooking.mockRejectedValueOnce(Object.assign(new Error("The price changed. Refresh availability and confirm the new total."), { status: 409 }));
 await openHotel();
 fireEvent.click(screen.getByRole("button", { name: "Reserve", exact: true }));
 api.getAvailability.mockResolvedValue([{ ...quote, total: 900 }]);
 fireEvent.click(screen.getByRole("button", { name: "Confirm reservation" }));
 expect(await screen.findByRole("alert")).toHaveTextContent("price changed");
 await waitFor(() => expect(screen.getByLabelText("Reservation total")).toHaveTextContent("900.00"));
 expect(screen.queryByRole("dialog", { name: "Confirm your reservation" })).not.toBeInTheDocument();
 expect(api.createBooking).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole("button", { name: "Reserve", exact: true }));
 expect(screen.getByRole("dialog", { name: "Confirm your reservation" })).toHaveTextContent("900.00");
 expect(api.createBooking).toHaveBeenCalledTimes(1);
});


test.each([["user", "/", "Find your perfect hotel."], ["host", "/host", "Overview"]])("%s login ignores a stale bookings return path", async (role, destination, heading) => {
 authApi.readCurrentUser.mockResolvedValue(null);
 authApi.login.mockResolvedValue({ id: 9, name: "Alex", role });
 window.history.replaceState({}, "", "/login?next=%2Fbookings%3Fbooking%3D90");
 render(<App />);
 await waitFor(() => expect(screen.queryByText("Checking account…")).not.toBeInTheDocument());
 fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "alex@example.com" } });
 fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
 fireEvent.submit(screen.getByRole("form", { name: "Login" }));
 expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
 expect(window.location.pathname).toBe(destination);
 expect(api.getBookings).not.toHaveBeenCalled();
});


test("signing out of booking history clears its return path before another role signs in", async () => {
 authApi.logout.mockResolvedValue(null);
 window.history.replaceState({}, "", "/bookings"); render(<App />);
 await screen.findByRole("button", { name: "View booking STAY-REAL-90" });
 fireEvent.click(screen.getByLabelText("Your account", { exact: true }));
 fireEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
 await screen.findByRole("heading", { name: "Welcome back" });
 expect(window.location.pathname).toBe("/login");
 expect(window.location.search).toBe("");
 authApi.login.mockResolvedValue({ id: 9, name: "Host", role: "host" });
 fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "host@example.com" } });
 fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
 fireEvent.submit(screen.getByRole("form", { name: "Login" }));
 await screen.findByRole("heading", { name: "Overview", exact: true });
 expect(window.location.pathname).toBe("/host");
});


test.each([
  ["en-US", "English United States", "Welcome back", "Email address", "Create an account"],
  ["ja-JP", "日本語 日本", "おかえりなさい", "メールアドレス", "アカウントを作成する"],
  ["zh-TW", "繁體中文 台灣", "歡迎回來", "電子郵件地址", "建立新帳戶"],
  ["ms-MY", "Bahasa Melayu Malaysia", "Selamat kembali", "Alamat e-mel", "Cipta akaun baharu"],
  ["ko-KR", "한국어 대한민국", "다시 오신 것을 환영합니다", "이메일 주소", "새 계정 만들기"],
  ["fr-FR", "Français France", "Heureux de vous revoir", "Adresse e-mail", "Créer un compte"],
])("%s switches the login/register UI without clearing input or changing role values", async (code, choice, heading, emailLabel, registerLink) => {
  authApi.readCurrentUser.mockResolvedValue(null);
  window.history.replaceState({}, "", "/login");
  render(<App />);
  await screen.findByRole("heading", { name: "Welcome back" });
  fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: "guest@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Language and currency", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: choice }));
  expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  expect(screen.getByLabelText(emailLabel, { exact: true })).toHaveValue("guest@example.com");
  expect(document.documentElement.lang).toBe(code);
  expect(JSON.parse(localStorage.getItem("stay-preferences")).language).toBe(code);
  fireEvent.click(screen.getByRole("button", { name: i18n.t("Done"), exact: true }));
  fireEvent.click(screen.getByRole("link", { name: registerLink }));
  expect(await screen.findByRole("heading", { name: i18n.t("Create your account") })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: new RegExp(i18n.t("User")) })).toHaveAttribute("value", "user");
  expect(screen.getByRole("radio", { name: new RegExp(i18n.t("Hotel Host")) })).toHaveAttribute("value", "host");
});

test("Chinese search, hotel detail and reservation preserve server identifiers and MYR quote", async () => {
  render(<App />);
  await screen.findByRole("link", { name: "View STAY City Hotel" });
  fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Kuala Lumpur" } });
  fireEvent.click(screen.getByRole("button", { name: "Language and currency", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "繁體中文 台灣" }));
  fireEvent.click(screen.getByRole("button", { name: "完成", exact: true }));
  expect(screen.getByLabelText("目的地")).toHaveValue("Kuala Lumpur");
  fireEvent.click(screen.getByRole("button", { name: "搜尋", exact: true }));
  expect(await screen.findByRole("heading", { name: "尋找理想酒店", level: 1 })).toBeInTheDocument();
  expect(new URLSearchParams(window.location.search).get("city")).toBe("Kuala Lumpur");
  fireEvent.click(await screen.findByRole("link", { name: "查看 STAY City Hotel" }));
  expect(await screen.findByRole("heading", { name: hotel.name, level: 1 })).toBeInTheDocument();
  expect(screen.getByText(hotel.description)).toBeInTheDocument();
  expect(await screen.findByLabelText("預訂總額")).toHaveTextContent("MYR");
  fireEvent.click(screen.getByRole("button", { name: "預訂", exact: true }));
  const modal = await screen.findByRole("dialog", { name: "確認你的預訂" });
  fireEvent.click(within(modal).getByRole("button", { name: "確認預訂" }));
  expect(await screen.findByRole("heading", { name: "我的預訂" })).toBeInTheDocument();
  expect(api.createBooking).toHaveBeenCalledWith(expect.objectContaining({ roomTypeId: 70, rooms: 1, guests: 2, expectedTotal: 750 }));
  expect(await screen.findByRole("dialog", { name: "預訂詳情" })).toBeInTheDocument();
  expect(screen.queryByText("A real hotel description")).not.toBeInTheDocument();
});

test("French paid booking displays localized confirmed state and original hotel currency", async () => {
  localStorage.setItem("stay-preferences", JSON.stringify({ language: "fr-FR", currency: "JPY" }));
  const paid = { ...summary, paymentStatus: "PAID" };
  api.getBookings.mockResolvedValue(page([paid]));
  api.getBooking.mockResolvedValue({ ...detail, booking: paid });
  window.history.replaceState({}, "", "/bookings");
  render(<App />);
  expect(await screen.findByText("Confirmée · Payée (test)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Voir la réservation STAY-REAL-90" }));
  const modal = await screen.findByRole("dialog", { name: "Détails de la réservation" });
  expect(await within(modal).findByText("Paiement test confirmé par le serveur. Aucun montant réel n’a été débité.")).toBeInTheDocument();
  expect(within(modal).getAllByText(/MYR/).length).toBeGreaterThan(0);
  expect(within(modal).queryByText(/JPY/)).not.toBeInTheDocument();
});

test("switching language translates an existing validation error without submitting registration", async () => {
  authApi.readCurrentUser.mockResolvedValue(null);
  window.history.replaceState({}, "", "/register");
  render(<App />);
  await screen.findByRole("heading", { name: "Create your account" });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
  fireEvent.change(screen.getByLabelText("Confirm password", { exact: true }), { target: { value: "Different123" } });
  fireEvent.submit(screen.getByRole("form", { name: "Register" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match.");
  fireEvent.click(screen.getByRole("button", { name: "Language and currency", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "繁體中文 台灣" }));
  expect(screen.getByRole("alert")).toHaveTextContent("兩次輸入的密碼不一致。");
  expect(authApi.register).not.toHaveBeenCalled();
});


test("homepage suggestions share published destinations and preserve cities containing commas", async () => {
  api.getHotelDestinations.mockResolvedValue([{ city: "Raub, Pahang", hotelCount: 1, coverImageUrl: null }]);
  render(<App />);
  await waitFor(() => expect([...document.querySelectorAll("#destinations-list option")].map(option => option.value)).toEqual(["Raub, Pahang"]));
  expect(api.getHotelDestinations).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Raub, Pahang" } });
  fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
  await screen.findByRole("heading", { name: "Find your hotel", level: 1 });
  expect(new URLSearchParams(window.location.search).get("city")).toBe("Raub, Pahang");
  expect(api.getHotels).toHaveBeenLastCalledWith(expect.objectContaining({ city: "Raub, Pahang" }), expect.anything());
});

test("homepage replaces previews with room searches that reach the live catalogue", async () => {
  render(<App />);
  const group = await screen.findByRole("link", { name: /Travelling together/ });
  expect(screen.queryByText("Join our newsletter")).not.toBeInTheDocument();
  expect(screen.queryByText("Explore hotel destinations")).not.toBeInTheDocument();
  expect(screen.queryByText("Sample story")).not.toBeInTheDocument();
  fireEvent.click(group);
  await screen.findByRole("heading", { name: "Find your hotel", level: 1 });
  expect(window.location.pathname).toBe("/hotels");
  expect(screen.getByLabelText("Rooms", { exact: true })).toHaveValue(2);
  expect(screen.getByLabelText("Guests", { exact: true })).toHaveValue(4);
  expect(api.getHotels).toHaveBeenLastCalledWith(expect.objectContaining({ rooms: "2", guests: "4" }), expect.anything());
});

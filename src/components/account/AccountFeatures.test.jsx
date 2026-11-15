import * as paymentApi from "../../services/paymentApi";
jest.mock("../../services/paymentApi");
import * as notificationApi from "../../services/notificationApi";
import * as reviewApi from "../../services/reviewApi";
jest.mock("../../services/notificationApi");
jest.mock("../../services/reviewApi");
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../../App";
import * as auth from "../../services/authApi";
import * as account from "../../services/accountApi";
import * as hotels from "../../services/hotelApi";
jest.mock("../../services/authApi"); jest.mock("../../services/accountApi"); jest.mock("../../services/hotelApi");
const user = { id: 1, name: "Alex", email: "alex@example.com", role: "user" };
const profile = { ...user, phone: "", city: "Raub", bio: "", createdAt: "2026-11-01T00:00:00Z" };
const hotel = { id: 7, name: "City Hotel", city: "Raub", address: "1 Main Road", countryCode: "MY" };
const saved = { hotelId: 7, savedAt: "2026-11-01T00:00:00Z", hotel };
beforeAll(() => { window.scrollTo = jest.fn(); URL.createObjectURL = jest.fn(() => "blob:avatar-preview"); URL.revokeObjectURL = jest.fn(); HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); }; });
beforeEach(() => {
  jest.clearAllMocks();
 paymentApi.getPaymentConfig.mockResolvedValue({ enabled: true, mode: "test", holdMinutes: 35 });
 paymentApi.getBookingPayment.mockResolvedValue(null);
 notificationApi.getUnreadCount.mockResolvedValue({ unreadCount: 0 });
 notificationApi.getNotifications.mockResolvedValue({ items: [], page: 0, totalPages: 0 });
 reviewApi.getHotelReviews.mockResolvedValue({ summary: { reviewCount: 0, averageRating: null }, reviews: { items: [], page: 0, totalPages: 0 } });
 reviewApi.getBookingReview.mockResolvedValue({ eligible: false, reason: "Review available after check-out.", review: null }); URL.createObjectURL.mockReturnValue("blob:avatar-preview"); auth.readCurrentUser.mockResolvedValue(user); account.getFavorites.mockResolvedValue([]); account.getProfile.mockResolvedValue(profile); account.updateProfile.mockImplementation(values => Promise.resolve({ ...profile, ...values })); account.saveFavorite.mockResolvedValue(saved); account.removeFavorite.mockResolvedValue(null);
  hotels.getHotels.mockResolvedValue({ items: [hotel], page: 0, totalPages: 1 });
});
afterEach(() => { window.history.replaceState({}, "", "/"); });
function open(path) { window.history.replaceState({}, "", path); return render(<App />); }
test("profile saves allowed fields and updates the account name in the menu", async () => {
  open("/account");
  fireEvent.change(await screen.findByLabelText("Full name"), { target: { value: "Alex Cheng" } });
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+60 12 345 6789" } });
  expect(screen.getByLabelText("Email address")).toHaveAttribute("readonly");
  fireEvent.submit(screen.getByRole("form", { name: "Personal information" }));
  expect(await screen.findByText("Your profile has been saved.")).toBeInTheDocument();
  expect(account.updateProfile).toHaveBeenCalledWith({ name: "Alex Cheng", phone: "+60 12 345 6789", city: "Raub", bio: "" });
  fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Your account" }));
  expect(within(screen.getByRole("menu", { name: "Profile menu" })).getByText("Alex Cheng")).toBeInTheDocument();
});
test("profile failures preserve entered details for retry", async () => {
  account.updateProfile.mockRejectedValueOnce(new Error("Server unavailable")); open("/account");
  fireEvent.change(await screen.findByLabelText("Full name"), { target: { value: "New name" } });
  fireEvent.submit(screen.getByRole("form", { name: "Personal information" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable"); expect(screen.getByLabelText("Full name")).toHaveValue("New name");
});
test("save uses the API and wishlist can remove it, retaining it on failure", async () => {
  open("/hotels");
  const save = await screen.findByRole("button", { name: "Save City Hotel" });
  await waitFor(() => expect(account.getFavorites).toHaveBeenCalled());
  fireEvent.click(save); await waitFor(() => expect(save).toHaveAttribute("aria-pressed", "true"));
  expect(account.saveFavorite).toHaveBeenCalledWith(7);
  fireEvent.click(screen.getByRole("button", { name: "Saved (1)" }));
  expect(window.location.pathname).toBe("/wishlist"); expect(await screen.findByRole("heading", { name: "City Hotel" })).toBeInTheDocument();
  account.removeFavorite.mockRejectedValueOnce(new Error("Try again later")); fireEvent.click(screen.getByRole("button", { name: "Remove from saved" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Try again later"); expect(screen.getByRole("heading", { name: "City Hotel" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove from saved" }));
  expect(await screen.findByRole("heading", { name: "Start your hotel wishlist" })).toBeInTheDocument();
});
test("restores saved hotels from server including unavailable hotels", async () => {
  account.getFavorites.mockResolvedValue([saved, { hotelId: 8, hotel: null }]); open("/wishlist");
  expect(await screen.findByRole("heading", { name: "City Hotel" })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "This hotel is no longer available" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Remove from saved" })).toHaveLength(2);
});
test("anonymous wishlist redirects to login and returns after signing in", async () => {
  auth.readCurrentUser.mockResolvedValue(null); auth.login.mockResolvedValue(user); open("/wishlist");
  await screen.findByRole("heading", { name: "Welcome back" }); expect(new URLSearchParams(window.location.search).get("next")).toBe("/wishlist"); expect(account.getFavorites).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email address", { exact: true }), { target: { value: user.email } }); fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } }); fireEvent.submit(screen.getByRole("form", { name: "Login" }));
  expect(await screen.findByRole("heading", { name: "Your saved hotels" })).toBeInTheDocument();
});
test("pending favorite mutation disables repeat requests", async () => {
  let resolve; account.saveFavorite.mockImplementation(() => new Promise(done => { resolve = done; })); open("/hotels");
  const button = await screen.findByRole("button", { name: "Save City Hotel" }); await waitFor(() => expect(account.getFavorites).toHaveBeenCalled()); fireEvent.click(button); fireEvent.click(button);
  expect(button).toBeDisabled(); expect(account.saveFavorite).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(saved); }); expect(button).toHaveAttribute("aria-pressed", "true");
});
test("avatar upload previews and updates profile, header and menu immediately", async () => {
  const avatarUrl = "/api/account/avatar/11111111-1111-4111-8111-111111111111";
  account.uploadAvatar.mockResolvedValue({ avatarUrl }); open("/account");
  const file = new File(["png"], "avatar.png", { type: "image/png" }); fireEvent.change(await screen.findByLabelText("Profile photo"), { target: { files: [file] } });
  expect(screen.getByRole("img", { name: "New avatar preview" })).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Upload photo" }));
  expect(await screen.findByText("Profile photo updated.", { selector: ".avatar-status" })).toBeInTheDocument(); expect(account.uploadAvatar).toHaveBeenCalledWith(file);
  expect(screen.getByRole("img", { name: "Your profile photo" }).querySelector("img")).toHaveAttribute("src", `http://localhost:8080${avatarUrl}`);
  const trigger = within(screen.getByRole("banner")).getByRole("button", { name: "Your account" }); expect(trigger.querySelector("img")).toHaveAttribute("src", `http://localhost:8080${avatarUrl}`); fireEvent.click(trigger);
  expect(screen.getByRole("menu", { name: "Profile menu" }).querySelector("img")).toHaveAttribute("src", `http://localhost:8080${avatarUrl}`);
});
test("avatar removal requires confirmation and falls back to initials", async () => {
  auth.readCurrentUser.mockResolvedValue({ ...user, avatarUrl: "/api/account/avatar/11111111-1111-4111-8111-111111111111" }); account.removeAvatar.mockResolvedValue(null); open("/account");
  fireEvent.click(await screen.findByRole("button", { name: "Remove photo" })); expect(account.removeAvatar).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirm removal" }));
  expect(await screen.findByText("Profile photo removed.", { selector: ".avatar-status" })).toBeInTheDocument(); expect(screen.getByRole("img", { name: "Your profile photo" })).toHaveTextContent("A"); expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument();
});
test("invalid avatar file is rejected and server failure preserves the preview", async () => {
  account.uploadAvatar.mockRejectedValue(new Error("Invalid image content")); open("/account"); const input = await screen.findByLabelText("Profile photo");
  fireEvent.change(input, { target: { files: [new File(["svg"], "avatar.svg", { type: "image/svg+xml" })] } }); expect(screen.getByRole("alert")).toHaveTextContent("up to 5 MB"); expect(account.uploadAvatar).not.toHaveBeenCalled();
  const file = new File(["png"], "avatar.png", { type: "image/png" }); fireEvent.change(input, { target: { files: [file] } }); fireEvent.click(screen.getByRole("button", { name: "Upload photo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid image content"); expect(screen.getByRole("img", { name: "New avatar preview" })).toBeInTheDocument();
});

import { fireEvent, render, screen, within } from "@testing-library/react";
import Footer from "./Footer";
import i18n from "../../i18n";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => { i18n.changeLanguage("en-US"); window.scrollTo = jest.fn(); });

test("footer contains real navigation and no generic social or placeholder company links", () => {
  render(<Footer />);
  const footer = within(screen.getByRole("contentinfo"));
  expect(footer.getByRole("link", { name: "Find a hotel" })).toHaveAttribute("href", "/hotels");
  expect(footer.getByRole("link", { name: "Saved hotels" })).toHaveAttribute("href", "/wishlist");
  expect(footer.getByRole("link", { name: "Notifications" })).toHaveAttribute("href", "/notifications");
  expect(footer.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
  expect(footer.queryByText("Privacy policy")).not.toBeInTheDocument();
  expect(footer.getByText(`© ${new Date().getFullYear()} STAY. All rights reserved.`)).toBeInTheDocument();
});
test.each([["host", "Host Dashboard", "/host"], ["admin", "Admin Dashboard", "/admin"]])("%s receives its workspace instead of User-only booking navigation", (role, label, href) => {
  render(<Footer user={{ role }} />);
  expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
  expect(screen.queryByRole("link", { name: "Your bookings" })).not.toBeInTheDocument();
});
test("ordinary navigation uses the app router", () => {
  const navigate = jest.fn(); render(<Footer onNavigate={navigate} />);
  fireEvent.click(screen.getByRole("link", { name: "Your bookings" }));
  expect(navigate).toHaveBeenCalledWith("/bookings");
});
test("section anchors scroll locally and remain real cross-page URLs", () => {
  const scroll = jest.fn();
  const section = document.createElement("section"); section.id = "destinations"; section.scrollIntoView = scroll; document.body.append(section);
  render(<Footer />);
  const link = screen.getByRole("link", { name: "Popular destinations" });
  expect(link).toHaveAttribute("href", "/#destinations");
  fireEvent.click(link); expect(scroll).toHaveBeenCalled(); section.remove();
});
test("help opens useful cancellation content and navigates to the user's booking history", () => {
  const navigate = jest.fn(); render(<Footer user={{ role: "user" }} onNavigate={navigate} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancellation policy" }));
  const dialog = within(screen.getByRole("dialog", { name: "Cancellation policy" }));
  expect(dialog.getByText("Cancellation options, deadlines and any refund amount are shown in your booking details.")).toBeInTheDocument();
  fireEvent.click(dialog.getByRole("link", { name: "Your bookings" }));
  expect(navigate).toHaveBeenCalledWith("/bookings");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("anonymous hosting help leads to actual account creation", () => {
  render(<Footer />); fireEvent.click(screen.getByRole("button", { name: "For hotel hosts" }));
  expect(within(screen.getByRole("dialog")).getByRole("link", { name: /Create an account/ })).toHaveAttribute("href", "/register");
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("back-to-top respects reduced motion", () => {
  const original = window.matchMedia; window.matchMedia = jest.fn(() => ({ matches: true }));
  render(<Footer />); fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  window.matchMedia = original;
});

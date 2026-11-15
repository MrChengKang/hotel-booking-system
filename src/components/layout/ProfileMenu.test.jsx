import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OriginalProfileMenu from "./ProfileMenu";
import * as authApi from "../../services/authApi";
jest.mock("../../services/authApi");
import { AuthProvider } from "../../context/AuthContext";
function ProfileMenu(props) { return <AuthProvider><OriginalProfileMenu {...props} /></AuthProvider>; }
beforeEach(() => {
 authApi.readCurrentUser.mockResolvedValue({ id: 1, name: "Daniel Reyes", email: "daniel@example.com", role: "user" });
 authApi.logout.mockResolvedValue(null);
});
async function renderProfile(props) {
 const view = render(<ProfileMenu {...props} />);
 await screen.findByRole('button', { name: 'Your account' });
 return view;
}

afterEach(() => {
  sessionStorage.clear();
  localStorage.removeItem("stay-theme");
  delete document.documentElement.dataset.theme;
});

test("opens the profile menu, navigates by keyboard, and restores trigger focus on Escape", async () => {
  const onAction = jest.fn();
  await renderProfile({onAction: onAction, onNotify: jest.fn()});
  const trigger = screen.getByRole("button", { name: "Your account" });
  fireEvent.click(trigger);
  const account = screen.getByRole("menuitem", { name: "My Account" });
  expect(account).toHaveFocus();
  expect(screen.getByText("Daniel Reyes")).toBeInTheDocument();
  expect(screen.getByText("User")).toBeInTheDocument();
  fireEvent.keyDown(account, { key: "ArrowDown" });
  expect(screen.getByRole("menuitem", { name: "My Bookings" })).toHaveFocus();
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("menuitem", { name: "Wishlist" }));
  expect(onAction).toHaveBeenCalledWith("wishlist");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("changes the page theme and restores the saved choice after remounting", async () => {
  const view = await renderProfile({onAction: jest.fn(), onNotify: jest.fn()});
  fireEvent.click(screen.getByRole("button", { name: "Your account" }));
  fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Dark theme" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(localStorage.getItem("stay-theme")).toBe("dark");
  expect(screen.getByRole("menuitemcheckbox", { name: "Dark theme" })).toHaveAttribute("aria-checked", "true");
  view.unmount();
  await renderProfile({onAction: jest.fn(), onNotify: jest.fn()});
  fireEvent.click(screen.getByRole("button", { name: "Your account" }));
  expect(screen.getByRole("menuitemcheckbox", { name: "Dark theme" })).toHaveAttribute("aria-checked", "true");
  fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Dark theme" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "light");
});

test("dismisses on outside clicks and signs out of the demo profile", async () => {
  const onNotify = jest.fn();
  const onAuth = jest.fn();
  await renderProfile({onAction: jest.fn(), onNotify: onNotify, onAuth: onAuth});
  fireEvent.click(screen.getByRole("button", { name: "Your account" }));
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Your account" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Your account" })).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(onAuth).toHaveBeenCalled();
  expect(onNotify).toHaveBeenCalledWith("You have signed out.");
});

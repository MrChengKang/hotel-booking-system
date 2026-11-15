import { fireEvent, render, screen } from "@testing-library/react";
import PasswordRecoveryPage from "./PasswordRecoveryPage";
import * as api from "../../services/authApi";
import { TextEncoder } from "util";
jest.mock("../../services/authApi");
jest.mock("../../context/AuthContext", () => ({ useAuth: () => ({ resetPassword: (...args) => require("../../services/authApi").resetPassword(...args) }) }));
beforeAll(() => { global.TextEncoder = TextEncoder; });
afterEach(() => { window.history.replaceState({}, "", "/"); jest.clearAllMocks(); });

test("requests an email and shows a generic result without exposing a token", async () => {
  api.forgotPassword.mockResolvedValue({ message: "Sent" });
  render(<PasswordRecoveryPage mode="forgot-password" onNavigate={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "alex@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(await screen.findByRole("status")).toHaveTextContent("If an account exists");
  expect(api.forgotPassword).toHaveBeenCalledWith("alex@example.com");
});
test("shows configuration errors and allows retry", async () => {
  api.forgotPassword.mockRejectedValue(new Error("Password reset email is not configured yet."));
  render(<PasswordRecoveryPage mode="forgot-password" onNavigate={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "alex@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("not configured");
  expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
});
test("rejects missing links, confirms passwords, and clears the fragment after success", async () => {
  const view = render(<PasswordRecoveryPage mode="reset-password" onNavigate={jest.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("missing or invalid");
  view.unmount();
  const token = "a".repeat(43);
  window.history.replaceState({}, "", "/reset-password#token=" + token);
  api.resetPassword.mockResolvedValue({ message: "Reset" });
  render(<PasswordRecoveryPage mode="reset-password" onNavigate={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("New password", { exact: true }), { target: { value: "NewSample123" } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "Different123" } });
  fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(api.resetPassword).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "NewSample123" } });
  fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Your password has been reset");
  expect(api.resetPassword).toHaveBeenCalledWith(token, "NewSample123");
  expect(window.location.hash).toBe("");
});

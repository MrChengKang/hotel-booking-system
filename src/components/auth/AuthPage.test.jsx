import { fireEvent, render, screen } from "@testing-library/react";
import AuthPage from "./AuthPage";
import { useAuth } from "../../context/AuthContext";
import i18n from "../../i18n";
jest.mock("../../context/AuthContext");
const login = jest.fn();
beforeEach(() => { jest.clearAllMocks(); i18n.changeLanguage("en-US"); useAuth.mockReturnValue({ login, loading: false }); });

test.each([false, true])("login explicitly forwards rememberMe=%s", async remember => {
  login.mockResolvedValue({ id: 1, role: "user" });
  const success = jest.fn();
  render(<AuthPage mode="login" onNavigate={jest.fn()} onSuccess={success} />);
  const checkbox = screen.getByRole("checkbox", { name: "Remember me" });
  expect(checkbox).not.toBeChecked();
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "guest@example.com" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), { target: { value: "SampleOnly123" } });
  if (remember) fireEvent.click(checkbox);
  fireEvent.submit(screen.getByRole("form", { name: "Login" }));
  expect(login).toHaveBeenCalledWith("guest@example.com", "SampleOnly123", remember);
  await screen.findByRole("button", { name: "Please wait…" });
  expect(checkbox).toBeDisabled();
  expect(screen.getByText("Keep me signed in for 30 days.")).toBeInTheDocument();
});
test("registration does not opt into a persistent login", () => {
  render(<AuthPage mode="register" onNavigate={jest.fn()} onSuccess={jest.fn()} />);
  expect(screen.queryByRole("checkbox", { name: "Remember me" })).not.toBeInTheDocument();
});

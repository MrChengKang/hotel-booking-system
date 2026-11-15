import { fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "../services/authApi";
jest.mock("../services/authApi");

function Account() {
  const auth = useAuth();
  return <><p>{auth.loading ? "Loading session" : auth.user?.name || "Signed out"}</p><button onClick={() => auth.login("alex@example.com", "sample123")}>Login</button><button onClick={() => auth.login("alex@example.com", "sample123", true)}>Remember login</button><button onClick={() => auth.logout().catch(() => {})}>Logout</button></>;
}
test("restores a server session and keeps it visible when logout fails", async () => {
  api.readCurrentUser.mockResolvedValue({ id: 1, name: "Alex", role: "host" });
  api.logout.mockRejectedValueOnce(new Error("Network error"));
  render(<AuthProvider><Account /></AuthProvider>);
  await screen.findByText("Alex");
  fireEvent.click(screen.getByText("Logout"));
  expect(await screen.findByText("Alex")).toBeInTheDocument();
  api.logout.mockResolvedValueOnce(null);
  fireEvent.click(screen.getByText("Logout"));
  expect(await screen.findByText("Signed out")).toBeInTheDocument();
});

test.each([false, true])("passes the user's persistence choice through the auth context: %s", async rememberMe => {
  api.readCurrentUser.mockResolvedValueOnce(null);
  api.login.mockResolvedValueOnce({ id: 1, name: "Alex", role: "user" });
  render(<AuthProvider><Account /></AuthProvider>);
  await screen.findByText("Signed out");
  fireEvent.click(screen.getByText(rememberMe ? "Remember login" : "Login", { exact: true }));
  expect(await screen.findByText("Alex")).toBeInTheDocument();
  expect(api.login).toHaveBeenLastCalledWith("alex@example.com", "sample123", rememberMe);
});

import { login, logout, readCurrentUser, register } from "./authApi";

const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test("registration sends only the public fields and includes the session CSRF token", async () => {
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "sample-token" }))
    .mockResolvedValueOnce(response(201, { id: 1, role: "host" }));
  await register({ name: "Alex", email: "alex@example.com", password: "sample123", role: "host", confirmPassword: "sample123" });
  const [url, options] = fetch.mock.calls[1];
  expect(url).toMatch(/\/api\/auth\/register$/);
  expect(options.credentials).toBe("include");
  expect(options.headers["X-CSRF-TOKEN"]).toBe("sample-token");
  expect(JSON.parse(options.body)).toEqual({ name: "Alex", email: "alex@example.com", password: "sample123", role: "host" });
});
test("anonymous sessions return null and server validation errors reach the form", async () => {
  fetch.mockResolvedValueOnce(response(401, { message: "Please sign in." }));
  await expect(readCurrentUser()).resolves.toBeNull();
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "token" }))
    .mockResolvedValueOnce(response(401, { message: "Email or password is incorrect." }));
  await expect(login("alex@example.com", "wrong")).rejects.toThrow("Email or password is incorrect.");
});
test("logout refreshes the CSRF token and accepts an empty 204 response", async () => {
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "new-token" }))
    .mockResolvedValueOnce(response(204));
  await expect(logout()).resolves.toBeNull();
  expect(fetch.mock.calls[1][1].headers["X-CSRF-TOKEN"]).toBe("new-token");
});
test("a disconnected backend shows a useful message", async () => {
  fetch.mockRejectedValueOnce(new TypeError("Network error"));
  await expect(readCurrentUser()).rejects.toThrow("Cannot reach the server");
});

test.each([false, true])("login sends the explicit persistent-login choice: %s", async rememberMe => {
  fetch.mockResolvedValueOnce(response(200, { headerName: "X-CSRF-TOKEN", token: "token" }))
    .mockResolvedValueOnce(response(200, { id: 1 }));
  await login("alex@example.com", "SampleOnly123", rememberMe);
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ email: "alex@example.com", password: "SampleOnly123", rememberMe });
});

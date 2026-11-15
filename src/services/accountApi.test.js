import { getProfile, updateProfile, getFavorites, saveFavorite, removeFavorite, uploadAvatar, removeAvatar } from "./accountApi";
import { avatarUrl } from "./apiClient";
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ headerName: "X-CSRF-TOKEN", token: "csrf" }) }); });
afterEach(() => { delete global.fetch; });
test("account reads and mutations use cookies, CSRF and server-owned identity", async () => {
  await getProfile(); await getFavorites(); await updateProfile({ name: "Alex", city: "Raub", phone: "", bio: "" }); await saveFavorite(7); await removeFavorite(7);
  const mutations = fetch.mock.calls.filter(([, options]) => options.method);
  expect(mutations.map(([, options]) => options.method)).toEqual(["PUT", "PUT", "DELETE"]);
  for (const [url, options] of mutations) { expect(url).toContain("/account/"); expect(options.credentials).toBe("include"); expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf"); expect(options.body || "").not.toContain("userId"); }
});
test("avatar multipart uses session/CSRF and leaves its boundary to the browser", async () => {
  const file = new File(["png"], "avatar.png", { type: "image/png" }); await uploadAvatar(file); await removeAvatar();
  const [url, options] = fetch.mock.calls[1]; expect(url).toMatch(/\/account\/avatar$/); expect(options.body.get("file")).toBe(file); expect(options.headers).toEqual({ "X-CSRF-TOKEN": "csrf" }); expect(options.credentials).toBe("include"); expect(fetch.mock.calls[3][1].method).toBe("DELETE");
});
test("avatar source rejects untrusted and malformed URLs", () => {
  expect(avatarUrl("/api/account/avatar/11111111-1111-4111-8111-111111111111")).toBe("http://localhost:8080/api/account/avatar/11111111-1111-4111-8111-111111111111");
  expect(avatarUrl("https://untrusted.invalid/avatar.png")).toBe(""); expect(avatarUrl("/api/account/avatar/../profile")).toBe("");
});

import { createHostHotel, editHostRoom, changeHotelStatus, submitHostHotel, editHostInventory, uploadHostImage, orderHostImages, deleteHostImage } from "./hostApi";
import { mediaUrl } from "./apiClient";
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ headerName: "X-CSRF-TOKEN", token: "csrf" }) }); });
afterEach(() => { delete global.fetch; });
test("Host POST, PUT and PATCH all send credentials and fresh CSRF headers", async () => {
  await createHostHotel({ name: "Hotel" });
  await editHostRoom(4, { active: false });
  await changeHotelStatus(2, "DRAFT");
  await editHostInventory(4, "2027-01-01", { stopSell: true });
  const mutations = fetch.mock.calls.filter(([, options]) => options.method);
  expect(mutations.map(([, options]) => options.method)).toEqual(["POST", "PUT", "PATCH", "PUT"]);
  for (const [, options] of mutations) { expect(options.credentials).toBe("include"); expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf"); }
  expect(fetch.mock.calls.filter(([url]) => url.endsWith("/auth/csrf"))).toHaveLength(4);
});

test("hotel submission uses its dedicated CSRF-protected endpoint", async () => {
  await submitHostHotel(41);
  const [url, options] = fetch.mock.calls[1];
  expect(url).toMatch(/\/host\/hotels\/41\/submit$/); expect(options.method).toBe("POST");
  expect(options.credentials).toBe("include"); expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf");
  expect(options.body).toBeUndefined();
});
test("photo upload keeps the browser multipart boundary and includes CSRF and cookies", async () => {
  const file = new File(["image"], "room.png", { type: "image/png" });
  await uploadHostImage(7, "9", file, "King bed");
  const [url, options] = fetch.mock.calls[1];
  expect(url).toMatch(/\/host\/hotels\/7\/images$/);
  expect(options.credentials).toBe("include");
  expect(options.headers).toEqual({ "X-CSRF-TOKEN": "csrf" });
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get("file")).toBe(file);
  expect(options.body.get("roomTypeId")).toBe("9");
  expect(options.body.get("altText")).toBe("King bed");
  await orderHostImages(7, null, [2, 1]); await deleteHostImage(7, 2);
  expect(fetch.mock.calls[3][1].body).toBe(JSON.stringify({ roomTypeId: null, imageIds: [2, 1] }));
  expect(fetch.mock.calls[5][1].method).toBe("DELETE");
});
test("media URLs only resolve generated image paths", () => {
  expect(mediaUrl("/api/media/12")).toBe("http://localhost:8080/api/media/12");
  expect(mediaUrl("https://example.com/image.png")).toBe("");
  expect(mediaUrl("/api/media/../secret")).toBe("");
});

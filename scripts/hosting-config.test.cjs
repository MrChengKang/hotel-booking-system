const test = require("node:test");
const assert = require("node:assert/strict");
const { backendOrigin, createVercelConfig } = require("../deploy/vercel-config.cjs");

test("requires an explicit public HTTPS backend origin", () => {
  for (const value of [undefined, "", "http://stay.onrender.com", "https://user:pass@stay.onrender.com", "https://stay.onrender.com/api", "https://stay.onrender.com?q=1", "https://stay.onrender.com#secret", "https://localhost", "https://127.0.0.1"]) {
    assert.throws(() => backendOrigin(value));
  }
  assert.equal(backendOrigin(" https://stay-api.onrender.com/ "), "https://stay-api.onrender.com");
});

test("preserves the Spring API prefix through the same-origin proxy", () => {
  const config = createVercelConfig("https://stay-api.onrender.com");
  const rule = config.routes.find(rule => rule.dest?.startsWith("https://"));
  assert.equal("/api/hotels/123".replace(new RegExp(rule.src), rule.dest), "https://stay-api.onrender.com/api/hotels/123");
  assert.equal("/api/auth/csrf".replace(new RegExp(rule.src), rule.dest), "https://stay-api.onrender.com/api/auth/csrf");
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.outputDirectory, "build");
});

test("deep links include authentication, private workspaces and hotel search", () => {
  const routes = createVercelConfig("https://stay-api.onrender.com").routes;
  for (const path of ["/", "/login", "/register", "/forgot-password", "/reset-password", "/account", "/wishlist", "/notifications", "/bookings", "/hotels", "/hotel/123", "/host", "/host/rooms", "/admin", "/admin/refunds"]) {
    const match = routes.find(rule => rule.src && !rule.continue && new RegExp(rule.src).test(path));
    assert.equal(match?.dest, "/index.html", path);
  }
});

test("filesystem misses including dotfiles resolve to a real 404", () => {
  const routes = createVercelConfig("https://stay-api.onrender.com").routes;
  assert.ok(routes.findIndex(rule => rule.handle === "filesystem") < routes.findIndex(rule => rule.dest === "/index.html"));
  for (const path of ["/.env.local", "/.git/config", "/static/missing.js", "/missing.png", "/unknown"]) {
    const match = routes.find(rule => rule.src && !rule.continue && new RegExp(rule.src).test(path));
    assert.equal(match?.status, 404, path);
  }
});

test("session and CSRF responses cannot be cached at the proxy", () => {
  const config = createVercelConfig("https://stay-api.onrender.com");
  const headers = config.routes.find(rule => rule.dest?.startsWith("https://")).headers;
  for (const name of ["Cache-Control", "CDN-Cache-Control", "Vercel-CDN-Cache-Control"]) assert.equal(headers[name], "no-store");
});

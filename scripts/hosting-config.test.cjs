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
  assert.deepEqual(config.rewrites[0], { source: "/api/:path*", destination: "https://stay-api.onrender.com/api/:path*" });
  assert.equal(config.buildCommand, "npm run build");
  assert.equal(config.outputDirectory, "build");
});

test("deep links include authentication, private workspaces and hotel search", () => {
  const sources = createVercelConfig("https://stay-api.onrender.com").rewrites.map(rule => rule.source);
  for (const path of ["/login", "/register", "/forgot-password", "/reset-password", "/account", "/wishlist", "/notifications", "/bookings", "/hotels/:path*", "/hotel/:path*", "/host/:path*", "/admin/:path*"]) {
    assert.ok(sources.includes(path), path);
  }
});

test("missing static resources and dotfiles cannot fall through to SPA HTML", () => {
  const config = createVercelConfig("https://stay-api.onrender.com");
  assert.ok(config.rewrites.every(rule => rule.source !== "/(.*)" && rule.source !== "/:path*"));
  assert.ok(config.rewrites.every(rule => !rule.source.startsWith("/static") && !rule.source.startsWith("/.")));
});

test("session and CSRF responses cannot be cached at the proxy", () => {
  const config = createVercelConfig("https://stay-api.onrender.com");
  const headers = Object.fromEntries(config.headers.find(rule => rule.source === "/api/:path*").headers.map(header => [header.key, header.value]));
  for (const name of ["Cache-Control", "CDN-Cache-Control", "Vercel-CDN-Cache-Control"]) assert.equal(headers[name], "no-store");
});

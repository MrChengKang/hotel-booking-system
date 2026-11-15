// Read-only HTTP checks. Usage: npm run check:deployment -- https://your-site.example
const value = process.argv[2];
if (!value) throw new Error("Provide your site's HTTPS origin, e.g. npm run check:deployment -- https://stay.example.com");
const base = new URL(value);
if (base.username || base.password || base.search || base.hash || (base.pathname !== "/")) throw new Error("Provide an origin without credentials, query, fragment or path.");
if (base.protocol !== "https:" && !(base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))) throw new Error("Use HTTPS; HTTP is allowed only for a local container check.");

async function request(path) {
  return fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(15000) });
}
function assert(condition, message) { if (!condition) throw new Error(message); }
const health = await request("/api/health");
assert(health.status === 200 && (await health.json()).status === "UP", "API or database readiness check failed.");
for (const path of ["/", "/bookings", "/hotel/1"]) {
  const response = await request(path);
  assert(response.status === 200 && response.headers.get("content-type")?.includes("text/html"), `SPA route failed: ${path}`);
}
const asset = await request("/static/deployment-check-missing.js");
assert(asset.status === 404, "Missing assets must return 404 rather than the SPA HTML.");
const privateResponse = await request("/api/auth/me");
assert(privateResponse.status === 401 && privateResponse.headers.get("content-type")?.includes("application/json"), "The private API must stay protected and must not resolve to SPA HTML.");
const secret = await request("/.env.local");
assert(secret.status === 404 || secret.status === 403, "Local environment files must not be served.");
console.log("PASS: API/database readiness, SPA deep links, missing assets, private API and environment-file protection.");
console.log("Still verify login, mail, image uploads and a Stripe sandbox payment using your real HTTPS deployment.");

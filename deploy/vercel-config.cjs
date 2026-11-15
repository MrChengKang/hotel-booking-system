const singlePages = ["login", "register", "forgot-password", "reset-password", "account", "wishlist", "notifications", "bookings"];
const nestedPages = ["hotels", "hotel", "host", "admin"];

function backendOrigin(value) {
  let origin;
  try { origin = new URL((value || "").trim()); }
  catch { throw new Error("Set STAY_BACKEND_ORIGIN to the Render backend HTTPS origin in Vercel."); }
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash
      || origin.pathname !== "/" || ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
    throw new Error("STAY_BACKEND_ORIGIN must be a public HTTPS origin without credentials, path, query or fragment.");
  }
  return origin.origin;
}

function createVercelConfig(value) {
  const origin = backendOrigin(value);
  return {
    framework: "create-react-app",
    installCommand: "npm ci --no-audit --no-fund",
    buildCommand: "npm run build",
    outputDirectory: "build",
    // Explicit ordering also overrides CRA's platform-wide SPA fallback, which
    // otherwise returns index.html for nonexistent dotfiles such as /.env.local.
    routes: [
      { src: "^/.*$", headers: {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      }, continue: true },
      { src: "^/api(?:/(.*))?$", dest: `${origin}/api/$1`, headers: {
        "Cache-Control": "no-store",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      } },
      { handle: "filesystem" },
      { src: "^/$", dest: "/index.html" },
      { src: `^/(${singlePages.join("|")})/?$`, dest: "/index.html" },
      { src: `^/(${nestedPages.join("|")})(?:/.*)?$`, dest: "/index.html" },
      { src: "^/.*$", status: 404 },
    ],
  };
}

module.exports = { backendOrigin, createVercelConfig };

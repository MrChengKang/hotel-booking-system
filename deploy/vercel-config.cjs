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
    rewrites: [
      { source: "/api/:path*", destination: `${origin}/api/:path*` },
      ...singlePages.map(page => ({ source: `/${page}`, destination: "/index.html" })),
      ...nestedPages.map(page => ({ source: `/${page}/:path*`, destination: "/index.html" })),
    ],
    headers: [
      { source: "/(.*)", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ] },
      { source: "/api/:path*", headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "CDN-Cache-Control", value: "no-store" },
        { key: "Vercel-CDN-Cache-Control", value: "no-store" },
      ] },
    ],
  };
}

module.exports = { backendOrigin, createVercelConfig };

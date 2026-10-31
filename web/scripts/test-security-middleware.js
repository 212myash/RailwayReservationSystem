/* eslint-disable @typescript-eslint/no-require-imports */
const { SignJWT, jwtVerify } = require("jose");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) {
        process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const secretStr = process.env.AUTH_SECRET || "railconnect_super_secret_jwt_key_minimum_32_characters_long_for_security";
const secret = new TextEncoder().encode(secretStr);

async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("railconnect")
    .setAudience("railconnect-web")
    .setExpirationTime("7d")
    .sign(secret);
}

// Simulated middleware logic mirroring web/middleware.ts
async function verifyToken(token, secretStr) {
  try {
    const s = new TextEncoder().encode(secretStr);
    const { payload } = await jwtVerify(token, s, {
      issuer: "railconnect",
      audience: "railconnect-web",
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub === "string" &&
      typeof payload.name === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "user" || payload.role === "admin")
    ) {
      return {
        userId: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function simulateMiddleware(pathname, searchParams = {}, cookieToken = null) {
  const search = Object.keys(searchParams).length
    ? "?" + new URLSearchParams(searchParams).toString()
    : "";
  const fullUrl = `http://localhost:3000${pathname}${search}`;
  const session = cookieToken ? await verifyToken(cookieToken, secretStr) : null;

  // 1. Admin Routes Protection (/admin, /admin/*)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", fullUrl);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return { action: "redirect", status: 307, destination: loginUrl.pathname + loginUrl.search };
    }

    if (session.role !== "admin") {
      const dashboardUrl = new URL("/dashboard", fullUrl);
      dashboardUrl.searchParams.set("unauthorized", "admin");
      return { action: "redirect", status: 307, destination: dashboardUrl.pathname + dashboardUrl.search };
    }

    return { action: "next", status: 200, destination: null };
  }

  // 2. Protected Passenger Routes (/bookings, /profile, /settings)
  const isProtectedPassengerRoute =
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings");

  if (isProtectedPassengerRoute) {
    if (!session) {
      const loginUrl = new URL("/login", fullUrl);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return { action: "redirect", status: 307, destination: loginUrl.pathname + loginUrl.search };
    }
    return { action: "next", status: 200, destination: null };
  }

  // 3. Guest-only Routes (/login, /register)
  const isGuestOnlyRoute = pathname === "/login" || pathname === "/register";
  if (isGuestOnlyRoute && session) {
    const queryRedirect = searchParams["redirect"];
    const isSafeRedirect =
      queryRedirect &&
      queryRedirect.startsWith("/") &&
      !queryRedirect.startsWith("//") &&
      !queryRedirect.startsWith("/\\");

    if (isSafeRedirect) {
      if (queryRedirect.startsWith("/admin") && session.role !== "admin") {
        return { action: "redirect", status: 307, destination: "/dashboard?unauthorized=admin" };
      }
      return { action: "redirect", status: 307, destination: queryRedirect };
    }

    const destination = session.role === "admin" ? "/admin" : "/dashboard";
    return { action: "redirect", status: 307, destination };
  }

  return { action: "next", status: 200, destination: null };
}

async function runTestSuite() {
  console.log("=============================================================");
  console.log("🛡️  RailConnect — Security & Route Protection Test Suite");
  console.log("=============================================================");

  const passengerToken = await createToken({
    sub: "user_12345",
    name: "Regular Passenger",
    email: "passenger@test.com",
    role: "user",
  });

  const adminToken = await createToken({
    sub: "admin_99999",
    name: "System Administrator",
    email: "admin@railconnect.in",
    role: "admin",
  });

  const forgedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
    }
  }

  // 1. Guest -> Admin
  let res = await simulateMiddleware("/admin", {}, null);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fadmin",
    "Unauthenticated guest accessing /admin is redirected to /login?redirect=/admin"
  );

  // 2. Guest -> Admin nested route
  res = await simulateMiddleware("/admin/trains", { filter: "active" }, null);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fadmin%2Ftrains%3Ffilter%3Dactive",
    "Unauthenticated guest accessing nested /admin/trains retains complete search params in redirect"
  );

  // 3. Forged Token -> Admin
  res = await simulateMiddleware("/admin", {}, forgedToken);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fadmin",
    "Tampered/forged JWT is rejected and redirected to login"
  );

  // 4. Passenger -> Admin (RBAC isolation)
  res = await simulateMiddleware("/admin", {}, passengerToken);
  assert(
    res.action === "redirect" && res.destination === "/dashboard?unauthorized=admin",
    "Regular passenger accessing /admin is redirected to /dashboard?unauthorized=admin"
  );

  // 5. Admin -> Admin
  res = await simulateMiddleware("/admin", {}, adminToken);
  assert(
    res.action === "next" && res.destination === null,
    "Verified administrator is granted access (status 200) to /admin"
  );

  // 6. Guest -> /bookings
  res = await simulateMiddleware("/bookings", {}, null);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fbookings",
    "Guest accessing /bookings is redirected to /login?redirect=/bookings"
  );

  // 7. Passenger -> /bookings
  res = await simulateMiddleware("/bookings", {}, passengerToken);
  assert(
    res.action === "next",
    "Authenticated passenger is permitted access to /bookings"
  );

  // 8. Guest -> /profile
  res = await simulateMiddleware("/profile", {}, null);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fprofile",
    "Guest accessing /profile is redirected to /login?redirect=/profile"
  );

  // 9. Guest -> /settings
  res = await simulateMiddleware("/settings", {}, null);
  assert(
    res.action === "redirect" && res.destination === "/login?redirect=%2Fsettings",
    "Guest accessing /settings is redirected to /login?redirect=/settings"
  );

  // 10. Passenger -> /login (already authenticated)
  res = await simulateMiddleware("/login", {}, passengerToken);
  assert(
    res.action === "redirect" && res.destination === "/dashboard",
    "Logged-in passenger accessing /login is bounced directly to /dashboard"
  );

  // 11. Admin -> /login (already authenticated)
  res = await simulateMiddleware("/login", {}, adminToken);
  assert(
    res.action === "redirect" && res.destination === "/admin",
    "Logged-in admin accessing /login is bounced directly to /admin"
  );

  // 12. Safe redirect handling
  res = await simulateMiddleware("/login", { redirect: "/booking/review" }, passengerToken);
  assert(
    res.action === "redirect" && res.destination === "/booking/review",
    "Logged-in user with valid internal redirect is forwarded to destination"
  );

  // 13. Unsafe external redirect handling
  res = await simulateMiddleware("/login", { redirect: "https://malicious-site.com" }, passengerToken);
  assert(
    res.action === "redirect" && res.destination === "/dashboard",
    "Unsafe external redirect attempt is sanitized and bounced to /dashboard"
  );

  // 14. Passenger attempting privilege escalation via login redirect
  res = await simulateMiddleware("/login", { redirect: "/admin" }, passengerToken);
  assert(
    res.action === "redirect" && res.destination === "/dashboard?unauthorized=admin",
    "Passenger attempting redirect to /admin via query param is blocked with unauthorized alert"
  );

  // 15. Public Routes Unrestricted
  res = await simulateMiddleware("/", {}, null);
  assert(res.action === "next", "Public home page / accessible to all");

  res = await simulateMiddleware("/about", {}, null);
  assert(res.action === "next", "Public /about page accessible to all");

  res = await simulateMiddleware("/contact", {}, null);
  assert(res.action === "next", "Public /contact page accessible to all");

  res = await simulateMiddleware("/trains", {}, null);
  assert(res.action === "next", "Public /trains search page accessible to all");

  res = await simulateMiddleware("/pnr-status", {}, null);
  assert(res.action === "next", "Public /pnr-status page accessible to all");

  console.log("-------------------------------------------------------------");
  console.log(`Security Test Results: ${passed} / ${total} tests passed.`);
  console.log("=============================================================");
}

runTestSuite().catch(console.error);

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "railconnect_session";

async function verifyToken(token: string, secretStr: string) {
  try {
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jwtVerify(token, secret, {
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
        role: payload.role as "user" | "admin",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET;

  const session = token && secret ? await verifyToken(token, secret) : null;

  // 1. Admin Routes Protection (/admin, /admin/*)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== "admin") {
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("unauthorized", "admin");
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  }

  // 2. Protected Passenger Routes (/bookings, /profile, /settings)
  const isProtectedPassengerRoute =
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings");

  if (isProtectedPassengerRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Guest-only Routes (/login, /register)
  const isGuestOnlyRoute = pathname === "/login" || pathname === "/register";
  if (isGuestOnlyRoute && session) {
    const queryRedirect = request.nextUrl.searchParams.get("redirect");
    const isSafeRedirect =
      queryRedirect &&
      queryRedirect.startsWith("/") &&
      !queryRedirect.startsWith("//") &&
      !queryRedirect.includes("\\");

    if (isSafeRedirect && queryRedirect) {
      if (queryRedirect.startsWith("/admin") && session.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL(queryRedirect, request.url));
    }

    const defaultTarget = session.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(defaultTarget, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};

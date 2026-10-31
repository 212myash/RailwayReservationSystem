import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "railconnect_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured in .env.local");
  }

  return new TextEncoder().encode(secret);
}

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, getAuthSecret(), {
      issuer: "railconnect",
      audience: "railconnect-web",
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Validates active session and ensures the user possesses administrator privileges.
 * Returns the verified AuthSession if role is "admin", or null otherwise.
 */
export async function getAdminSession(): Promise<AuthSession | null> {
  const session = await getAuthSession();

  if (!session || session.role !== "admin") {
    return null;
  }

  return session;
}
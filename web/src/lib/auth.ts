import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "setpulse_session";

function secretKey() {
  const secret = process.env.SESSION_SECRET ?? "dev-only-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSession(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function verifyDemoCredentials(email: string, password: string): boolean {
  const demoEmail = process.env.DEMO_USER_EMAIL ?? "demo@setpulse.local";
  const demoPassword = process.env.DEMO_USER_PASSWORD ?? "demo12345";
  return email === demoEmail && password === demoPassword;
}

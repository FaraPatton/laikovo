import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "laikovo_pin_session";
const SESSION_VALUE = "authorized";

function getPinSecret() {
  const secret = process.env.APP_PIN;

  if (!secret) {
    throw new Error("APP_PIN is not configured.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getPinSecret()).update(value).digest("base64url");
}

function sessionToken() {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isPinAuthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  return safeEqual(token, sessionToken());
}

export async function authorizePin(pin: string) {
  if (!safeEqual(pin, getPinSecret())) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return true;
}

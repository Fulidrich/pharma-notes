import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "";
}

function makeToken(secret: string): string {
  return crypto.createHash("sha256").update(`pharma-notes:${secret}`).digest("hex");
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getSecret());
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const secret = getSecret();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const current = request.cookies.get(COOKIE_NAME)?.value || "";
  return current === makeToken(secret);
}

export function validateAdminPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) {
    return false;
  }

  return password === secret;
}

export function setAdminSessionCookie(response: NextResponse): void {
  const secret = getSecret();
  if (!secret) {
    return;
  }

  response.cookies.set({
    name: COOKIE_NAME,
    value: makeToken(secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  isAdminPasswordConfigured,
  setAdminSessionCookie,
  validateAdminPassword
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        error: "ADMIN_PASSWORD is not configured."
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password || "";

  if (!validateAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response);
  return response;
}

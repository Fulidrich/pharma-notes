import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";

export function GET(request: NextRequest) {
  return NextResponse.json({
    configured: isAdminPasswordConfigured(),
    authenticated: isAdminAuthenticated(request)
  });
}

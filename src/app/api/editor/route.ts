import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteEditableMarkdown,
  isSupabaseStorageEnabled,
  listEditableSlugs,
  readEditableMarkdown,
  saveEditableMarkdown
} from "@/lib/content";
import { getTemplate, isSectionKey, isValidSlug } from "@/lib/editor";

function rejectUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function rejectInvalidSection() {
  return NextResponse.json({ error: "Invalid section" }, { status: 400 });
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return rejectUnauthorized();
  }

  const action = request.nextUrl.searchParams.get("action") || "list";
  const section = request.nextUrl.searchParams.get("section") || "";

  if (!isSectionKey(section)) {
    return rejectInvalidSection();
  }

  if (action === "list") {
    return NextResponse.json({ slugs: await listEditableSlugs(section) });
  }

  if (action === "template") {
    return NextResponse.json({ content: getTemplate(section) });
  }

  if (action === "file") {
    const slug = request.nextUrl.searchParams.get("slug") || "";
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const content = await readEditableMarkdown(section, slug);
    return NextResponse.json({ exists: content !== null, content: content ?? "" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return rejectUnauthorized();
  }

  const body = (await request.json()) as {
    section?: string;
    slug?: string;
    content?: string;
  };

  const section = body.section || "";
  const slug = body.slug || "";
  const content = body.content;

  if (!isSectionKey(section)) {
    return rejectInvalidSection();
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !isSupabaseStorageEnabled()) {
    return NextResponse.json(
      {
        error: "Production editing requires Supabase storage. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      },
      { status: 403 }
    );
  }

  await saveEditableMarkdown(section, slug, content);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return rejectUnauthorized();
  }

  const body = (await request.json().catch(() => null)) as { section?: string; slug?: string } | null;
  const section = body?.section || "";
  const slug = body?.slug || "";

  if (!isSectionKey(section)) {
    return rejectInvalidSection();
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && !isSupabaseStorageEnabled()) {
    return NextResponse.json(
      {
        error: "Production deletion requires Supabase storage. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      },
      { status: 403 }
    );
  }

  await deleteEditableMarkdown(section, slug);
  return NextResponse.json({ ok: true });
}

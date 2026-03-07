import { NextRequest, NextResponse } from "next/server";
import {
  getTemplate,
  isSectionKey,
  isValidSlug,
  listSlugs,
  readMarkdownFile,
  saveMarkdownFile
} from "@/lib/editor";

const RUNTIME_WRITES_ENABLED = process.env.ALLOW_RUNTIME_WRITES === "true";

export function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "list";
  const section = request.nextUrl.searchParams.get("section") || "";

  if (!isSectionKey(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  if (action === "list") {
    return NextResponse.json({ slugs: listSlugs(section) });
  }

  if (action === "template") {
    return NextResponse.json({ content: getTemplate(section) });
  }

  if (action === "file") {
    const slug = request.nextUrl.searchParams.get("slug") || "";
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const content = readMarkdownFile(section, slug);
    return NextResponse.json({ exists: content !== null, content: content ?? "" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !RUNTIME_WRITES_ENABLED) {
    return NextResponse.json(
      {
        error:
          "Runtime write is disabled in production. Deploy with a database/Git-backed editor, or set ALLOW_RUNTIME_WRITES=true only for self-hosted writable environments."
      },
      { status: 403 }
    );
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
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers, and hyphens" }, { status: 400 });
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  saveMarkdownFile(section, slug, content);
  return NextResponse.json({ ok: true });
}

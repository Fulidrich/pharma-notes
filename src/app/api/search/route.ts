import { NextRequest, NextResponse } from "next/server";
import { getSearchDocuments } from "@/lib/content";
import { isLanguage, Language } from "@/lib/i18n";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

export async function GET(request: NextRequest) {
  const query = normalize(request.nextUrl.searchParams.get("q") || "");
  const langParam = request.nextUrl.searchParams.get("lang") || "en";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const lang: Language = isLanguage(langParam) ? langParam : "en";
  const docs = await getSearchDocuments();

  const results = docs
    .map((doc) => {
      const corpus = lang === "en" ? `${doc.title_en}\n${doc.text_en}` : `${doc.title_zh}\n${doc.text_zh}`;
      const score = normalize(corpus).includes(query) ? 1 : 0;
      return { doc, score };
    })
    .filter((item) => item.score > 0)
    .slice(0, 30)
    .map(({ doc }) => ({
      section: doc.section,
      slug: doc.slug,
      title: lang === "en" ? doc.title_en : doc.title_zh,
      snippet:
        lang === "en"
          ? doc.text_en.replace(/\n+/g, " ").slice(0, 140)
          : doc.text_zh.replace(/\n+/g, " ").slice(0, 140)
    }));

  return NextResponse.json({ results });
}

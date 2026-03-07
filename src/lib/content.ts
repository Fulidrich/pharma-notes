import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Language, SectionKey, SECTION_KEYS } from "@/lib/i18n";

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

type BaseData = {
  title_en?: string;
  title_zh?: string;
  summary_en?: string;
  summary_zh?: string;
  body_en?: string;
  body_zh?: string;
};

export type ContentEntry = {
  slug: string;
  section: SectionKey;
  title: string;
  summary: string;
  body: string;
  raw: Record<string, unknown>;
};

export type DrugTemplate = {
  slug: string;
  title: string;
  raw: Record<string, unknown>;
  fields: Array<{ key: string; label: string; value: string }>;
};

function readDirSafe(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function readMarkdown(section: SectionKey, slug: string) {
  const fullPath = path.join(CONTENT_ROOT, section, `${slug}.md`);
  const source = fs.readFileSync(fullPath, "utf8");
  return matter(source);
}

function localized(data: BaseData, lang: Language, slug: string) {
  const titleEn = typeof data.title_en === "string" && data.title_en.trim() ? data.title_en : slug;
  const titleZh = typeof data.title_zh === "string" && data.title_zh.trim() ? data.title_zh : slug;

  return {
    title: lang === "en" ? titleEn : titleZh,
    summary: lang === "en" ? data.summary_en ?? "" : data.summary_zh ?? "",
    body: lang === "en" ? data.body_en ?? "" : data.body_zh ?? ""
  };
}

export function getCollectionEntries(section: SectionKey, lang: Language): ContentEntry[] {
  const folder = path.join(CONTENT_ROOT, section);
  const files = readDirSafe(folder);

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const parsed = readMarkdown(section, slug);
      const data = parsed.data as BaseData;
      const loc = localized(data, lang, slug);

      return {
        slug,
        section,
        title: loc.title,
        summary: loc.summary,
        body: loc.body,
        raw: parsed.data as Record<string, unknown>
      };
    })
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

export function getEntry(section: SectionKey, slug: string, lang: Language): ContentEntry | null {
  const fullPath = path.join(CONTENT_ROOT, section, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const parsed = readMarkdown(section, slug);
  const data = parsed.data as BaseData;
  const loc = localized(data, lang, slug);

  return {
    slug,
    section,
    title: loc.title,
    summary: loc.summary,
    body: loc.body,
    raw: parsed.data as Record<string, unknown>
  };
}

export function getDrugPage(slug: string, lang: Language): DrugTemplate | null {
  const entry = getEntry("drugs", slug, lang);
  if (!entry) {
    return null;
  }

  const raw = entry.raw;

  const keys = [
    ["drug_class", "Drug Class", "药物分类"],
    ["mechanism", "Mechanism of Action", "作用机制"],
    ["pharmacokinetics", "Pharmacokinetics", "药代动力学"],
    ["indications", "Indications", "适应证"],
    ["side_effects", "Side Effects", "不良反应"],
    ["contraindications", "Contraindications", "禁忌证"],
    ["drug_interactions", "Drug Interactions", "药物相互作用"],
    ["exam_notes", "Exam Notes", "考试重点"],
    ["personal_notes", "Personal Notes", "个人笔记"]
  ] as const;

  const fields = keys.map(([base, enLabel, zhLabel]) => {
    const key = `${base}_${lang}`;
    const label = lang === "en" ? enLabel : zhLabel;
    const value = String(raw[key] ?? "");
    return { key: base, label, value };
  });

  return {
    slug,
    title: entry.title,
    raw,
    fields
  };
}

export type SearchDoc = {
  section: SectionKey;
  slug: string;
  title_en: string;
  title_zh: string;
  text_en: string;
  text_zh: string;
};

export function getSearchDocuments(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const section of SECTION_KEYS) {
    const folder = path.join(CONTENT_ROOT, section);
    const files = readDirSafe(folder);

    files.forEach((file) => {
      const slug = file.replace(/\.md$/, "");
      const parsed = readMarkdown(section, slug);
      const data = parsed.data as Record<string, unknown>;

      const textEn = Object.entries(data)
        .filter(([k]) => k.endsWith("_en"))
        .map(([, v]) => String(v))
        .join("\n");
      const textZh = Object.entries(data)
        .filter(([k]) => k.endsWith("_zh"))
        .map(([, v]) => String(v))
        .join("\n");

      docs.push({
        section,
        slug,
        title_en: String(data.title_en ?? slug),
        title_zh: String(data.title_zh ?? slug),
        text_en: textEn,
        text_zh: textZh
      });
    });
  }

  return docs;
}

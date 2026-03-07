import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Language, SectionKey, SECTION_KEYS } from "@/lib/i18n";

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type BaseData = {
  title_en?: string;
  title_zh?: string;
  summary_en?: string;
  summary_zh?: string;
  body_en?: string;
  body_zh?: string;
};

type StoredDocument = {
  section: SectionKey;
  slug: string;
  source: string;
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

export type SearchDoc = {
  section: SectionKey;
  slug: string;
  title_en: string;
  title_zh: string;
  text_en: string;
  text_zh: string;
};

type SupabaseRow = {
  section: SectionKey;
  slug: string;
  content: string;
};

function hasSupabase(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest<T>(url: URL, init?: RequestInit): Promise<T> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase service role key is missing.");
  }

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function loadFromSupabase(section?: SectionKey): Promise<StoredDocument[]> {
  const url = new URL("/rest/v1/notes", SUPABASE_URL);
  url.searchParams.set("select", "section,slug,content");
  url.searchParams.set("order", "slug.asc");

  if (section) {
    url.searchParams.set("section", `eq.${section}`);
  }

  const rows = await supabaseRequest<SupabaseRow[]>(url);
  return rows.map((row) => ({ section: row.section, slug: row.slug, source: row.content ?? "" }));
}

function loadFromFileSystem(section?: SectionKey): StoredDocument[] {
  const sections = section ? [section] : [...SECTION_KEYS];
  const docs: StoredDocument[] = [];

  sections.forEach((currentSection) => {
    const dir = path.join(CONTENT_ROOT, currentSection);
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.readdirSync(dir)
      .filter((file) => file.endsWith(".md"))
      .forEach((file) => {
        const slug = file.replace(/\.md$/, "");
        const source = fs.readFileSync(path.join(dir, file), "utf8");
        docs.push({ section: currentSection, slug, source });
      });
  });

  return docs;
}

async function loadDocuments(section?: SectionKey): Promise<StoredDocument[]> {
  if (hasSupabase()) {
    return loadFromSupabase(section);
  }

  return loadFromFileSystem(section);
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

function parseEntry(section: SectionKey, slug: string, source: string, lang: Language): ContentEntry {
  const parsed = matter(source || "");
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

export async function getCollectionEntries(section: SectionKey, lang: Language): Promise<ContentEntry[]> {
  const docs = await loadDocuments(section);

  return docs
    .map((doc) => parseEntry(doc.section, doc.slug, doc.source, lang))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

export async function getEntry(section: SectionKey, slug: string, lang: Language): Promise<ContentEntry | null> {
  const docs = await loadDocuments(section);
  const doc = docs.find((item) => item.slug === slug);
  if (!doc) {
    return null;
  }

  return parseEntry(section, slug, doc.source, lang);
}

export async function getDrugPage(slug: string, lang: Language): Promise<DrugTemplate | null> {
  const entry = await getEntry("drugs", slug, lang);
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

export async function getSearchDocuments(): Promise<SearchDoc[]> {
  const docs = await loadDocuments();

  return docs.map((doc) => {
    const parsed = matter(doc.source || "");
    const data = parsed.data as Record<string, unknown>;

    const textEn = Object.entries(data)
      .filter(([k]) => k.endsWith("_en"))
      .map(([, v]) => String(v))
      .join("\n");

    const textZh = Object.entries(data)
      .filter(([k]) => k.endsWith("_zh"))
      .map(([, v]) => String(v))
      .join("\n");

    return {
      section: doc.section,
      slug: doc.slug,
      title_en: String(data.title_en ?? doc.slug),
      title_zh: String(data.title_zh ?? doc.slug),
      text_en: textEn,
      text_zh: textZh
    };
  });
}

export async function listEditableSlugs(section: SectionKey): Promise<string[]> {
  const docs = await loadDocuments(section);
  return docs.map((doc) => doc.slug).sort((a, b) => a.localeCompare(b));
}

export async function readEditableMarkdown(section: SectionKey, slug: string): Promise<string | null> {
  const docs = await loadDocuments(section);
  const doc = docs.find((item) => item.slug === slug);
  return doc ? doc.source : null;
}

export async function saveEditableMarkdown(section: SectionKey, slug: string, content: string): Promise<void> {
  if (hasSupabase()) {
    const url = new URL("/rest/v1/notes", SUPABASE_URL);
    url.searchParams.set("on_conflict", "section,slug");

    await supabaseRequest<void>(url, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify([{ section, slug, content }])
    });
    return;
  }

  const dir = path.join(CONTENT_ROOT, section);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(path.join(dir, `${slug}.md`), content, "utf8");
}

export async function deleteEditableMarkdown(section: SectionKey, slug: string): Promise<void> {
  if (hasSupabase()) {
    const url = new URL("/rest/v1/notes", SUPABASE_URL);
    url.searchParams.set("section", `eq.${section}`);
    url.searchParams.set("slug", `eq.${slug}`);

    await supabaseRequest<void>(url, {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal"
      }
    });
    return;
  }

  const filePath = path.join(CONTENT_ROOT, section, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function isSupabaseStorageEnabled(): boolean {
  return hasSupabase();
}

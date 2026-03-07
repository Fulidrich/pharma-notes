import fs from "node:fs";
import path from "node:path";
import { SECTION_KEYS, SectionKey } from "@/lib/i18n";

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

export function isSectionKey(value: string): value is SectionKey {
  return SECTION_KEYS.includes(value as SectionKey);
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

function getSectionDir(section: SectionKey): string {
  return path.join(CONTENT_ROOT, section);
}

function getFilePath(section: SectionKey, slug: string): string {
  return path.join(getSectionDir(section), `${slug}.md`);
}

export function listSlugs(section: SectionKey): string[] {
  const dir = getSectionDir(section);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort((a, b) => a.localeCompare(b));
}

export function readMarkdownFile(section: SectionKey, slug: string): string | null {
  const filePath = getFilePath(section, slug);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}

export function saveMarkdownFile(section: SectionKey, slug: string, content: string): void {
  const dir = getSectionDir(section);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(getFilePath(section, slug), content, "utf8");
}

export function getTemplate(section: SectionKey): string {
  if (section === "drugs") {
    return `---
title_en: Drug Name
title_zh: 药物名称
summary_en: One-line summary.
summary_zh: 一句话摘要。
drug_class_en: Drug class
drug_class_zh: 药物分类
mechanism_en: |
  Mechanism of action.
mechanism_zh: |
  作用机制。
pharmacokinetics_en: |
  - Key PK point 1
  - Key PK point 2
pharmacokinetics_zh: |
  - 关键药代点 1
  - 关键药代点 2
indications_en: |
  - Indication 1
indications_zh: |
  - 适应证 1
side_effects_en: |
  - Side effect 1
side_effects_zh: |
  - 不良反应 1
contraindications_en: |
  - Contraindication 1
contraindications_zh: |
  - 禁忌证 1
drug_interactions_en: |
  - Interaction 1
drug_interactions_zh: |
  - 相互作用 1
exam_notes_en: |
  High-yield exam note.
exam_notes_zh: |
  高频考点。
personal_notes_en: |
  Personal clinical/study note.
personal_notes_zh: |
  个人临床/学习笔记。
---
`;
  }

  return `---
title_en: Title
title_zh: 标题
summary_en: One-line summary.
summary_zh: 一句话摘要。
body_en: |
  # Heading
  Write your note in Markdown.
body_zh: |
  # 标题
  用 Markdown 写你的笔记。
---
`;
}

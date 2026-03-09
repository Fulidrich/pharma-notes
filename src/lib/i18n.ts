export const LANGUAGES = ["en", "zh"] as const;

export type Language = (typeof LANGUAGES)[number];

export const SECTION_KEYS = [
  "drug-classes",
  "drugs",
  "mechanisms",
  "diseases",
  "personal-notes",
  "study-notes"
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isLanguage(value: string): value is Language {
  return LANGUAGES.includes(value as Language);
}

export const labels = {
  en: {
    appName: "Pharmacology",
    sections: {
      "drug-classes": "Drug Classes",
      drugs: "Drugs",
      mechanisms: "Mechanisms",
      diseases: "Diseases",
      "personal-notes": "Personal Clinical Notes",
      "study-notes": "Study Notes"
    },
    search: "Search",
    catalog: "Catalog",
    editor: "Editor",
    subtitle: "Personal pharmacology knowledge base",
    noResults: "No results found."
  },
  zh: {
    appName: "药理学",
    sections: {
      "drug-classes": "药物分类",
      drugs: "药物",
      mechanisms: "作用机制",
      diseases: "疾病与适应证",
      "personal-notes": "个人临床笔记",
      "study-notes": "学习笔记"
    },
    search: "搜索",
    catalog: "目录",
    editor: "编辑器",
    subtitle: "个人药理学知识库",
    noResults: "未找到结果。"
  }
} as const;

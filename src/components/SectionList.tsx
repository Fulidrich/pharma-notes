import Link from "next/link";
import { ContentEntry } from "@/lib/content";
import { Language, labels, SectionKey } from "@/lib/i18n";

export function SectionList({
  lang,
  section,
  entries
}: {
  lang: Language;
  section: SectionKey;
  entries: ContentEntry[];
}) {
  const t = labels[lang];

  return (
    <>
      <h1 className="page-title">{t.sections[section]}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      {entries.map((entry) => (
        <Link key={entry.slug} href={`/${lang}/${section}/${entry.slug}`} className="card">
          <h3>{entry.title}</h3>
          <p>{entry.summary}</p>
        </Link>
      ))}
    </>
  );
}

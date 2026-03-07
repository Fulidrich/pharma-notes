import Link from "next/link";
import { labels, SectionKey, SECTION_KEYS, Language, isLanguage } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default function Dashboard({ params }: { params: { lang: string } }) {
  if (!isLanguage(params.lang)) {
    notFound();
  }

  const lang = params.lang as Language;
  const t = labels[lang];

  return (
    <>
      <h1 className="page-title">{t.appName}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      {SECTION_KEYS.map((section) => (
        <Link href={`/${lang}/${section}`} key={section as SectionKey} className="card">
          <h3>{t.sections[section]}</h3>
        </Link>
      ))}
    </>
  );
}

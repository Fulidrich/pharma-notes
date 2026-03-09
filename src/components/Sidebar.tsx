import Link from "next/link";
import { Language, labels, SECTION_KEYS } from "@/lib/i18n";

export function Sidebar({ lang }: { lang: Language }) {
  const t = labels[lang];

  return (
    <aside className="sidebar">
      <div className="brand">{t.appName}</div>
      <div className="nav-group">
        <div className="nav-label">{t.subtitle}</div>
        {SECTION_KEYS.map((key) => (
          <Link key={key} href={`/${lang}/${key}`} className="nav-link">
            {t.sections[key]}
          </Link>
        ))}
        <Link href={`/${lang}/catalog`} className="nav-link">
          {t.catalog}
        </Link>
        <Link href={`/${lang}/editor`} className="nav-link">
          {t.editor}
        </Link>
      </div>
    </aside>
  );
}

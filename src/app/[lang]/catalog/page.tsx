import Link from "next/link";
import { getCollectionEntries } from "@/lib/content";
import { isLanguage, labels, Language, SECTION_KEYS, SectionKey } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function CatalogPage({ params }: { params: { lang: string } }) {
  if (!isLanguage(params.lang)) {
    notFound();
  }

  const lang = params.lang as Language;
  const t = labels[lang];

  const grouped = await Promise.all(
    SECTION_KEYS.map(async (section) => {
      const entries = await getCollectionEntries(section, lang);
      return { section, entries };
    })
  );

  const catalogTitle = lang === "en" ? "Catalog" : "目录";
  const catalogSubtitle =
    lang === "en"
      ? "Structured index of all pharmacology notes"
      : "药理学知识内容的结构化索引";

  return (
    <>
      <h1 className="page-title">{catalogTitle}</h1>
      <p className="page-subtitle">{catalogSubtitle}</p>

      <div className="catalog-jump card">
        {grouped.map(({ section, entries }) => (
          <a key={section} href={`#catalog-${section}`} className="catalog-jump-link">
            {t.sections[section]} ({entries.length})
          </a>
        ))}
      </div>

      {grouped.map(({ section, entries }) => (
        <section key={section} id={`catalog-${section}`} className="catalog-block card">
          <h2 className="catalog-head">
            <span>{t.sections[section]}</span>
            <span className="catalog-count">{entries.length}</span>
          </h2>

          {entries.length === 0 ? (
            <p className="meta">{lang === "en" ? "No entries." : "暂无条目。"}</p>
          ) : (
            <div className="catalog-list">
              {entries.map((entry) => (
                <Link key={`${section}-${entry.slug}`} href={`/${lang}/${section}/${entry.slug}`} className="catalog-item">
                  <span className="catalog-item-title">{entry.title}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  );
}

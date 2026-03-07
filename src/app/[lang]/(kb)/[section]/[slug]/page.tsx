import { notFound } from "next/navigation";
import { MarkdownBlock } from "@/components/MarkdownBlock";
import { getDrugPage, getEntry } from "@/lib/content";
import { isLanguage, labels, Language, SECTION_KEYS, SectionKey } from "@/lib/i18n";

function isSection(section: string): section is SectionKey {
  return SECTION_KEYS.includes(section as SectionKey);
}

export default async function ItemDetail({
  params
}: {
  params: { lang: string; section: string; slug: string };
}) {
  if (!isLanguage(params.lang) || !isSection(params.section)) {
    notFound();
  }

  const lang = params.lang as Language;
  const section = params.section as SectionKey;

  if (section === "drugs") {
    const drug = getDrugPage(params.slug, lang);
    if (!drug) {
      notFound();
    }

    return (
      <>
        <h1 className="page-title">{drug.title}</h1>
        <p className="page-subtitle">{labels[lang].sections.drugs}</p>
        {drug.fields.map((field) => (
          <section key={field.key} className="section card">
            <h2>{field.label}</h2>
            <MarkdownBlock content={field.value} />
          </section>
        ))}
      </>
    );
  }

  const entry = getEntry(section, params.slug, lang);
  if (!entry) {
    notFound();
  }

  return (
    <>
      <h1 className="page-title">{entry.title}</h1>
      <p className="page-subtitle">{labels[lang].sections[section]}</p>
      <div className="card">
        <MarkdownBlock content={entry.body} />
      </div>
    </>
  );
}

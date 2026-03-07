import { notFound } from "next/navigation";
import { SectionList } from "@/components/SectionList";
import { getCollectionEntries } from "@/lib/content";
import { isLanguage, Language, SECTION_KEYS, SectionKey } from "@/lib/i18n";

function isSection(section: string): section is SectionKey {
  return SECTION_KEYS.includes(section as SectionKey);
}

export default async function SectionIndex({
  params
}: {
  params: { lang: string; section: string };
}) {
  if (!isLanguage(params.lang) || !isSection(params.section)) {
    notFound();
  }

  const lang = params.lang as Language;
  const section = params.section as SectionKey;
  const entries = await getCollectionEntries(section, lang);

  return <SectionList lang={lang} section={section} entries={entries} />;
}

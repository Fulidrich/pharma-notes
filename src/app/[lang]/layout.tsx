import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Sidebar } from "@/components/Sidebar";
import { isLanguage, labels, LANGUAGES } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export default function LanguageLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLanguage(params.lang)) {
    notFound();
  }

  const lang = params.lang;

  return (
    <div className="app-shell">
      <Sidebar lang={lang} />
      <main className="main">
        <div className="toolbar">
          <LanguageSwitch lang={lang} />
          <Link href={`/${lang}/search`} className="search-link">
            {labels[lang].search}
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}

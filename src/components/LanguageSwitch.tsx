"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Language } from "@/lib/i18n";

export function LanguageSwitch({ lang }: { lang: Language }) {
  const pathname = usePathname();
  const suffix = pathname.replace(/^\/(en|zh)/, "") || "";
  const englishPath = `/en${suffix}`;
  const chinesePath = `/zh${suffix}`;

  return (
    <div className="lang-switch" aria-label="language switch">
      <Link href={englishPath} className={lang === "en" ? "active" : ""}>
        EN
      </Link>
      <Link href={chinesePath} className={lang === "zh" ? "active" : ""}>
        中文
      </Link>
    </div>
  );
}

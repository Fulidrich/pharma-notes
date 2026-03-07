"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { labels, isLanguage, Language } from "@/lib/i18n";

type SearchResult = {
  section: string;
  slug: string;
  title: string;
  snippet: string;
};

export default function SearchPage({ params }: { params: { lang: string } }) {
  const lang: Language = isLanguage(params.lang) ? params.lang : "en";
  const t = labels[lang];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const placeholder = useMemo(
    () => (lang === "en" ? "Search drugs, mechanisms, diseases..." : "搜索药物、机制、疾病..."),
    [lang]
  );

  async function onSearch(nextQuery: string) {
    setQuery(nextQuery);
    if (!nextQuery.trim()) {
      setResults([]);
      return;
    }

    const response = await fetch(
      `/api/search?lang=${lang}&q=${encodeURIComponent(nextQuery.trim())}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      setResults([]);
      return;
    }

    const json = (await response.json()) as { results: SearchResult[] };
    setResults(json.results);
  }

  return (
    <>
      <h1 className="page-title">{t.search}</h1>
      <p className="page-subtitle">{t.subtitle}</p>
      <input
        className="search-input"
        value={query}
        placeholder={placeholder}
        onChange={(event) => onSearch(event.target.value)}
      />

      <div style={{ marginTop: 16 }}>
        {results.map((item) => (
          <Link
            key={`${item.section}-${item.slug}`}
            className="card"
            href={`/${lang}/${item.section}/${item.slug}`}
          >
            <h3>{item.title}</h3>
            <p>{item.snippet}</p>
          </Link>
        ))}
        {query && results.length === 0 && <p className="meta">{t.noResults}</p>}
      </div>
    </>
  );
}

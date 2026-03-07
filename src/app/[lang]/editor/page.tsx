"use client";

import { useEffect, useMemo, useState } from "react";
import { isLanguage, labels, SECTION_KEYS, SectionKey } from "@/lib/i18n";

export default function EditorPage({ params }: { params: { lang: string } }) {
  const lang = isLanguage(params.lang) ? params.lang : "en";
  const t = labels[lang];

  const [section, setSection] = useState<SectionKey>("drugs");
  const [slugs, setSlugs] = useState<string[]>([]);
  const [existingSlug, setExistingSlug] = useState<string>("");
  const [newSlug, setNewSlug] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const ui = useMemo(
    () =>
      lang === "en"
        ? {
            title: "Content Editor",
            subtitle: "Create and edit markdown notes directly in the browser.",
            section: "Section",
            existing: "Existing files",
            newSlug: "New slug",
            load: "Load",
            template: "New from template",
            save: "Save",
            placeholder: "example: sertraline",
            help: "Slug format: lowercase letters, numbers, hyphens (e.g. sertraline).",
            deployNote:
              "Note: on Vercel production, file writing is read-only. Use this editor locally, or migrate save to a database."
          }
        : {
            title: "内容编辑器",
            subtitle: "直接在网页中创建和编辑 Markdown 笔记。",
            section: "栏目",
            existing: "已有文件",
            newSlug: "新 slug",
            load: "加载",
            template: "按模板新建",
            save: "保存",
            placeholder: "示例：sertraline",
            help: "slug 格式：小写字母、数字、短横线（如 sertraline）。",
            deployNote: "提示：Vercel 线上环境文件系统只读。请本地使用编辑器，或改为数据库存储。"
          },
    [lang]
  );

  async function fetchSlugs(nextSection: SectionKey) {
    const res = await fetch(`/api/editor?action=list&section=${nextSection}`, { cache: "no-store" });
    if (!res.ok) {
      setSlugs([]);
      setExistingSlug("");
      return;
    }
    const json = (await res.json()) as { slugs: string[] };
    setSlugs(json.slugs);
    setExistingSlug((prev) => (prev && json.slugs.includes(prev) ? prev : json.slugs[0] || ""));
  }

  useEffect(() => {
    void fetchSlugs(section);
  }, [section]);

  async function loadCurrentFile() {
    const slug = newSlug.trim() || existingSlug;
    if (!slug) {
      setStatus(lang === "en" ? "Please choose or enter a slug." : "请选择或输入 slug。");
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch(`/api/editor?action=file&section=${section}&slug=${encodeURIComponent(slug)}`, {
      cache: "no-store"
    });

    setLoading(false);

    if (!res.ok) {
      setStatus(lang === "en" ? "Failed to load file." : "加载文件失败。");
      return;
    }

    const json = (await res.json()) as { exists: boolean; content: string };
    setContent(json.content);
    setStatus(
      json.exists
        ? lang === "en"
          ? `Loaded ${slug}.md`
          : `已加载 ${slug}.md`
        : lang === "en"
          ? `${slug}.md does not exist yet. You can create it.`
          : `${slug}.md 不存在，你可以创建它。`
    );
  }

  async function createFromTemplate() {
    setLoading(true);
    setStatus("");

    const res = await fetch(`/api/editor?action=template&section=${section}`, { cache: "no-store" });

    setLoading(false);

    if (!res.ok) {
      setStatus(lang === "en" ? "Failed to get template." : "获取模板失败。");
      return;
    }

    const json = (await res.json()) as { content: string };
    setContent(json.content);
    setStatus(lang === "en" ? "Template loaded." : "模板已加载。");
  }

  async function saveFile() {
    const slug = newSlug.trim() || existingSlug;
    if (!slug) {
      setStatus(lang === "en" ? "Please choose or enter a slug before saving." : "保存前请先选择或输入 slug。");
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch("/api/editor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        section,
        slug,
        content
      })
    });

    setLoading(false);

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(err?.error || (lang === "en" ? "Save failed." : "保存失败。"));
      return;
    }

    setStatus(lang === "en" ? `Saved ${slug}.md` : `已保存 ${slug}.md`);
    setExistingSlug(slug);
    setNewSlug("");
    await fetchSlugs(section);
  }

  return (
    <>
      <h1 className="page-title">{ui.title}</h1>
      <p className="page-subtitle">{ui.subtitle}</p>

      <div className="card editor-grid">
        <label className="editor-label">
          {ui.section}
          <select className="editor-select" value={section} onChange={(e) => setSection(e.target.value as SectionKey)}>
            {SECTION_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.sections[key]}
              </option>
            ))}
          </select>
        </label>

        <label className="editor-label">
          {ui.existing}
          <select
            className="editor-select"
            value={existingSlug}
            onChange={(e) => setExistingSlug(e.target.value)}
            disabled={slugs.length === 0}
          >
            {slugs.length === 0 ? <option value="">(empty)</option> : null}
            {slugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        </label>

        <label className="editor-label">
          {ui.newSlug}
          <input
            className="editor-input"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder={ui.placeholder}
          />
        </label>

        <div className="editor-actions">
          <button className="editor-btn" onClick={loadCurrentFile} disabled={loading}>
            {ui.load}
          </button>
          <button className="editor-btn" onClick={createFromTemplate} disabled={loading}>
            {ui.template}
          </button>
          <button className="editor-btn primary" onClick={saveFile} disabled={loading}>
            {ui.save}
          </button>
        </div>
      </div>

      <p className="meta">{ui.help}</p>
      <p className="meta">{ui.deployNote}</p>

      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
      />

      {status ? <p className="meta">{status}</p> : null}
    </>
  );
}

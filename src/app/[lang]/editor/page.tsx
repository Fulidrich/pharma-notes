"use client";

import { useEffect, useMemo, useState } from "react";
import { isLanguage, labels, SECTION_KEYS, SectionKey } from "@/lib/i18n";

type SessionState = {
  configured: boolean;
  authenticated: boolean;
};

export default function EditorPage({ params }: { params: { lang: string } }) {
  const lang = isLanguage(params.lang) ? params.lang : "en";
  const t = labels[lang];

  const [session, setSession] = useState<SessionState | null>(null);
  const [password, setPassword] = useState("");
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
            title: "Admin Content Manager",
            subtitle: "Create, edit, and delete notes directly from the website.",
            section: "Section",
            existing: "Existing files",
            newSlug: "New slug",
            load: "Load",
            template: "New from template",
            save: "Save",
            remove: "Delete",
            login: "Admin Login",
            password: "Password",
            signIn: "Sign in",
            signOut: "Sign out",
            placeholder: "example: sertraline",
            help: "Slug format: lowercase letters, numbers, hyphens (e.g. sertraline).",
            unconfigured: "ADMIN_PASSWORD is not configured on server."
          }
        : {
            title: "后台内容管理",
            subtitle: "直接在网站中新增、编辑、删除笔记。",
            section: "栏目",
            existing: "已有文件",
            newSlug: "新 slug",
            load: "加载",
            template: "按模板新建",
            save: "保存",
            remove: "删除",
            login: "管理员登录",
            password: "密码",
            signIn: "登录",
            signOut: "退出",
            placeholder: "示例：sertraline",
            help: "slug 格式：小写字母、数字、短横线（如 sertraline）。",
            unconfigured: "服务器未配置 ADMIN_PASSWORD。"
          },
    [lang]
  );

  async function refreshSession() {
    const res = await fetch("/api/admin/session", { cache: "no-store" });
    if (!res.ok) {
      setSession({ configured: false, authenticated: false });
      return;
    }

    const json = (await res.json()) as SessionState;
    setSession(json);
  }

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
    void refreshSession();
  }, []);

  useEffect(() => {
    if (!session?.authenticated) {
      return;
    }

    void fetchSlugs(section);
  }, [section, session?.authenticated]);

  async function signIn() {
    setLoading(true);
    setStatus("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(err?.error || (lang === "en" ? "Login failed." : "登录失败。"));
      return;
    }

    setPassword("");
    await refreshSession();
    setStatus(lang === "en" ? "Signed in." : "已登录。");
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSession((prev) => ({ configured: prev?.configured ?? false, authenticated: false }));
    setStatus(lang === "en" ? "Signed out." : "已退出。" );
  }

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
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(err?.error || (lang === "en" ? "Failed to load file." : "加载文件失败。"));
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
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(err?.error || (lang === "en" ? "Failed to get template." : "获取模板失败。"));
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
      body: JSON.stringify({ section, slug, content })
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

  async function deleteFile() {
    const slug = newSlug.trim() || existingSlug;
    if (!slug) {
      setStatus(lang === "en" ? "Choose a slug before deleting." : "删除前请先选择 slug。" );
      return;
    }

    const confirmed = window.confirm(
      lang === "en" ? `Delete ${slug}.md? This cannot be undone.` : `确定删除 ${slug}.md 吗？此操作不可撤销。`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch("/api/editor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, slug })
    });

    setLoading(false);

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { error?: string } | null;
      setStatus(err?.error || (lang === "en" ? "Delete failed." : "删除失败。"));
      return;
    }

    setStatus(lang === "en" ? `Deleted ${slug}.md` : `已删除 ${slug}.md`);
    setContent("");
    setNewSlug("");
    await fetchSlugs(section);
  }

  if (!session) {
    return (
      <>
        <h1 className="page-title">{ui.title}</h1>
        <p className="page-subtitle">Loading session...</p>
      </>
    );
  }

  if (!session.authenticated) {
    return (
      <>
        <h1 className="page-title">{ui.login}</h1>
        <p className="page-subtitle">{ui.subtitle}</p>
        {!session.configured ? <p className="meta">{ui.unconfigured}</p> : null}

        <div className="card editor-grid" style={{ maxWidth: 420 }}>
          <label className="editor-label">
            {ui.password}
            <input
              className="editor-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void signIn();
                }
              }}
            />
          </label>
          <div className="editor-actions">
            <button className="editor-btn primary" onClick={signIn} disabled={loading || !session.configured}>
              {ui.signIn}
            </button>
          </div>
        </div>
        {status ? <p className="meta">{status}</p> : null}
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">{ui.title}</h1>
      <p className="page-subtitle">{ui.subtitle}</p>

      <div className="editor-actions" style={{ marginBottom: 12 }}>
        <button className="editor-btn" onClick={signOut}>
          {ui.signOut}
        </button>
      </div>

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
          <button className="editor-btn danger" onClick={deleteFile} disabled={loading}>
            {ui.remove}
          </button>
        </div>
      </div>

      <p className="meta">{ui.help}</p>

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

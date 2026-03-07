# Personal Pharmacology Knowledge Base

A bilingual (`/en`, `/zh`) Next.js web app for personal pharmacology study notes.

## Run

```bash
npm install
npm run dev
```

For LAN access:

```bash
npm run dev:lan
```

## URL Structure

- `/{lang}` dashboard (`lang` = `en` or `zh`)
- `/{lang}/drug-classes`
- `/{lang}/drugs`
- `/{lang}/mechanisms`
- `/{lang}/diseases`
- `/{lang}/personal-notes`
- `/{lang}/study-notes`
- `/{lang}/search`

Example:

- `/en/drugs/fluoxetine`
- `/zh/drugs/fluoxetine`

## Content Editing

All content is Markdown frontmatter files in `src/content/*`.

- `src/content/drugs/*.md` uses a fixed template with bilingual fields (`*_en`, `*_zh`).
- Other sections use:
  - `title_en`, `title_zh`
  - `summary_en`, `summary_zh`
  - `body_en`, `body_zh`

To add a new page, create a new `.md` file in the corresponding section folder.

You can also edit in browser:

- `/en/editor`
- `/zh/editor`

Editor supports:

- selecting section and loading existing file
- creating a new file from built-in template
- saving directly into content storage
- deleting existing entries

Admin protection:

- Set `ADMIN_PASSWORD` for login protection.
- Open `/en/editor` or `/zh/editor`, sign in with that password.

Important for deployment:

- For cloud editing, configure Supabase storage (recommended).
- Without Supabase in production, write/delete APIs are blocked.

### Supabase Storage Setup

Add env vars in your hosting platform:

- `ADMIN_PASSWORD=your-strong-password`
- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`

Create table in Supabase SQL editor:

```sql
create table if not exists public.notes (
  section text not null,
  slug text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (section, slug)
);
```

## Deploy (Vercel)

1. Push this project to GitHub.
2. In Vercel dashboard, click **Add New Project** and import this repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default).
5. Deploy.

## Drug Template Fields

Each drug file supports:

- Drug Name (`title_en`, `title_zh`)
- Drug Class (`drug_class_en`, `drug_class_zh`)
- Mechanism of Action (`mechanism_en`, `mechanism_zh`)
- Pharmacokinetics (`pharmacokinetics_en`, `pharmacokinetics_zh`)
- Indications (`indications_en`, `indications_zh`)
- Side Effects (`side_effects_en`, `side_effects_zh`)
- Contraindications (`contraindications_en`, `contraindications_zh`)
- Drug Interactions (`drug_interactions_en`, `drug_interactions_zh`)
- Exam Notes (`exam_notes_en`, `exam_notes_zh`)
- Personal Notes (`personal_notes_en`, `personal_notes_zh`)

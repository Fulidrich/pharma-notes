import { markdownToHtml } from "@/lib/markdown";

export async function MarkdownBlock({ content }: { content: string }) {
  const html = await markdownToHtml(content || "");
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

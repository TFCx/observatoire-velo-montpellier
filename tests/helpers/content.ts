import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTENT_DIRECTORY = fileURLToPath(new URL('../../content', import.meta.url));
export const VOIES_CYCLABLES_DIRECTORY = path.join(CONTENT_DIRECTORY, 'voies-cyclables');
export const BLOG_DIRECTORY = path.join(CONTENT_DIRECTORY, 'blog');

export type MarkdownFile = {
  fileName: string;
  content: string;
};

export function readMarkdownFiles(directory: string): MarkdownFile[] {
  return fs
    .readdirSync(directory)
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => ({ fileName, content: fs.readFileSync(path.join(directory, fileName), 'utf8') }));
}

export function readFrontmatterValue(markdownContent: string, key: string): string | undefined {
  const valueMatch = markdownContent.match(new RegExp(`^${key}: *"?([^"\\n]+)"?$`, 'm'));
  return valueMatch?.[1].trim();
}

export function readMarkdownTitles(markdownContent: string): string[] {
  return [...markdownContent.matchAll(/^#+\s+(.*)$/gm)].map(titleMatch => titleMatch[1]);
}

// Reproduit la génération des ancres de titres par Nuxt Content : ponctuation et symboles (⇄, ', ...)
// retirés, accents conservés, espaces et tirets consécutifs fusionnés. Règle vérifiée sur les pages rendues.
export function convertTitleToAnchor(title: string): string {
  return title
    .replace(/<\/?[^>]+(>|$)/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

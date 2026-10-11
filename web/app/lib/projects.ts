// Build-time loader for ../projects/ (content lives outside web/ so it can change without touching the site).
// Layout: projects/<person>/profile/profile.md and projects/<person>/<project>/project.md (+ media/).
// Runs only during `next build` / `next dev`; nothing here ships to the browser.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Project as HomeProject } from "../components/ProjectEntry";

export const PROJECTS_DIR = process.env.PROJECTS_DIR || path.resolve(process.cwd(), "..", "projects");

/** Splits a Markdown file into its YAML front matter and body. */
export function readFrontMatter(file: string): { data: Record<string, unknown>; body: string } {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  return { data: (yaml.load(m[1]) as Record<string, unknown>) || {}, body: m[2] };
}

/**
 * Media paths in project.md are relative to the project folder. scripts/copy-project-media.mjs copies
 * projects/<person>/<folder>/media/ to public/media/<person>/<folder>/media/, which is served at /media/...
 */
export function mediaUrl(person: string, folder: string, rel?: string | null): string | null {
  if (!rel) return null;
  if (/^https?:\/\//.test(rel)) return rel;
  const clean = rel.replace(/^\.\//, "");
  return fs.existsSync(path.join(PROJECTS_DIR, person, folder, clean)) ? `/media/${person}/${folder}/${clean}` : null;
}

const isDir = (p: string) => fs.existsSync(p) && fs.statSync(p).isDirectory();

/** The text of one "## Heading" section, with Markdown formatting removed. */
function section(body: string, heading: string): string {
  const m = body.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "mi"));
  if (!m) return "";
  return m[1]
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> their text
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italics
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\s+/g, " ")
    .trim();
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Aug 2025 – Apr 2026" -> 2025*12+7 (the start month), for newest-first sorting. Unknown -> -1. */
function startMonth(period?: string): number {
  const m = period?.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/);
  if (!m) return -1;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  return Number(m[2]) * 12 + (month < 0 ? 0 : month);
}

/** Display name for a person folder: the name in their profile.md, else the folder name capitalized. */
function personName(person: string): string {
  const file = path.join(PROJECTS_DIR, person, "profile", "profile.md");
  if (fs.existsSync(file)) {
    const name = readFrontMatter(file).data.name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return person.charAt(0).toUpperCase() + person.slice(1);
}

/** True when the site has pages for this person (e.g. web/app/jake/ -> /jake/). */
const hasPersonPages = (person: string) => isDir(path.join(process.cwd(), "app", person));

/** Every published project from every person, newest first (by the start of `period`), for the home page. */
export function getHomeProjects(): HomeProject[] {
  if (!isDir(PROJECTS_DIR)) return [];
  const items: { p: HomeProject; start: number; order: number }[] = [];
  const people = fs.readdirSync(PROJECTS_DIR).filter((d) => isDir(path.join(PROJECTS_DIR, d)));

  // Names in a project's `team` link to that person's pages when they have a folder here (matched by profile name).
  const personLinks = new Map<string, string>();
  for (const person of people) {
    if (hasPersonPages(person)) personLinks.set(personName(person).toLowerCase(), `/${person}/`);
  }

  for (const person of people) {
    const personDir = path.join(PROJECTS_DIR, person);
    const pages = hasPersonPages(person);
    const ownerName = personName(person);

    for (const folder of fs.readdirSync(personDir)) {
      const file = path.join(personDir, folder, "project.md");
      if (!fs.existsSync(file)) continue;
      const { data, body } = readFrontMatter(file);
      if (data.published === false) continue;

      const slug = (data.slug as string) || folder;
      const shortTitle = (data.short_title as string) || (data.title as string) || folder;
      const cover = mediaUrl(person, folder, data.cover as string | undefined);
      const links = (data.links as { label: string; url: string }[] | undefined) || [];
      const live = data.status === "live" ? links.find((l) => l.url.startsWith("/")) : undefined;

      // Contributors: the folder's owner first, then everyone else in the project's `team` field.
      const team = Array.isArray(data.team) ? (data.team as unknown[]).map(String) : [];
      const names = [ownerName, ...team.filter((n) => n.trim().toLowerCase() !== ownerName.toLowerCase())];
      const contributors = names.map((name) => ({ name, href: personLinks.get(name.trim().toLowerCase()) }));

      items.push({
        start: startMonth(data.period as string | undefined),
        order: typeof data.order === "number" ? data.order : 99,
        p: {
          title: shortTitle.toUpperCase(),
          description: section(body, "Overview") || ((data.summary as string) ?? ""),
          contributors,
          image: cover ? { src: cover, alt: `${shortTitle} screenshot` } : undefined,
          link: live
            ? { href: live.url, label: `Try ${shortTitle}` }
            : pages
              ? { href: `/${person}/${slug}/`, label: "View project" }
              : undefined,
        },
      });
    }
  }

  return items.sort((a, b) => b.start - a.start || a.order - b.order).map((i) => i.p);
}

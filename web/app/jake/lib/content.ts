// Build-time loader for jake_projects/ (content lives outside web/ so it can change without touching the site).
// Runs only on the server during `next build`; nothing here ships to the browser.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { marked } from "marked";

const ROOT = process.env.JAKE_PROJECTS_DIR || path.resolve(process.cwd(), "..", "jake_projects");

export type Link = { label: string; url: string };
export type Metric = { value: string; label: string };
export type GalleryItem = { src: string; alt: string; caption?: string };

export interface Project {
  slug: string;
  title: string;
  short_title?: string;
  order: number;
  featured?: boolean;
  status: "live" | "complete" | "in-progress";
  published: boolean;
  period?: string;
  context?: string;
  role?: string;
  team?: string[];
  summary?: string;
  highlights?: string[];
  metrics?: Metric[];
  tech?: string[];
  links?: Link[];
  cover?: string | null;
  gallery?: GalleryItem[];
  youtube?: { id: string; title: string }[];
  documents?: (Link & { pages?: number })[];
  html: string;
}

export interface Profile {
  name: string;
  headline?: string;
  headshot?: string | null;
  location?: string;
  links?: Link[];
  education?: { degree: string; school: string; period?: string; gpa?: string }[];
  coursework?: string[];
  certifications?: { name: string; status?: string }[];
  skills?: Record<string, string[]>;
  activities?: { role: string; org: string; period?: string; detail?: string }[];
  html: string;
}

function read(file: string): { data: Record<string, unknown>; html: string } {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  return { data: (yaml.load(m[1]) as Record<string, unknown>) || {}, html: marked.parse(m[2], { async: false }) as string };
}

/** Media paths in project.md are relative to the project folder; copy-jake-media puts them under /jake/<folder>/. */
function mediaUrl(folder: string, rel?: string | null): string | null {
  if (!rel) return null;
  if (/^https?:\/\//.test(rel)) return rel;
  const file = path.join(ROOT, folder, rel);
  return fs.existsSync(file) ? `/jake/${folder}/${rel.replace(/^\.\//, "")}` : null;
}

export function getProjects(): Project[] {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT)
    .filter((d) => fs.existsSync(path.join(ROOT, d, "project.md")))
    .map((d) => {
      const { data, html } = read(path.join(ROOT, d, "project.md"));
      const p = { ...data, slug: (data.slug as string) || d, html } as Project;
      p.cover = mediaUrl(d, p.cover);
      p.gallery = (p.gallery || [])
        .map((g) => ({ ...g, src: mediaUrl(d, g.src) }))
        .filter((g): g is GalleryItem => !!g.src);
      return p;
    })
    .filter((p) => p.published !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getProfile(): Profile | null {
  const file = path.join(ROOT, "profile", "profile.md");
  if (!fs.existsSync(file)) return null;
  const { data, html } = read(file);
  const p = { ...data, html } as Profile;
  p.headshot = mediaUrl("profile", p.headshot);
  return p;
}

export const isExternal = (url: string) => /^(https?:|mailto:)/.test(url);

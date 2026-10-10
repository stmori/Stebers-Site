import Link from "next/link";
import type { Project } from "@/lib/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}/`}
      className="grid gap-2 rounded-2xl border border-rule bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex flex-wrap gap-1.5">
        {[project.event, ...project.tags].filter(Boolean).map((t) => (
          <span key={t} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            {t}
          </span>
        ))}
      </div>
      <h2 className="text-lg font-semibold">{project.title}</h2>
      <p className="text-muted">{project.summary}</p>
    </Link>
  );
}

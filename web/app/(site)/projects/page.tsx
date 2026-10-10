import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export const metadata: Metadata = { title: "Projects", description: "Projects by Jake and Evanton." };

export default function ProjectsPage() {
  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Projects</h1>
        <p className="text-lg text-muted">What we&apos;ve built. Each one has its own page.</p>
      </header>
      <section aria-label="Project list" className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </section>
    </div>
  );
}

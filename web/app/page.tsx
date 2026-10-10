import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/lib/projects";

export default function HomePage() {
  const featured = projects.filter((p) => p.featured);
  return (
    <SiteFrame>
      <div className="grid gap-8">
        <header className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Jake &amp; Evanton</h1>
          {/* TODO: one or two sentences about who you are */}
          <p className="max-w-[60ch] text-lg text-muted">Research, projects and things we&apos;ve built together.</p>
        </header>
        <section aria-label="Featured projects" className="grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
          <Link href="/projects/" className="grid content-center gap-1 rounded-2xl border border-rule bg-surface p-5 hover:border-accent">
            <span className="text-lg font-semibold">All projects →</span>
            <span className="text-muted">Everything we&apos;ve worked on.</span>
          </Link>
        </section>
      </div>
    </SiteFrame>
  );
}

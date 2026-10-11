import { Arimo } from "next/font/google";
import ProjectEntry from "./components/ProjectEntry";
import { getHomeProjects } from "./lib/projects";

const arimo = Arimo({ subsets: ["latin"] });

export default function HomePage() {
  // One section per project in ../projects/<person>/<project>/, newest first. Generated at build time.
  const projects = getHomeProjects();
  return (
    <div
      className={`${arimo.className} min-h-screen bg-[#f5f5f2] text-[#1a1a1a] antialiased [background-image:radial-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),radial-gradient(ellipse_at_top_left,#fdfdfb_0%,#f5f5f2_55%,#efefeb_100%)] [background-size:22px_22px,100%_100%]`}
    >
      {/* Top bar */}
      <header className="mb-6 flex items-center justify-between border-b-2 border-[#d4d4d4] px-10 py-5">
        <span className="font-semibold tracking-tight text-[#141414]">jwes.design</span>
        <a href="#contributors" className="text-[#4a4a4a] transition-colors duration-200 hover:text-[#141414]">
          Contributors
        </a>
      </header>

      {/* Main */}
      <main className="space-y-6 px-8 pb-24">
        {projects.map((project, i) => (
          <ProjectEntry key={project.title} {...project} contributorsId={i === 0 ? "contributors" : undefined} />
        ))}
      </main>
    </div>
  );
}

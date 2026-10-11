import { Arimo } from "next/font/google";
import ProjectEntry, { type Project } from "./components/ProjectEntry";

const arimo = Arimo({ subsets: ["latin"] });

// One entry per project, shown top to bottom. To add a project, add an object here.
const projects: Project[] = [
  {
    title: "MED VQA",
    description:
      "Users can upload medical imagery (such as X-rays, MRIs, or histology slides), and the system uses a Vision-Language Model (VLM) combined with a Vector Database to identify physical anomalies, retrieve relevant medical literature, and generate a cited diagnostic summary. To demonstrate cloud infrastructure and MLOps competency, the entire application will be decoupled into microservices and containerized using Docker.",
    contributors: [{ name: "Jake Weber", href: "/jake/" }, { name: "Evanton" }],
    image: { src: "/med-vqa-screenshot.png", alt: "Med-VQA chat interface" },
    link: { href: "/projects/med-vqa/", label: "Try Med-VQA" },
  },
];

export default function HomePage() {
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
      <main className="space-y-12 px-8 pb-24">
        {projects.map((project, i) => (
          <ProjectEntry key={project.title} {...project} contributorsId={i === 0 ? "contributors" : undefined} />
        ))}
      </main>
    </div>
  );
}

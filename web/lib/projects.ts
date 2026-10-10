// One entry per project. The home page shows the featured ones; /projects shows all.
// To add a project: add an entry here and a page at app/projects/<slug>/page.tsx.

export interface Project {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  event?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: "med-vqa",
    title: "Med-VQA",
    summary:
      "Multimodal RAG for medical images: a vision model reads the image, retrieval finds NIH sources, and the answer cites them.",
    tags: ["Next.js", "FastAPI", "ChromaDB", "Docker"],
    event: "Knight Hacks 2026",
    featured: true,
  },
];

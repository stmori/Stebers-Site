import { Arimo } from "next/font/google";

const arimo = Arimo({ subsets: ["latin"] });

export default function HomePage() {
  return (
    <div className={`${arimo.className} min-h-screen bg-[#f5f5f2] text-[#1a1a1a]`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-6">
        <span>jwes.design</span>
        <span>Contributors</span>
      </header>

      {/* Main */}
      <main className="px-8">
        <h1 className="text-6xl font-bold">MED VQA</h1>
        <p className="mt-4 max-w-2xl pl-6 text-base">
          Users can upload medical imagery (such as X-rays, MRIs, or histology slides), and the system uses a Vision-Language Model
          (VLM) combined with a Vector Database to identify physical anomalies, retrieve relevant medical literature, and generate a
          cited diagnostic summary. To demonstrate cloud infrastructure and MLOps competency, the entire application will be decoupled
          into microservices and containerized using Docker.
        </p>
        <p className="mt-6 pl-6">Contributors:</p>
      </main>
    </div>
  );
}

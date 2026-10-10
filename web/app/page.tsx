import { Arimo } from "next/font/google";

const arimo = Arimo({ subsets: ["latin"] });

export default function HomePage() {
  return (
    <div className={`${arimo.className} min-h-screen bg-[#f5f5f2] text-[#1a1a1a]`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-10 py-6">
        <span>jwes.design</span>
        <span>Contributors</span>
      </header>

      {/* Main */}
      <main className="px-8 pb-[30vw]">
        <h1 className="text-6xl font-bold">MED VQA</h1>

        {/* Description, with the screenshot behind its lower-right part */}
        <div className="relative mt-4">
          <p className="relative z-10 w-[65%] pl-6 text-base leading-relaxed">
            Users can upload medical imagery (such as X-rays, MRIs, or histology slides), and the system uses a Vision-Language Model
            (VLM) combined with a Vector Database to identify physical anomalies, retrieve relevant medical literature, and generate a
            cited diagnostic summary. To demonstrate cloud infrastructure and MLOps competency, the entire application will be
            decoupled into microservices and containerized using Docker.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/med-vqa-screenshot.png"
            alt="Med-VQA chat interface"
            className="pointer-events-none absolute right-0 top-[38%] z-0 w-[48%] select-none rounded-md opacity-40 shadow-2xl shadow-black/25 ring-1 ring-black/10 [mask-image:linear-gradient(to_right,rgba(0,0,0,0.45),black_20%)]"
          />
        </div>

        <p className="relative z-10 mt-6 pl-6">Contributors:</p>
      </main>
    </div>
  );
}

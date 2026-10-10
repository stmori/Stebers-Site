import { Arimo } from "next/font/google";

const arimo = Arimo({ subsets: ["latin"] });

export default function HomePage() {
  return (
    <div
      className={`${arimo.className} min-h-screen bg-[#f5f5f2] bg-[radial-gradient(ellipse_at_top_left,#fdfdfb_0%,#f5f5f2_55%,#efefeb_100%)] text-[#1a1a1a] antialiased`}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-10 py-6">
        <span className="font-semibold tracking-tight text-[#141414]">jwes.design</span>
        <span className="text-[#4a4a4a] transition-colors hover:text-[#141414]">Contributors</span>
      </header>

      {/* Main */}
      <main className="px-8 pb-[30vw]">
        <h1 className="text-6xl font-bold tracking-tight text-[#121212] [text-shadow:0_1px_0_rgba(255,255,255,0.8),0_6px_18px_rgba(0,0,0,0.08)]">
          MED VQA
        </h1>

        {/* Description, with the screenshot behind its lower-right part */}
        <div className="relative mt-4">
          <p className="relative z-10 w-[65%] pl-6 text-base leading-relaxed text-[#2e2e2e]">
            Users can upload medical imagery (such as X-rays, MRIs, or histology slides), and the system uses a Vision-Language Model
            (VLM) combined with a Vector Database to identify physical anomalies, retrieve relevant medical literature, and generate a
            cited diagnostic summary. To demonstrate cloud infrastructure and MLOps competency, the entire application will be
            decoupled into microservices and containerized using Docker.
          </p>

          {/* The shadow sits on the wrapper: the image's own fade mask would otherwise clip it away */}
          <div className="pointer-events-none absolute right-0 top-[38%] z-0 w-[48%] rounded-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.22),0_12px_24px_-12px_rgba(0,0,0,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/med-vqa-screenshot.png"
              alt="Med-VQA chat interface"
              className="block w-full select-none rounded-md opacity-40 ring-1 ring-black/10 [mask-image:linear-gradient(to_right,rgba(0,0,0,0.45),black_20%)]"
            />
          </div>
        </div>

        <p className="relative z-10 mt-6 pl-6 font-semibold tracking-wide text-[#3a3a3a]">Contributors:</p>
      </main>
    </div>
  );
}

import { Arimo } from "next/font/google";

const arimo = Arimo({ subsets: ["latin"] });

export default function HomePage() {
  return (
    <div
      className={`${arimo.className} min-h-screen bg-[#f5f5f2] text-[#1a1a1a] antialiased [background-image:radial-gradient(rgba(0,0,0,0.045)_1px,transparent_1px),radial-gradient(ellipse_at_top_left,#fdfdfb_0%,#f5f5f2_55%,#efefeb_100%)] [background-size:22px_22px,100%_100%]`}
    >
      {/* Top bar */}
      <header className="mb-6 flex items-center justify-between border-b-2 border-[#d4d4d4] px-10 py-5">
        <span className="font-semibold tracking-tight text-[#141414]">jwes.design</span>
        <a href="#contributors" className="text-[#4a4a4a] transition-colors duration-200 hover:text-[#141414]">Contributors</a>
      </header>

      {/* Main */}
      <main className="px-8 pb-[30vw]">
        <h1 className="bg-[linear-gradient(to_bottom,#111111,#3d3d3d)] bg-clip-text text-6xl font-bold tracking-tight text-transparent [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.10))]">
          MED VQA
        </h1>

        {/* Description, with the screenshot behind its lower-right part */}
        <div className="relative mt-4">
          <p className="relative z-10 w-[65%] border-l-2 border-[#1a1a1a]/15 pl-6 text-base leading-relaxed text-[#2e2e2e]">
            Users can upload medical imagery (such as X-rays, MRIs, or histology slides), and the system uses a Vision-Language Model
            (VLM) combined with a Vector Database to identify physical anomalies, retrieve relevant medical literature, and generate a
            cited diagnostic summary. To demonstrate cloud infrastructure and MLOps competency, the entire application will be
            decoupled into microservices and containerized using Docker.
          </p>

          {/* Wrapper carries the shadow and a slight 3D tilt; the image keeps your opacity and fade */}
          <div className="pointer-events-none absolute right-4 top-[39%] z-0 w-[50%] rounded-lg shadow-[0_40px_80px_-30px_rgba(0,0,0,0.30),0_18px_36px_-18px_rgba(0,0,0,0.18)] [transform:perspective(1800px)_rotateY(-6deg)_rotateX(2deg)] [transform-origin:right_center]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/med-vqa-screenshot.png"
              alt="Med-VQA chat interface"
              className="block w-full select-none rounded-lg opacity-48 ring-1 ring-black/10 [mask-image:linear-gradient(to_right,rgba(0,0,0,0.45),black_17%)]"
            />
          </div>
        </div>

        <a
          href="/projects/med-vqa/"
          className="relative z-10 ml-6 mt-6 inline-flex items-center gap-2 rounded-md border border-[#1a1a1a]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#141414] shadow-sm transition-colors duration-200 hover:border-[#1a1a1a]/50"
        >
          Try Med-VQA <span aria-hidden>→</span>
        </a>

        <p id="contributors" className="relative z-10 mt-8 pl-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6a6a]">Contributors:</p>
        <ul className="relative z-10 mt-3 flex flex-wrap gap-x-6 gap-y-1 pl-6 text-sm text-[#2e2e2e]">
          <li>
            <a href="/jake/" className="underline-offset-4 transition-colors duration-200 hover:text-[#141414] hover:underline">
              Jake Weber
            </a>
          </li>
          <li>Evanton</li>
        </ul>
      </main>
    </div>
  );
}

export interface Project {
  title: string;
  description: string;
  contributors: string[];
  /** Optional screenshot shown faded behind the lower-right of the description. File goes in web/public/. */
  image?: { src: string; alt: string };
}

export default function ProjectEntry({ title, description, contributors, image }: Project) {
  return (
    // Bottom padding scales with the screenshot's height so the border always sits below it
    <article
      className={`border-b-2 border-[#d4d4d4] ${image ? "pb-[max(1.5rem,calc(24.5%-7.75rem))]" : "pb-10"}`}
    >
      <h1 className="bg-[linear-gradient(to_bottom,#111111,#3d3d3d)] bg-clip-text text-6xl font-bold tracking-tight text-transparent [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.10))]">
        {title}
      </h1>

      {/* Description, with the screenshot behind its lower-right part */}
      <div className="relative mt-4">
        <p className="relative z-10 w-[65%] border-l-2 border-[#1a1a1a]/15 pl-6 text-base leading-relaxed text-[#2e2e2e]">
          {description}
        </p>

        {image && (
          // Wrapper carries the shadow and a slight 3D tilt; the image keeps the opacity and fade
          <div className="pointer-events-none absolute right-4 top-[39%] z-0 w-[50%] rounded-lg shadow-[0_40px_80px_-30px_rgba(0,0,0,0.30),0_18px_36px_-18px_rgba(0,0,0,0.18)] [transform:perspective(1800px)_rotateY(-6deg)_rotateX(2deg)] [transform-origin:right_center]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="block w-full select-none rounded-lg opacity-48 ring-1 ring-black/10 [mask-image:linear-gradient(to_right,rgba(0,0,0,0.45),black_17%)]"
            />
          </div>
        )}
      </div>

      <div className="relative z-10 mt-8 pl-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6a6a]">Contributors:</p>
        <ul className="mt-2 space-y-0.5 text-base text-[#2e2e2e]">
          {contributors.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

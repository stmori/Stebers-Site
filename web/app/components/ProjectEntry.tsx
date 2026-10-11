export interface Contributor {
  name: string;
  /** Optional link, e.g. a portfolio page */
  href?: string;
}

export interface Project {
  title: string;
  description: string;
  contributors: Contributor[];
  /** Optional image shown under the title on the right, with the description wrapping beside it (the home page uses the project's `cover`). */
  image?: { src: string; alt: string };
  /** Optional button under the description, e.g. to open the project */
  link?: { href: string; label: string };
}

interface Props extends Project {
  /** id for the contributors block, so the top bar's "Contributors" link can jump to it */
  contributorsId?: string;
}

export default function ProjectEntry({ title, description, contributors, image, link, contributorsId }: Props) {
  return (
    // flow-root keeps the floated image inside the entry, so the bottom border always sits below it
    <article className="flow-root border-b-2 border-[#d4d4d4] pb-6">
      <h1 className="bg-[linear-gradient(to_bottom,#111111,#3d3d3d)] bg-clip-text text-6xl font-bold tracking-tight text-transparent [filter:drop-shadow(0_6px_14px_rgba(0,0,0,0.10))]">
        {title}
      </h1>

      {image && (
        // Floated right under the title: the description wraps to its left and continues below it if it's longer.
        // Wrapper carries the shadow and a slight 3D tilt. Images keep their own shape, but anything taller than
        // about 7:4 (e.g. a portrait photo) is capped at that height and cropped from the top. 58cqw = 58% of the wrapper's width.
        <div className="@container pointer-events-none float-right mb-6 ml-8 mr-20 mt-4 w-[51%] rounded-md shadow-[0_40px_80px_-30px_rgba(0,0,0,0.30),0_18px_36px_-18px_rgba(0,0,0,0.18)] [transform:perspective(1800px)_rotateY(-4deg)_rotateX(1deg)] [transform-origin:right_center]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="block max-h-[58cqw] w-full select-none rounded-md object-cover object-top ring-1 ring-black/10"
          />
        </div>
      )}

      <p className="mt-4 border-l-2 border-[#1a1a1a]/15 pl-6 text-base leading-relaxed text-[#2e2e2e]">{description}</p>

      {/* Directly under the description */}
      {link && (
        <a
          href={link.href}
          className="ml-6 mt-3 inline-flex items-center gap-2 rounded-md border border-[#1a1a1a]/20 bg-white/70 px-4 py-2 text-sm font-medium text-[#141414] shadow-sm transition-colors duration-200 hover:border-[#1a1a1a]/50"
        >
          {link.label} <span aria-hidden>→</span>
        </a>
      )}

      <div id={contributorsId} className="mt-6 pl-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a6a6a]">Contributors:</p>
        <ul className="mt-2 space-y-0.5 text-base text-[#2e2e2e]">
          {contributors.map((c) => (
            <li key={c.name}>
              {c.href ? (
                <a href={c.href} className="underline-offset-4 transition-colors duration-200 hover:text-[#141414] hover:underline">
                  {c.name}
                </a>
              ) : (
                c.name
              )}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

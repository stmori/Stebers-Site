import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, getProjects, type GalleryItem } from "../lib/content";
import { Chips, ExtLink, StatusBadge, TopBar, buttonClass } from "../ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.short_title || p.title, description: p.summary } : {};
}

function Figure({ g }: { g: GalleryItem }) {
  return (
    <figure className="grid gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={g.src} alt={g.alt} loading="lazy" className="w-full rounded-xl border border-rule" />
      {g.caption && <figcaption className="text-sm text-muted">{g.caption}</figcaption>}
    </figure>
  );
}

function Video({ v }: { v: { id: string; title: string } }) {
  return (
    <div className="aspect-video overflow-hidden rounded-xl border border-rule bg-raised">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${v.id}`}
        title={v.title}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full"
      />
    </div>
  );
}

export default async function ProjectPage({ params }: Props) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const solo = p.team?.length === 1;
  const meta = [p.period, p.context].filter(Boolean).join(" · ");
  const actions = [...(p.links || []), ...(p.documents || []).map((d) => ({ label: d.pages ? `${d.label} · ${d.pages} pp.` : d.label, url: d.url }))];
  // Media leads the page: videos and gallery images sit right under the headline. A gallery item with
  // `position: bottom` (e.g. the FSI team photo) goes at the end instead. A cover that isn't in the gallery
  // is shown first among the images.
  const gallery = p.gallery || [];
  const inGallery = gallery.some((g) => g.src === p.cover);
  const topImages = [
    ...(p.cover && !inGallery ? [{ src: p.cover, alt: "" } as GalleryItem] : []),
    ...gallery.filter((g) => g.position !== "bottom"),
  ];
  const bottomImages = gallery.filter((g) => g.position === "bottom");

  return (
    <>
      <TopBar back={{ href: "/jake/#projects", label: "All projects" }} />
      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-10 sm:px-6 [&>*]:min-w-0">
        <header className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={p.status} />
            {meta && <p className="text-sm text-muted">{meta}</p>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.title}</h1>
          {p.summary && <p className="max-w-3xl text-lg text-muted">{p.summary}</p>}
          <p className="text-sm text-muted">
            {p.role && <span className="font-medium text-ink">{p.role}</span>}
            {!solo && !!p.team?.length && <span> · Team: {p.team.join(", ")}</span>}
          </p>
          {!!actions.length && (
            <div className="flex flex-wrap gap-2">
              {actions.map((l) => (
                <ExtLink key={l.url + l.label} link={l} className={buttonClass} />
              ))}
            </div>
          )}
        </header>

        {(!!p.youtube?.length || !!topImages.length) && (
          <section aria-label="Media" className="grid gap-6">
            {(p.youtube || []).map((v) => (
              <Video key={v.id} v={v} />
            ))}
            {topImages.map((g) => (
              <Figure key={g.src} g={g} />
            ))}
          </section>
        )}

        {!!p.metrics?.length && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-rule bg-surface p-4">
                <dt className="sr-only">{m.label}</dt>
                <dd className="text-2xl font-semibold text-accent">{m.value}</dd>
                <dd className="mt-1 text-xs text-muted">{m.label}</dd>
              </div>
            ))}
          </dl>
        )}

        {!!p.highlights?.length && (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">Highlights</h2>
            <ul className="grid gap-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.html && <article className="jake-prose" dangerouslySetInnerHTML={{ __html: p.html }} />}

        {!!bottomImages.length && (
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">Gallery</h2>
            {bottomImages.map((g) => (
              <Figure key={g.src} g={g} />
            ))}
          </section>
        )}

        {!!p.tech?.length && (
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold">Tech</h2>
            <Chips items={p.tech} />
          </section>
        )}
      </main>
    </>
  );
}

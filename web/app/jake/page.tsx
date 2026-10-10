import type { Metadata } from "next";
import { getProfile, getProjects, type Project } from "./lib/content";
import { Chips, ExtLink, StatusBadge, TopBar, buttonClass } from "./ui";

export const metadata: Metadata = {
  title: "Jake Weber",
  description: "Jake Weber: computer vision M.S. student at UCF. Medical imaging, 3D vision and robotics projects.",
};

function ProjectCard({ p }: { p: Project }) {
  return (
    <a
      href={`/jake/${p.slug}/`}
      className="group grid overflow-hidden rounded-xl border border-rule bg-surface transition-colors hover:border-accent"
    >
      <div className="aspect-[16/9] overflow-hidden bg-raised">
        {p.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          // No image yet: show the headline number instead of an empty frame.
          <div className="flex h-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-accent-soft to-raised p-4 text-center">
            <span className="text-4xl font-bold text-accent">{p.metrics?.[0]?.value || (p.short_title || p.title)[0]}</span>
            {p.metrics?.[0] && <span className="text-sm text-muted">{p.metrics[0].label}</span>}
          </div>
        )}
      </div>
      <div className="grid content-start gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold group-hover:text-accent">{p.short_title || p.title}</h3>
          <StatusBadge status={p.status} />
        </div>
        {p.period && <p className="text-xs text-muted">{p.period}</p>}
        {p.summary && <p className="line-clamp-3 text-sm text-muted">{p.summary}</p>}
        {p.metrics?.[0] && p.cover && (
          <p className="text-sm">
            <span className="font-semibold text-accent">{p.metrics[0].value}</span> <span className="text-muted">{p.metrics[0].label}</span>
          </p>
        )}
      </div>
    </a>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-6 gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function JakePage() {
  const profile = getProfile();
  const projects = getProjects();
  const name = profile?.name || "Jake Weber";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  return (
    <>
      <TopBar />
      <main className="mx-auto grid max-w-5xl gap-14 px-4 py-10 sm:px-6 [&>*]:min-w-0">
        {/* Intro */}
        <section className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          {profile?.headshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.headshot} alt={name} className="h-28 w-28 rounded-full object-cover ring-1 ring-rule" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent-soft text-3xl font-semibold text-accent" aria-hidden>
              {initials}
            </div>
          )}
          <div className="grid gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
              {profile?.headline && <p className="mt-1 text-muted">{profile.headline}</p>}
              {profile?.location && <p className="text-sm text-muted">{profile.location}</p>}
            </div>
            {!!profile?.links?.length && (
              <div className="flex flex-wrap gap-2">
                {profile.links.map((l) => (
                  <ExtLink key={l.url} link={l} className={buttonClass} />
                ))}
              </div>
            )}
            {profile?.html && <div className="jake-prose max-w-3xl" dangerouslySetInnerHTML={{ __html: profile.html }} />}
          </div>
        </section>

        <Section title="Projects" id="projects">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.slug} p={p} />
            ))}
          </div>
        </Section>

        {!!profile?.education?.length && (
          <Section title="Education">
            <ul className="grid gap-3">
              {profile.education.map((e) => (
                <li key={e.degree} className="flex flex-wrap items-baseline justify-between gap-x-4 rounded-xl border border-rule bg-surface p-4">
                  <div>
                    <p className="font-medium">{e.degree}</p>
                    <p className="text-sm text-muted">{e.school}</p>
                  </div>
                  <p className="text-sm text-muted">
                    {e.period}
                    {e.gpa && ` · GPA ${e.gpa}`}
                  </p>
                </li>
              ))}
            </ul>
            {!!profile.coursework?.length && (
              <div className="grid gap-2">
                <p className="text-sm font-medium text-muted">Relevant coursework</p>
                <Chips items={profile.coursework} />
              </div>
            )}
          </Section>
        )}

        {profile?.skills && (
          <Section title="Skills">
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.entries(profile.skills).map(([group, items]) => (
                <div key={group} className="grid content-start gap-2 rounded-xl border border-rule bg-surface p-4">
                  <dt className="text-sm font-medium">{group}</dt>
                  <dd>
                    <Chips items={items} />
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {(!!profile?.certifications?.length || !!profile?.activities?.length) && (
          <div className="grid gap-14 sm:grid-cols-2 sm:gap-8">
            {!!profile?.certifications?.length && (
              <Section title="Certifications">
                <ul className="grid gap-2 text-sm">
                  {profile.certifications.map((c) => (
                    <li key={c.name}>
                      <span className="font-medium">{c.name}</span>
                      {c.status && <span className="text-muted"> · {c.status}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {!!profile?.activities?.length && (
              <Section title="Leadership">
                <ul className="grid gap-3 text-sm">
                  {profile.activities.map((a) => (
                    <li key={a.org}>
                      <p>
                        <span className="font-medium">{a.role}</span>, {a.org}
                        {a.period && <span className="text-muted"> · {a.period}</span>}
                      </p>
                      {a.detail && <p className="text-muted">{a.detail}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </main>
    </>
  );
}

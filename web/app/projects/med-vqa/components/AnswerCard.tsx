import type { AskResponse, Citation, NucleiAnalysis, SimilarCase } from "../lib/types";

/**
 * Result of the optional nuclei tool: overlay + stats. When the tool didn't run (not histology, no nuclei, model
 * missing) there's nothing to show here: the API already ends the answer with a "Nuclei analysis: ..." line.
 */
function NucleiPanel({ n }: { n: NucleiAnalysis }) {
  if (n.status !== "ok") return null;
  const stats: [string, string][] = [
    ["Nuclei", String(n.count ?? "–")],
    ["Cellularity", `${n.density ?? "–"} (${n.coverage_pct ?? "–"}% of area)`],
    ["Size variation", `${n.size_variability ?? "–"} (CV ${n.area_cv ?? "–"})`],
  ];
  return (
    <section aria-label="Nuclei analysis" className="grid gap-2 rounded-lg border border-rule bg-surface p-3 text-sm">
      <h3 className="font-semibold">Nuclei analysis</h3>
      {n.overlay && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={n.overlay} alt={`Detected nuclei outlined in color (${n.count} found)`} className="max-h-80 w-full rounded-md object-contain" />
      )}
      <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
        {stats.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted">{n.tool}. Measurements are relative (not calibrated to microns).</p>
    </section>
  );
}

/** Real past chest X-ray reports similar to this image's findings (Open-I, Indiana University). */
function SimilarCases({ cases }: { cases: SimilarCase[] }) {
  return (
    <details className="rounded-lg border border-rule bg-surface px-3 py-2 text-sm">
      <summary className="cursor-pointer select-none font-medium text-ink">Similar past cases ({cases.length})</summary>
      <ul className="mt-2 grid gap-2">
        {cases.map((c) => (
          <li key={c.uid} className="grid gap-0.5">
            <span className="font-medium">{c.impression || "No impression recorded"}</span>
            {c.problems && <span className="text-xs text-muted">{c.problems.replace(/;/g, " · ")}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Indiana University chest X-ray reports via Open-I (NLM). Shown for comparison only.</p>
    </details>
  );
}

/** Turns "text [1] more [2]" into text with links to each source. No HTML injection: everything is a React node. */
function withCitations(paragraph: string, byN: Map<number, Citation>, keyPrefix: string) {
  const parts = paragraph.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    const c = m ? byN.get(Number(m[1])) : undefined;
    if (!c) return <span key={`${keyPrefix}-${i}`}>{part}</span>;
    return (
      <a
        key={`${keyPrefix}-${i}`}
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${c.title} (${c.source})`}
        className="mx-0.5 inline-flex -translate-y-0.5 items-center rounded bg-accent-soft px-1 text-xs font-semibold text-accent no-underline hover:underline"
      >
        {c.n}
      </a>
    );
  });
}

export default function AnswerCard({ data }: { data: AskResponse }) {
  const byN = new Map(data.citations.map((c) => [c.n, c]));
  const paragraphs = data.answer.split(/\n\s*\n/).filter((p) => p.trim());
  const anyCited = data.citations.some((c) => c.cited);
  const f = data.findings;
  const t = data.timings_ms;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{withCitations(p, byN, `p${i}`)}</p>
        ))}
      </div>

      {data.analysis?.nuclei && <NucleiPanel n={data.analysis.nuclei} />}

      {f?.is_medical_image && (
        <details className="group rounded-lg border border-rule bg-surface px-3 py-2 text-sm">
          <summary className="cursor-pointer select-none font-medium text-ink">What the model saw</summary>
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted">Modality</dt>
            <dd>{f.modality || "Unknown"}</dd>
            <dt className="text-muted">Region</dt>
            <dd>{f.body_region || "Unknown"}</dd>
            <dt className="text-muted">Observations</dt>
            <dd>
              {f.observations?.length ? (
                <ul className="list-disc pl-4">
                  {f.observations.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              ) : (
                "None reported"
              )}
            </dd>
          </dl>
        </details>
      )}

      {data.similar_cases && data.similar_cases.length > 0 && <SimilarCases cases={data.similar_cases} />}

      {data.citations.length > 0 && (
        <section aria-label="Sources" className="grid gap-2">
          <h3 className="text-sm font-semibold">{anyCited ? "Sources" : "Related NIH sources"}</h3>
          <ol className="grid gap-2">
            {data.citations.map((c) => {
              const dim = anyCited && !c.cited;
              return (
                <li key={c.n} className={`flex gap-2 text-sm ${dim ? "opacity-60" : ""}`}>
                  <span className="mt-0.5 grid h-5 min-w-5 place-items-center rounded bg-accent-soft px-1 text-xs font-semibold text-accent">
                    {c.n}
                  </span>
                  <div className="min-w-0">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
                      {c.title}
                    </a>
                    <span className="text-muted"> · {c.source}{dim ? " · not cited" : ""}</span>
                    <p className="line-clamp-2 text-xs text-muted">{c.snippet}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className="text-xs text-muted">
        {data.model}
        {t && ` · image ${(t.vision / 1000).toFixed(1)} s`}
        {t?.nuclei ? ` · nuclei ${(t.nuclei / 1000).toFixed(1)} s` : ""}
        {t && ` · search ${(t.retrieval / 1000).toFixed(2)} s · answer ${(t.answer / 1000).toFixed(1)} s`}
        {data.cached && " · instant (repeat question)"}
        {data.disclaimer && <> · {data.disclaimer}</>}
      </p>
    </div>
  );
}

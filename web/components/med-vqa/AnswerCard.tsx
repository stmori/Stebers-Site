import type { AskResponse, Citation } from "@/lib/med-vqa/types";

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
        {t && ` · image ${(t.vision / 1000).toFixed(1)} s · search ${(t.retrieval / 1000).toFixed(2)} s · answer ${(t.answer / 1000).toFixed(1)} s`}
        {data.disclaimer && <> · {data.disclaimer}</>}
      </p>
    </div>
  );
}

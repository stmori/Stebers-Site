"use client";

import { useEffect, useState } from "react";

// The API doesn't stream progress, so steps advance on a timer that roughly matches real timings
// (vision ~3 s, retrieval <0.1 s, answer ~3 s). The last step waits until the response arrives.
const STEPS = [
  { label: "Reading the image", after: 0 },
  { label: "Searching NIH sources", after: 3500 },
  { label: "Writing a cited answer", after: 4500 },
];

export default function LoadingSteps({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const elapsed = now - startedAt;
  const current = STEPS.reduce((idx, s, i) => (elapsed >= s.after ? i : idx), 0);

  return (
    <div role="status" aria-live="polite" className="grid gap-2">
      <ol className="grid gap-1.5 text-sm">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className={`flex items-center gap-2 ${done || active ? "text-ink" : "text-muted/70"}`}>
              <span
                aria-hidden="true"
                className={[
                  "grid h-5 w-5 place-items-center rounded-full border text-[11px]",
                  done ? "border-accent bg-accent text-accent-ink" : active ? "border-accent text-accent" : "border-rule",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span>{s.label}</span>
              {active && (
                <span aria-hidden="true" className="ml-1 inline-flex gap-0.5 text-accent">
                  <span className="dot">•</span>
                  <span className="dot">•</span>
                  <span className="dot">•</span>
                </span>
              )}
              <span className="sr-only">{done ? "done" : active ? "in progress" : "waiting"}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">{(elapsed / 1000).toFixed(0)} s elapsed. This usually takes 5 to 10 seconds.</p>
    </div>
  );
}

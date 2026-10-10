import type { Link as LinkT, Project } from "./lib/content";
import { isExternal } from "./lib/content";

export function ExtLink({ link, className }: { link: LinkT; className?: string }) {
  const ext = isExternal(link.url);
  return (
    <a href={link.url} className={className} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
      {ext && !link.url.startsWith("mailto:") && <span aria-hidden> ↗</span>}
    </a>
  );
}

export const buttonClass =
  "inline-flex items-center rounded-lg border border-rule bg-surface px-3 py-1.5 text-sm hover:border-accent hover:text-accent";

export function StatusBadge({ status }: { status: Project["status"] }) {
  if (status === "complete") return null;
  const live = status === "live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        live ? "bg-accent-soft text-accent" : "bg-warn-bg text-warn-ink"
      }`}
    >
      {live && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
      {live ? "Live" : "In progress"}
    </span>
  );
}

export function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-md bg-raised px-2 py-0.5 text-xs text-muted">
          {t}
        </li>
      ))}
    </ul>
  );
}

export function TopBar({ back }: { back?: { href: string; label: string } }) {
  return (
    <header className="border-b border-rule">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 text-sm sm:px-6">
        <a href="/" className="font-semibold">
          Home
        </a>
        <span className="text-rule" aria-hidden>
          /
        </span>
        <a href="/jake/" className="text-muted hover:text-ink">
          Jake Weber
        </a>
        {back && (
          <a href={back.href} className="ml-auto text-muted hover:text-ink">
            ← {back.label}
          </a>
        )}
      </nav>
    </header>
  );
}

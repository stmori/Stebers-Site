"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [{ href: "/projects/", label: "Projects" }];

export default function SiteNav() {
  const path = usePathname() || "/";
  return (
    <nav aria-label="Main" className="border-b border-rule bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="mr-auto font-bold" aria-current={path === "/" ? "page" : undefined}>
          Steber&apos;s Site
        </Link>
        {LINKS.map((l) => {
          const active = path.startsWith(l.href.replace(/\/$/, ""));
          return (
            <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
              className={`font-medium hover:text-accent ${active ? "text-accent" : ""}`}>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

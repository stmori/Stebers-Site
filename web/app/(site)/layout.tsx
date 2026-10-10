import SiteNav from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-8 sm:px-6">{children}</main>
      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted sm:px-6">© 2026 Jake &amp; Evanton</div>
      </footer>
    </div>
  );
}

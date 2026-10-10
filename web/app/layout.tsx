import type { Metadata, Viewport } from "next";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Steber's Site", template: "%s · Steber's Site" },
  description: "Jake and Evanton: research, projects and Med-VQA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f161c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-8 sm:px-6">{children}</main>
        <footer className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted sm:px-6">© 2026 Jake &amp; Evanton</div>
        </footer>
      </body>
    </html>
  );
}

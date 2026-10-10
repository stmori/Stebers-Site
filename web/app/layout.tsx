import type { Metadata, Viewport } from "next";
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

// Root layout only sets up <html>/<body>. Pages pick a frame through route groups (folders in parentheses, not part of the URL):
//   app/(site)/        normal pages with the nav bar and footer
//   app/(fullscreen)/  full-height apps like the Med-VQA chat
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}

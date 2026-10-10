import type { Metadata } from "next";

// page.tsx is a client component, so the tab title and description are set here.
export const metadata: Metadata = {
  title: "Med-VQA",
  description: "Ask a question about a medical image and get an answer that cites NIH sources. Educational demo.",
};

export default function MedVqaLayout({ children }: { children: React.ReactNode }) {
  return children;
}

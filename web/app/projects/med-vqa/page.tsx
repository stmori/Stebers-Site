import type { Metadata } from "next";
import MedVqa from "@/components/med-vqa/MedVqa";

export const metadata: Metadata = {
  title: "Med-VQA",
  description: "Ask a question about a medical image and get an answer that cites NIH sources. Educational demo.",
};

export default function MedVqaPage() {
  return <MedVqa />;
}

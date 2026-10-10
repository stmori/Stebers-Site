// Mirrors the API contract in services/med-vqa-api/README.md (POST /api/ask).

export interface Findings {
  is_medical_image: boolean;
  modality: string;
  body_region: string;
  observations: string[];
  short_answer: string;
  search_terms?: string[];
}

export interface Citation {
  n: number;
  title: string;
  url: string;
  source: string;
  snippet: string;
  score: number;
  cited: boolean;
}

export interface AskResponse {
  findings: Findings;
  answer: string;
  citations: Citation[];
  disclaimer: string;
  model: string;
  timings_ms: { vision: number; retrieval: number; answer: number; nuclei?: number };
  similar_cases?: SimilarCase[];
  cached?: boolean;
  /** Results of optional specialist tools; present only when requested. */
  analysis?: { nuclei?: NucleiAnalysis };
}

/** Nuclei segmentation (Jake's LoRA-fine-tuned MobileSAM). Only meaningful for H&E histology images. */
export interface NucleiAnalysis {
  status: "ok" | "not_applicable" | "no_nuclei" | "unavailable";
  tool: string;
  message: string;
  count?: number;
  coverage_pct?: number;
  mean_area_px?: number;
  area_cv?: number;
  size_variability?: string;
  density?: string;
  /** JPEG data URI of the image with each detected nucleus colored. */
  overlay?: string;
}

/** A past chest X-ray report similar to this image's findings (Open-I, text only). */
export interface SimilarCase {
  uid: number;
  problems: string;
  impression: string;
  findings: string;
  score: number;
}

/** An earlier question and answer about the same image, sent with follow-ups. */
export interface HistoryTurn {
  question: string;
  answer: string;
}

export interface Example {
  file: string;
  label: string;
  question: string;
  source: string;
}

export type ChatMessage =
  // imageUrl is null when the question reuses the image from an earlier message.
  | { id: string; role: "user"; question: string; imageUrl: string | null; imageName: string }
  | { id: string; role: "assistant"; status: "loading"; startedAt: number }
  | { id: string; role: "assistant"; status: "done"; data: AskResponse }
  | { id: string; role: "assistant"; status: "error"; error: string };

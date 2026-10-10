// Mirrors the API contract in services/med-vqa-api/README.md (POST /api/ask).

export interface Findings {
  is_medical_image: boolean;
  modality: string;
  body_region: string;
  observations: string[];
  short_answer: string;
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
  timings_ms: { vision: number; retrieval: number; answer: number };
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

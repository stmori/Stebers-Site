import type { AskResponse, HistoryTurn } from "./types";

// In Docker, Caddy routes /api/med-vqa/* to the med-vqa-api container (rewritten to its /api/*).
// For `next dev` against a locally running API, set NEXT_PUBLIC_MEDVQA_API=http://localhost:8000/api.
const API = (process.env.NEXT_PUBLIC_MEDVQA_API || "/api/med-vqa").replace(/\/$/, "");
const MOCK = process.env.NEXT_PUBLIC_MOCK === "1";

/** Where the example images live under web/public. */
export const EXAMPLES_DIR = "/projects/med-vqa";

export const MAX_IMAGE_MB = 8;
export const MAX_QUESTION_CHARS = 500;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export class AskError extends Error {}

/** Client-side checks that match the API's limits, so users get instant feedback. */
export function validate(file: File | null, question: string): string | null {
  if (!file) return "Choose an image first.";
  if (!ACCEPTED_TYPES.includes(file.type)) return "Upload a PNG, JPEG or WebP image.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image is larger than ${MAX_IMAGE_MB} MB.`;
  const q = question.trim();
  if (q.length < 3) return "Type a question first.";
  if (q.length > MAX_QUESTION_CHARS) return `Keep the question under ${MAX_QUESTION_CHARS} characters.`;
  return null;
}

export async function ask(
  image: File,
  question: string,
  signal?: AbortSignal,
  history: HistoryTurn[] = [],
): Promise<AskResponse> {
  if (MOCK) return mockAsk(question, signal);

  const body = new FormData();
  body.append("image", image);
  body.append("question", question.trim());
  if (history.length) body.append("history", JSON.stringify(history));

  let res: Response;
  try {
    res = await fetch(`${API}/ask`, { method: "POST", body, signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new AskError("Couldn't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AskError((data && data.error) || `Request failed (${res.status}).`);
  }
  if (!data || typeof data.answer !== "string") {
    throw new AskError("The server sent an unexpected response.");
  }
  return data as AskResponse;
}

// ---- mock mode: lets the UI be built and demoed without the API or a GPU ----

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

async function mockAsk(question: string, signal?: AbortSignal): Promise<AskResponse> {
  await sleep(4200, signal);
  return {
    findings: {
      is_medical_image: true,
      modality: "Chest X-ray (PA)",
      body_region: "Chest",
      observations: [
        "Hazy opacity in the right lower lung zone",
        "Heart size within normal limits",
        "No visible pneumothorax",
      ],
      short_answer: "Possible right lower lobe consolidation.",
    },
    answer:
      `(Mock answer to: "${question.trim()}")\n\n` +
      "The image shows a hazy area in the lower right lung, which can be a sign of pneumonia, where the air sacs fill with fluid [1]. " +
      "Other causes of a similar appearance include fluid around the lung or a partially collapsed lung segment [2].\n\n" +
      "A doctor would compare this with symptoms such as fever and cough, and may order follow-up imaging [1].",
    citations: [
      {
        n: 1, title: "Pneumonia", url: "https://medlineplus.gov/pneumonia.html", source: "MedlinePlus",
        snippet: "Pneumonia is an infection in one or both of the lungs. Many germs, such as bacteria, viruses, and fungi, can cause pneumonia...",
        score: 0.81, cited: true,
      },
      {
        n: 2, title: "Pleural Disorders", url: "https://medlineplus.gov/pleuraldisorders.html", source: "MedlinePlus",
        snippet: "Your pleura is a large, thin sheet of tissue that wraps around the outside of your lungs and lines the inside of your chest cavity...",
        score: 0.74, cited: true,
      },
      {
        n: 3, title: "Atelectasis", url: "https://www.nhlbi.nih.gov/health/atelectasis", source: "NHLBI",
        snippet: "Atelectasis is a condition in which one or more areas of your lungs collapse or do not inflate properly...",
        score: 0.69, cited: false,
      },
    ],
    disclaimer: "Educational demo only. Not medical advice or a diagnosis.",
    model: "mock",
    timings_ms: { vision: 1900, retrieval: 40, answer: 2200 },
  };
}

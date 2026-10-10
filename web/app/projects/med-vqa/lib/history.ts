import type { ChatMessage, HistoryTurn } from "./types";

/**
 * Earlier question/answer pairs about the image currently in use, oldest first.
 * The conversation restarts whenever a message attaches a new image, so only turns since then count.
 * Sent to the API with follow-ups so it knows what "that" or "here" refers to.
 */
export function priorTurns(messages: ChatMessage[], max = 3): HistoryTurn[] {
  let start = 0;
  messages.forEach((m, i) => {
    if (m.role === "user" && m.imageUrl) start = i;
  });
  const turns: HistoryTurn[] = [];
  for (let i = start; i < messages.length - 1; i++) {
    const q = messages[i];
    const a = messages[i + 1];
    if (q.role === "user" && a.role === "assistant" && a.status === "done") {
      turns.push({ question: q.question, answer: a.data.answer });
    }
  }
  return turns.slice(-max);
}

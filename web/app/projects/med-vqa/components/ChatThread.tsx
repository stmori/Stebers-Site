"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../lib/types";
import AnswerCard from "./AnswerCard";
import LoadingSteps from "./LoadingSteps";

interface Props {
  messages: ChatMessage[];
  onRetry: () => void;
}

export default function ChatThread({ messages, onRetry }: Props) {
  const end = useRef<HTMLLIElement>(null);

  // Keep the newest message in view, including when a loading message turns into an answer.
  const last = messages[messages.length - 1];
  const lastKey = last ? `${last.id}:${last.role === "assistant" ? last.status : ""}` : "";
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lastKey]);

  return (
    <ol className="grid gap-6" aria-label="Conversation">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <li key={m.id} className="flex flex-col items-end gap-2">
              {m.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imageUrl}
                  alt={`Uploaded image: ${m.imageName}`}
                  className="max-h-64 max-w-[70%] rounded-xl border border-rule object-contain"
                />
              )}
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-raised px-4 py-2.5">{m.question}</p>
            </li>
          );
        }
        return (
          <li key={m.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent"
            >
              AI
            </span>
            <div className="min-w-0 flex-1">
              {m.status === "loading" && <LoadingSteps startedAt={m.startedAt} />}
              {m.status === "done" && <AnswerCard data={m.data} />}
              {m.status === "error" && (
                <div role="alert" className="grid gap-2">
                  <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err">{m.error}</p>
                  {m.id === last?.id && (
                    <button type="button" onClick={onRetry} className="justify-self-start text-sm font-medium text-accent hover:underline">
                      Try again
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
      <li ref={end} aria-hidden="true" />
    </ol>
  );
}

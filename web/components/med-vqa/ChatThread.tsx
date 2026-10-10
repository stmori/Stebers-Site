"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/med-vqa/types";
import AnswerCard from "./AnswerCard";
import LoadingSteps from "./LoadingSteps";

interface Props {
  messages: ChatMessage[];
  onRetry: () => void;
}

export default function ChatThread({ messages, onRetry }: Props) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className="grid gap-4" aria-live="polite">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div key={m.id} className="flex justify-end">
              <div className="flex max-w-[85%] items-start gap-3 rounded-2xl rounded-br-sm bg-accent px-4 py-3 text-accent-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imageUrl} alt={`Attached: ${m.imageName}`} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                <p className="whitespace-pre-wrap">{m.question}</p>
              </div>
            </div>
          );
        }
        return (
          <div key={m.id} className="flex justify-start">
            <div className="w-full max-w-[95%] rounded-2xl rounded-bl-sm border border-rule bg-surface px-4 py-3">
              {m.status === "loading" && <LoadingSteps startedAt={m.startedAt} />}
              {m.status === "done" && <AnswerCard data={m.data} />}
              {m.status === "error" && (
                <div role="alert" className="grid gap-2">
                  <p className="rounded-md bg-err-bg px-3 py-2 text-sm text-err">{m.error}</p>
                  {m.id === lastId && (
                    <button type="button" onClick={onRetry} className="justify-self-start text-sm font-medium text-accent hover:underline">
                      Try again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}

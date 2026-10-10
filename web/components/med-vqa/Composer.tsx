"use client";

import { MAX_QUESTION_CHARS } from "@/lib/med-vqa/api";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  hasImage: boolean;
  hint: string | null;
}

export default function Composer({ value, onChange, onSubmit, busy, hasImage, hint }: Props) {
  const remaining = MAX_QUESTION_CHARS - value.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid gap-2"
    >
      <label htmlFor="question" className="sr-only">
        Your question about the image
      </label>
      <div className="flex items-end gap-2 rounded-xl border border-rule bg-surface p-2 focus-within:border-accent">
        <textarea
          id="question"
          rows={2}
          maxLength={MAX_QUESTION_CHARS}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={hasImage ? "Ask about this image, e.g. What abnormality is visible?" : "Add an image, then ask a question"}
          className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-1.5 outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-10 shrink-0 rounded-lg bg-accent px-4 font-semibold text-accent-ink transition-opacity disabled:cursor-progress disabled:opacity-50"
        >
          {busy ? "Working…" : "Ask"}
        </button>
      </div>
      <div className="flex justify-between gap-2 px-1 text-xs">
        <span className={hint ? "text-err" : "text-muted"} role={hint ? "alert" : undefined}>
          {hint ?? "Enter to send · Shift+Enter for a new line"}
        </span>
        <span className={remaining < 50 ? "text-warn-ink" : "text-muted"}>{remaining}</span>
      </div>
    </form>
  );
}

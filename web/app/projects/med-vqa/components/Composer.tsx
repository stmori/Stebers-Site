"use client";

import { useEffect, useRef } from "react";
import { ACCEPTED_TYPES, MAX_QUESTION_CHARS } from "../lib/api";

export interface Attachment {
  url: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  /** Image attached for the next message. */
  attachment: Attachment | null;
  /** Image from an earlier message that a follow-up question will reuse when nothing new is attached. */
  carried: Attachment | null;
  onFiles: (files: File[]) => void;
  onRemove: () => void;
  hint: string | null;
}

/**
 * The chat entry box: attachments in the top-left, the text field in the middle,
 * attach button bottom-left and send button bottom-right.
 */
export default function Composer({ value, onChange, onSubmit, busy, attachment, carried, onFiles, onRemove, hint }: Props) {
  const text = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  // Grow with the text up to ~8 lines, then scroll.
  useEffect(() => {
    const el = text.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Focus the box once an image is attached so the user can type straight away.
  useEffect(() => {
    if (attachment) text.current?.focus();
  }, [attachment]);

  const shown = attachment ?? carried;
  const canSend = !busy && value.trim().length > 0 && !!shown;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-rule bg-surface shadow-lg shadow-black/30 focus-within:border-accent/70"
    >
      {/* Attachments: top-left of the box */}
      {shown && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          <div
            className={`group relative flex items-center gap-2 rounded-xl border border-rule bg-raised p-1.5 pr-3 ${attachment ? "" : "opacity-70"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="grid max-w-44 text-xs leading-tight">
              <span className="truncate font-medium text-ink" title={shown.name}>
                {shown.name}
              </span>
              <span className="text-muted">{attachment ? "Attached" : "Using image from earlier"}</span>
            </div>
            {attachment && (
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                aria-label={`Remove ${shown.name}`}
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-rule bg-bg text-xs text-muted hover:text-ink"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <label htmlFor="question" className="sr-only">
        Your question about the image
      </label>
      <textarea
        ref={text}
        id="question"
        rows={1}
        maxLength={MAX_QUESTION_CHARS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a new line.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files);
          if (files.length) {
            e.preventDefault();
            onFiles(files);
          }
        }}
        placeholder={shown ? "Ask about this image…" : "Attach or drop a medical image, then ask a question…"}
        className="block w-full resize-none bg-transparent px-4 pb-1 pt-3 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
      />

      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={busy}
            aria-label="Attach an image"
            title="Attach an image"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink disabled:opacity-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className={`truncate text-xs ${hint ? "text-err" : "text-muted"}`} role={hint ? "alert" : undefined}>
            {hint ?? (value.length > MAX_QUESTION_CHARS - 50 ? `${MAX_QUESTION_CHARS - value.length} characters left` : "")}
          </span>
        </div>

        {/* Send: bottom-right of the box */}
        <button
          type="submit"
          disabled={!canSend}
          aria-label={busy ? "Waiting for the answer" : "Send"}
          title="Send (Enter)"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {busy ? (
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 19V5m0 0-6 6m6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <input
        ref={picker}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = ""; // allow picking the same file again
        }}
      />
    </form>
  );
}

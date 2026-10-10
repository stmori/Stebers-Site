"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatThread from "./components/ChatThread";
import Composer from "./components/Composer";
import { EXAMPLES } from "./examples";
import { ACCEPTED_TYPES, ask, AskError, validate } from "./lib/api";
import type { ChatMessage, Example } from "./lib/types";
import { useWindowFileDrop } from "./lib/useWindowFileDrop";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Img {
  file: File;
  url: string;
  name: string;
}

export default function MedVqaPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachment, setAttachment] = useState<Img | null>(null); // attached for the next message
  const [carried, setCarried] = useState<Img | null>(null); // last image sent; follow-ups reuse it
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const urls = useRef<string[]>([]); // object URLs stay alive while the chat shows them
  const abort = useRef<AbortController | null>(null);
  const lastAsk = useRef<{ img: Img; question: string } | null>(null);

  useEffect(() => {
    const created = urls.current;
    return () => {
      abort.current?.abort();
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const toImg = (file: File): Img => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    return { file, url, name: file.name || "image" };
  };

  /** Attach the first usable image from a drop, paste or file picker. The API takes one image per question. */
  const addFiles = useCallback((files: File[]) => {
    const image = files.find((f) => ACCEPTED_TYPES.includes(f.type));
    if (!image) {
      setHint("Only PNG, JPEG or WebP images can be attached.");
      return;
    }
    const err = validate(image, "ok?");
    if (err) {
      setHint(err);
      return;
    }
    setAttachment(toImg(image));
    setHint(files.length > 1 ? "One image per question, so only the first was attached." : null);
  }, []);

  const busyRef = useRef(busy);
  busyRef.current = busy;
  const dragging = useWindowFileDrop((files) => !busyRef.current && addFiles(files));

  const run = useCallback(async (img: Img, q: string, isNewImage: boolean, retry: boolean) => {
    const pendingId = uid();
    lastAsk.current = { img, question: q };
    setMessages((prev) => [
      // On retry, drop the failed answer and keep the existing question.
      ...(retry ? prev.slice(0, -1) : prev),
      ...(retry
        ? []
        : [{ id: uid(), role: "user" as const, question: q.trim(), imageUrl: isNewImage ? img.url : null, imageName: img.name }]),
      { id: pendingId, role: "assistant" as const, status: "loading" as const, startedAt: Date.now() },
    ]);
    setBusy(true);

    abort.current = new AbortController();
    try {
      const data = await ask(img.file, q, abort.current.signal);
      setMessages((prev) => prev.map<ChatMessage>((m) => (m.id === pendingId ? { id: pendingId, role: "assistant", status: "done", data } : m)));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const message = e instanceof AskError ? e.message : "Something went wrong. Try again.";
      setMessages((prev) =>
        prev.map<ChatMessage>((m) => (m.id === pendingId ? { id: pendingId, role: "assistant", status: "error", error: message } : m)),
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(() => {
    if (busy) return;
    const img = attachment ?? carried;
    const err = validate(img?.file ?? null, question);
    if (err) {
      setHint(err);
      return;
    }
    setHint(null);
    run(img!, question, !!attachment, false);
    setCarried(img);
    setAttachment(null);
    setQuestion("");
  }, [busy, attachment, carried, question, run]);

  const retry = useCallback(() => {
    const l = lastAsk.current;
    if (l && !busy) run(l.img, l.question, false, true);
  }, [busy, run]);

  const tryExample = useCallback(
    async (ex: Example) => {
      if (busy) return;
      try {
        const blob = await (await fetch(ex.src)).blob();
        const img = toImg(new File([blob], ex.file, { type: blob.type || "image/jpeg" }));
        setHint(null);
        run(img, ex.question, true, false);
        setCarried(img);
        setAttachment(null);
      } catch {
        setHint("Couldn't load that example.");
      }
    },
    [busy, run],
  );

  const reset = () => {
    abort.current?.abort();
    setBusy(false);
    setMessages([]);
    setAttachment(null);
    setCarried(null);
    setQuestion("");
    setHint(null);
  };

  return (
    <div className="theme-dark relative flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-rule px-4">
        <h1 className="font-semibold">Med-VQA</h1>
        <span className="hidden text-xs text-muted sm:inline">Educational demo · not medical advice</span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded-lg border border-rule px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-ink"
          >
            New chat
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="grid gap-8 pt-[8vh] text-center">
              <div className="grid gap-2">
                <h2 className="text-2xl font-semibold">Ask about a medical image</h2>
                <p className="text-muted">
                  Drop an X-ray, CT, MRI or histology image anywhere on the page, then ask a question. Answers cite NIH sources.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.file}
                    type="button"
                    onClick={() => tryExample(ex)}
                    className="grid gap-2 rounded-xl border border-rule bg-surface p-2 text-xs hover:border-accent"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ex.src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    <span className="line-clamp-2 text-muted">{ex.question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ChatThread messages={messages} onRetry={retry} />
          )}
        </div>
      </div>

      {/* Chat entry, at the bottom */}
      <div className="sticky bottom-0 bg-bg px-4 pb-4 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            value={question}
            onChange={setQuestion}
            onSubmit={submit}
            busy={busy}
            attachment={attachment}
            carried={attachment ? null : carried}
            onFiles={addFiles}
            onRemove={() => setAttachment(null)}
            hint={hint}
          />
          <p className="mt-2 text-center text-[11px] text-muted">
            Not medical advice or a diagnosis. Don&apos;t upload images with names or ID numbers. Images are sent to the AI model provider
            and not stored.
          </p>
        </div>
      </div>

      {/* Drop anywhere overlay */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-bg/85 p-6 backdrop-blur-sm">
          <div className="grid w-full max-w-xl place-items-center gap-2 rounded-3xl border-2 border-dashed border-accent px-6 py-16 text-center">
            <p className="text-lg font-semibold text-ink">Drop the image to attach it</p>
            <p className="text-sm text-muted">PNG, JPEG or WebP, up to 8 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

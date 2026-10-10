"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatThread from "@/components/med-vqa/ChatThread";
import Composer from "@/components/med-vqa/Composer";
import ImageDropzone from "@/components/med-vqa/ImageDropzone";
import { ask, AskError, EXAMPLES_DIR, validate } from "@/lib/med-vqa/api";
import examples from "@/lib/med-vqa/examples.json";
import type { ChatMessage, Example } from "@/lib/med-vqa/types";

const EXAMPLES = examples as Example[];
const uid = () => Math.random().toString(36).slice(2, 10);

export default function MedVqa() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const urls = useRef<string[]>([]); // object URLs stay alive while the chat shows them
  const abort = useRef<AbortController | null>(null);
  const lastAsk = useRef<{ file: File; question: string; imageUrl: string } | null>(null);

  useEffect(() => {
    const created = urls.current;
    return () => {
      abort.current?.abort();
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const chooseFile = useCallback((f: File) => {
    const err = validate(f, "xxx");
    if (err) {
      setHint(err);
      return;
    }
    const url = URL.createObjectURL(f);
    urls.current.push(url);
    setFile(f);
    setPreviewUrl(url);
    setHint(null);
  }, []);

  const run = useCallback(async (f: File, q: string, imageUrl: string, addUserMessage: boolean) => {
    const pendingId = uid();
    lastAsk.current = { file: f, question: q, imageUrl };
    setMessages((prev) => [
      // On retry, drop the failed answer and reuse the existing question bubble.
      ...(addUserMessage ? prev : prev.slice(0, -1)),
      ...(addUserMessage ? [{ id: uid(), role: "user" as const, question: q.trim(), imageUrl, imageName: f.name }] : []),
      { id: pendingId, role: "assistant" as const, status: "loading" as const, startedAt: Date.now() },
    ]);
    setBusy(true);

    abort.current = new AbortController();
    try {
      const data = await ask(f, q, abort.current.signal);
      setMessages((prev) => prev.map<ChatMessage>((m) => (m.id === pendingId ? { id: pendingId, role: "assistant", status: "done", data } : m)));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const message = e instanceof AskError ? e.message : "Something went wrong. Try again.";
      setMessages((prev) => prev.map<ChatMessage>((m) => (m.id === pendingId ? { id: pendingId, role: "assistant", status: "error", error: message } : m)));
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(() => {
    if (busy) return;
    const err = validate(file, question);
    if (err) {
      setHint(err);
      return;
    }
    setHint(null);
    run(file!, question, previewUrl!, true);
    setQuestion(""); // the image stays attached, so follow-up questions are about the same image
  }, [busy, file, question, previewUrl, run]);

  const retry = useCallback(() => {
    const l = lastAsk.current;
    if (l && !busy) run(l.file, l.question, l.imageUrl, false);
  }, [busy, run]);

  const tryExample = useCallback(
    async (ex: Example) => {
      if (busy) return;
      try {
        const res = await fetch(`${EXAMPLES_DIR}/${ex.file}`);
        const blob = await res.blob();
        const f = new File([blob], ex.file.split("/").pop() || "example.jpg", { type: blob.type || "image/jpeg" });
        const url = URL.createObjectURL(f);
        urls.current.push(url);
        setFile(f);
        setPreviewUrl(url);
        setHint(null);
        run(f, ex.question, url, true);
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
    setFile(null);
    setPreviewUrl(null);
    setQuestion("");
    setHint(null);
  };

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <a href="/projects/" className="text-sm text-muted hover:text-accent">
            ← Projects
          </a>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Med-VQA</h1>
          <p className="text-muted">Upload a medical image, ask a question, and get an answer that cites NIH sources.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="rounded-lg border border-rule px-3 py-1.5 text-sm font-medium hover:border-accent">
            New conversation
          </button>
        )}
      </header>

      <p className="rounded-lg bg-warn-bg px-4 py-2.5 text-sm text-warn-ink">
        Educational demo only. Not medical advice or a diagnosis. Don&apos;t upload images that show names or ID numbers.
      </p>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <aside className="grid gap-4 rounded-2xl border border-rule bg-surface p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold">Image</h2>
          <ImageDropzone
            previewUrl={previewUrl}
            fileName={file?.name ?? null}
            disabled={busy}
            onFile={chooseFile}
            onClear={() => {
              setFile(null);
              setPreviewUrl(null);
            }}
          />
          <div className="grid gap-2">
            <h2 className="text-sm font-semibold">Or try an example</h2>
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.file}
                  type="button"
                  disabled={busy}
                  onClick={() => tryExample(ex)}
                  title={ex.question}
                  className="group grid gap-1 rounded-lg border border-rule p-1.5 text-left text-xs font-medium hover:border-accent disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${EXAMPLES_DIR}/${ex.file}`} alt="" className="aspect-square w-full rounded-md object-cover" />
                  <span className="truncate">{ex.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section aria-label="Conversation" className="grid min-h-[28rem] grid-rows-[1fr_auto] gap-4 rounded-2xl border border-rule bg-surface/50 p-4">
          {messages.length === 0 ? (
            <div className="grid place-items-center text-center text-muted">
              <div className="max-w-sm space-y-2">
                <p className="font-medium text-ink">Ask about an image</p>
                <p className="text-sm">
                  Add an image on the left, then ask something like &ldquo;Is the heart enlarged?&rdquo; Each answer shows what the model
                  saw and links to the NIH pages it used.
                </p>
              </div>
            </div>
          ) : (
            <ChatThread messages={messages} onRetry={retry} />
          )}
          <Composer value={question} onChange={setQuestion} onSubmit={submit} busy={busy} hasImage={!!file} hint={hint} />
        </section>
      </div>

      <p className="text-xs text-muted">
        Answers are generated by an AI model and grounded in MedQuAD (NIH). Uploaded images are processed in memory and not stored, but
        they are sent to the AI model provider.
      </p>
    </div>
  );
}

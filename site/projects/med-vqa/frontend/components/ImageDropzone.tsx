"use client";

import { useRef, useState } from "react";
import { ACCEPTED_TYPES, MAX_IMAGE_MB } from "@/lib/api";

interface Props {
  previewUrl: string | null;
  fileName: string | null;
  disabled?: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

export default function ImageDropzone({ previewUrl, fileName, disabled, onFile, onClear }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const open = () => !disabled && input.current?.click();

  function take(files: FileList | null) {
    const f = files?.[0];
    if (f) onFile(f);
  }

  return (
    <div className="grid gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={previewUrl ? "Replace the image" : "Choose an image"}
        aria-disabled={disabled}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) take(e.dataTransfer.files);
        }}
        className={[
          "relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
          over ? "border-accent bg-accent-soft text-accent" : "border-rule text-muted hover:border-accent/60",
          disabled ? "cursor-progress opacity-60" : "",
        ].join(" ")}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="The image you uploaded" className="max-h-72 w-auto rounded-lg object-contain" />
        ) : (
          <>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="max-w-xs text-sm">
              <b className="text-ink">Drop an X-ray, CT, MRI or histology image</b>
              <br />
              or click to choose. PNG, JPEG or WebP, up to {MAX_IMAGE_MB} MB.
            </span>
          </>
        )}
      </div>

      {previewUrl && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span className="truncate" title={fileName ?? undefined}>{fileName}</span>
          <span className="flex shrink-0 gap-3">
            <button type="button" onClick={open} disabled={disabled} className="font-medium text-accent hover:underline disabled:opacity-50">
              Replace
            </button>
            <button type="button" onClick={onClear} disabled={disabled} className="font-medium text-accent hover:underline disabled:opacity-50">
              Remove
            </button>
          </span>
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = ""; // allow choosing the same file again
        }}
      />
    </div>
  );
}

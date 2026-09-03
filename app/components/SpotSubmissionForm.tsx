"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

// Ruled lines rather than boxed inputs — lighter than a stack of frosted rectangles.
const fieldClass = "mt-1.5 w-full border-0 border-b border-[#8c7ba8]/55 bg-transparent px-1 pb-2 pt-1 text-[15px] font-normal normal-case tracking-normal text-[#fff6e8] outline-none transition-colors placeholder:text-[#9d8db7]/55 focus:border-[#ffd166]";
const labelClass = "block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e3d2ec]";
const optionalClass = "normal-case tracking-normal text-[#8f80a9]";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="[font-family:var(--font-syne)] text-[26px] font-bold leading-none text-white/25">{index}</span>
      <span className="text-[26px] font-semibold leading-none text-[#fff6e8] [font-family:var(--font-caveat)]">{title}</span>
      <span className="h-px flex-1 translate-y-[-4px] bg-white/15" />
    </div>
  );
}

function Segmented({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mt-2 flex gap-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <label
            key={option.value}
            className={`pn-interactive flex-1 cursor-pointer rounded-full border px-2 py-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] ${
              active
                ? "border-[#ffd166] bg-[#ffd166] text-[#3a1440]"
                : "border-[#8c7ba8]/55 text-[#c9b8df] hover:border-[#ffd166]/70 hover:text-[#fff6e8]"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

export default function SpotSubmissionForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [bestFor, setBestFor] = useState("both");
  const [crowd, setCrowd] = useState("unknown");
  const [picture, setPicture] = useState<{ file: File; url: string } | null>(null);
  const [pictureError, setPictureError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef("");

  // The preview URL is owned by hand rather than by an effect, so a re-render never orphans one.
  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  function holdPicture(file: File | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : "";
    setPicture(file ? { file, url: previewUrl.current } : null);
  }

  function acceptFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setPictureError("That file type isn't supported — use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setPictureError(`That photo is ${formatSize(file.size)} — keep it under 8 MB.`);
      return;
    }
    setPictureError("");
    holdPicture(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInput.current) return;
    // Mirror the drop into the real input so it rides along in the FormData.
    fileInput.current.files = event.dataTransfer.files;
    acceptFile(file);
  }

  function clearPicture() {
    if (fileInput.current) fileInput.current.value = "";
    holdPicture(null);
    setPictureError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picture) {
      setPictureError("Add a photo of the view before submitting.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      const response = await fetch("/api/spots", {
        method: "POST",
        body: values,
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not submit this spot.");
      setStatus("success");
      setMessage("Success.");
      form.reset();
      setBestFor("both");
      setCrowd("unknown");
      clearPicture();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit this spot.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-7 sm:gap-9">
      <section>
        <SectionHead index="01" title="the view" />
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`pn-interactive relative overflow-hidden rounded-2xl border ${
            picture
              ? "border-white/25"
              : `border-dashed ${dragging ? "border-[#ffd166] bg-[#ffd166]/10" : "border-[#ffd166]/55 bg-[#140d2e]/40 hover:border-[#ffd166] hover:bg-[#140d2e]/60"}`
          }`}
        >
          {picture ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing for the optimizer to do */}
              <img src={picture.url} alt="" className="h-48 w-full object-cover sm:h-64" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(20,13,46,.92)_0%,rgba(20,13,46,.12)_52%,transparent_100%)]" />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#fff6e8]">{picture.file.name}</span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#ffd166]">
                    {formatSize(picture.file.size)}
                  </span>
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="pn-interactive rounded-full border border-white/35 bg-[#140d2e]/75 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#fff6e8] hover:border-[#ffd166] hover:text-[#ffd166]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={clearPicture}
                    className="pn-interactive rounded-full border border-white/35 bg-[#140d2e]/75 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c9b8df] hover:border-[#ffb4ad] hover:text-[#ffb4ad]"
                  >
                    Remove
                  </button>
                </span>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="group flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2.5 px-4 text-center sm:h-56 sm:px-8"
            >
              <svg viewBox="0 0 48 32" aria-hidden className="h-10 w-14 text-[#ffd166] transition-transform group-hover:-translate-y-0.5" fill="none">
                <circle cx="34" cy="9" r="4.5" fill="currentColor" opacity=".85" />
                <path d="M2 30 16 11l9 11.5 5-5.5L46 30Z" fill="currentColor" opacity=".25" />
                <path d="M2 30 16 11l9 11.5 5-5.5L46 30Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <span className="block text-[26px] leading-none text-[#fff6e8] [font-family:var(--font-caveat)]">
                drop a photo of the view
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#b9a8d9]">
                or <span className="text-[#ffd166] underline decoration-dotted underline-offset-4">browse</span> · jpg, png, webp · max 8 mb
              </span>
            </button>
          )}
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            name="picture"
            accept={ACCEPTED.join(",")}
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />
        </div>
        {pictureError && <p className="mt-3 text-xs text-[#ffb4ad]">{pictureError}</p>}
      </section>

      <section>
        <SectionHead index="02" title="the details" />
        <div className="grid grid-cols-1 gap-x-7 gap-y-6 sm:grid-cols-2">
          <label className={labelClass}>
            Spot name
            <input className={fieldClass} name="name" maxLength={80} placeholder="Cira Green" required />
          </label>
          <label className={labelClass}>
            Location
            <input className={fieldClass} name="location" maxLength={160} placeholder="Address, intersection, coordinates" required />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            What you see
            <input className={fieldClass} name="view" maxLength={100} placeholder="River + skyline, open field, panorama…" required />
          </label>
          <div className={labelClass}>
            Best light
            <Segmented
              name="bestFor"
              value={bestFor}
              onChange={setBestFor}
              options={[
                { value: "both", label: "Both" },
                { value: "sunrise", label: "Sunrise" },
                { value: "sunset", label: "Sunset" },
              ]}
            />
          </div>
          <div className={labelClass}>
            Crowdedness
            <Segmented
              name="crowd"
              value={crowd}
              onChange={setCrowd}
              options={[
                { value: "unknown", label: "?" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Med" },
                { value: "high", label: "High" },
              ]}
            />
          </div>
          <label className={`${labelClass} sm:col-span-2`}>
            Access notes <span className={optionalClass}>(optional)</span>
            <textarea
              className="mt-1.5 min-h-24 w-full resize-y rounded-lg border border-[#8c7ba8]/45 bg-[#140d2e]/40 px-3.5 py-3 text-[15px] font-normal normal-case tracking-normal text-[#fff6e8] outline-none transition-colors placeholder:text-[#9d8db7]/55 focus:border-[#ffd166]"
              name="notes"
              maxLength={500}
              placeholder="Hours, entrance, whether the gate is ever locked."
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Contact <span className={optionalClass}>(optional)</span>
            <input className={fieldClass} name="contact" maxLength={160} placeholder="Email or handle, only if we may follow up" />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/20 pt-6">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="pn-interactive pn-button pn-button-primary w-full rounded-full bg-[#ffd166] px-7 py-3 text-xs font-extrabold uppercase tracking-[.12em] text-[#3a1440] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {status === "submitting" ? "sending…" : "submit spot →"}
        </button>
        <p
          aria-live="polite"
          className={`m-0 max-w-md ${
            status === "error"
              ? "text-xs leading-5 text-[#ffb4ad]"
              : "text-[28px] leading-none text-[#ffd166] [font-family:var(--font-caveat)]"
          }`}
        >
          {message}
        </p>
      </div>
    </form>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tradevibe_weekly_analysis";

const QUESTIONS = [
  {
    key: "bias",
    label: "What is your bias this week?",
    placeholder: "e.g., Bullish, Bearish, Neutral, or Range-bound…",
  },
  {
    key: "levels",
    label: "Key levels to watch",
    placeholder: "e.g., Resistance: 1.0850, Support: 1.0720, Pivot: 1.0785…",
  },
  {
    key: "risk",
    label: "Risk plan / max loss",
    placeholder: "e.g., Max risk 1% of account, no more than 2R per trade…",
  },
  {
    key: "focus",
    label: "What are you focusing on this week?",
    placeholder: "e.g., Patience on entries, stick to plan, avoid overtrading…",
  },
];

function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatWeekLabel(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function emptyForm() {
  return {
    bias: "",
    levels: "",
    risk: "",
    focus: "",
    notes: "",
    images: [],
  };
}

export default function WeeklyAnalysis() {
  const [weeks, setWeeks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [pasteHint, setPasteHint] = useState(false);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setWeeks(JSON.parse(raw));
    } catch {
      setWeeks([]);
    }
  }, []);

  const persist = (next) => {
    setWeeks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError("Storage full. Delete some older weeks and try again.");
    }
  };

  const addImagesFromFiles = useCallback(async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      setError("Please use image files only (or paste a screenshot).");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const added = [];
      for (const file of list) {
        if (file.size > 25 * 1024 * 1024) {
          setError("One image is too large (max ~25MB before compression).");
          continue;
        }
        const dataUrl = await compressImage(file);
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          dataUrl,
          description: "",
        });
      }
      if (added.length) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...added] }));
      }
    } catch (err) {
      setError(err.message || "Could not add image");
    } finally {
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length) {
        e.preventDefault();
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 1500);
        await addImagesFromFiles(imageFiles);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addImagesFromFiles]);

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove("ring-2", "ring-emerald-500/50");
    if (e.dataTransfer?.files?.length) {
      await addImagesFromFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add("ring-2", "ring-emerald-500/50");
  };

  const onDragLeave = () => {
    dropRef.current?.classList.remove("ring-2", "ring-emerald-500/50");
  };

  const updateImageDesc = (id, description) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === id ? { ...img, description } : img
      ),
    }));
  };

  const removeImage = (id) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
  };

  const handleSave = () => {
    setError("");
    const hasText = QUESTIONS.some((q) => form[q.key]?.trim()) || form.notes.trim();
    const hasImages = form.images.length > 0;
    if (!hasText && !hasImages) {
      setError("Add at least one answer or a screenshot before saving.");
      return;
    }
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      bias: form.bias.trim(),
      levels: form.levels.trim(),
      risk: form.risk.trim(),
      focus: form.focus.trim(),
      notes: form.notes.trim(),
      images: form.images,
    };
    persist([entry, ...weeks]);
    setForm(emptyForm());
    setExpandedId(entry.id);
  };

  const handleDeleteWeek = (id) => {
    if (!window.confirm("Delete this weekly analysis?")) return;
    persist(weeks.filter((w) => w.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Weekly Analysis</h2>
        <p className="text-slate-400 mt-1">
          Log your weekly expectations and trade review
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Previous weeks ON TOP */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Previous weeks
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {weeks.length} {weeks.length === 1 ? "week" : "weeks"} logged
            </span>
          </h3>
        </div>

        {weeks.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-10 text-center text-slate-500 text-sm">
            No weeks saved yet. Fill the form below and click Save week.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {weeks.map((week) => {
              const open = expandedId === week.id;
              return (
                <div
                  key={week.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : week.id)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Week of {formatWeekLabel(week.createdAt)}
                        </p>
                        <p className="text-xs text-emerald-400 mt-0.5">● Saved</p>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {open ? "Hide" : "Review"} →
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-slate-400">
                      {week.bias && <li className="truncate">Bias: {week.bias}</li>}
                      {week.levels && (
                        <li className="truncate">Key levels: {week.levels}</li>
                      )}
                      {week.focus && (
                        <li className="truncate">Focus: {week.focus}</li>
                      )}
                    </ul>
                    {week.images?.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {week.images.slice(0, 4).map((img) => (
                          <img
                            key={img.id}
                            src={img.dataUrl}
                            alt=""
                            className="h-14 w-20 object-cover rounded-lg border border-slate-700 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreview(img);
                            }}
                          />
                        ))}
                        {week.images.length > 4 && (
                          <span className="text-xs text-slate-500 self-center">
                            +{week.images.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {open && (
                    <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-3 text-sm">
                      {QUESTIONS.map((q) =>
                        week[q.key] ? (
                          <div key={q.key}>
                            <p className="text-slate-500 text-xs mb-0.5">{q.label}</p>
                            <p className="text-slate-200 whitespace-pre-wrap">
                              {week[q.key]}
                            </p>
                          </div>
                        ) : null
                      )}
                      {week.notes && (
                        <div>
                          <p className="text-slate-500 text-xs mb-0.5">Notes</p>
                          <p className="text-slate-200 whitespace-pre-wrap">
                            {week.notes}
                          </p>
                        </div>
                      )}
                      {week.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {week.images.map((img) => (
                            <div key={img.id}>
                              <button
                                type="button"
                                onClick={() => setPreview(img)}
                                className="block w-full"
                              >
                                <img
                                  src={img.dataUrl}
                                  alt=""
                                  className="w-full aspect-video object-cover rounded-xl border border-slate-700"
                                />
                              </button>
                              {img.description && (
                                <p className="text-xs text-slate-400 mt-1">
                                  {img.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteWeek(week.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 mt-2"
                      >
                        Delete this week
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* This week's form */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8">
        <h3 className="text-lg font-semibold text-white mb-6">
          This week&apos;s expectations
        </h3>

        <div className="space-y-5">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-sm text-slate-300 mb-1.5">{q.label}</label>
              <input
                type="text"
                value={form[q.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [q.key]: e.target.value }))
                }
                placeholder={q.placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">
              Screenshots & notes
            </label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addImagesFromFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400/70 rounded-2xl px-6 py-10 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40 transition text-center"
            >
              <span className="text-3xl">📷</span>
              <p className="text-emerald-400 text-sm font-medium">
                {uploading
                  ? "Compressing…"
                  : pasteHint
                    ? "Screenshot pasted!"
                    : "Click to upload or paste (Ctrl+V) a screenshot"}
              </p>
              <p className="text-xs text-slate-500">
                PNG, JPG, or paste from clipboard
              </p>
            </div>

            {form.images.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.images.map((img) => (
                  <div
                    key={img.id}
                    className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setPreview(img)}
                      className="block w-full"
                    >
                      <img
                        src={img.dataUrl}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                    </button>
                    <div className="p-3 space-y-2">
                      <input
                        type="text"
                        value={img.description}
                        onChange={(e) => updateImageDesc(img.id, e.target.value)}
                        placeholder="Description for this image…"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add any additional notes or context…"
              rows={3}
              className="mt-4 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={uploading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              Save week
            </button>
          </div>
        </div>
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-300 truncate">
                {preview.description || "Screenshot"}
              </p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-slate-400 hover:text-white text-xl px-2"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-56px)] flex justify-center bg-slate-950">
              <img
                src={preview.dataUrl}
                alt=""
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
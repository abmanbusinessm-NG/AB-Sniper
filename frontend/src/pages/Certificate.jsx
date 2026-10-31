import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tradevibe_certificates";

/** Compress image in the browser (canvas) — max width 1200px, JPEG quality 0.7 */
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
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function Certificate() {
  const [certs, setCerts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCerts(JSON.parse(raw));
    } catch {
      setCerts([]);
    }
  }, []);

  const save = (next) => {
    setCerts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError("Storage full. Delete some certificates and try again.");
    }
  };

  const handlePick = () => {
    setError("");
    inputRef.current?.click();
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      const added = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setError("Please choose image files only (JPG, PNG, WebP…).");
          continue;
        }
        if (file.size > 25 * 1024 * 1024) {
          setError("One file is too large (max ~25MB before compression).");
          continue;
        }
        const dataUrl = await compressImage(file);
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          dataUrl,
          name: file.name,
          addedAt: new Date().toISOString(),
        });
      }
      if (added.length) {
        save([...added, ...certs]);
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Remove this certificate?")) return;
    save(certs.filter((c) => c.id !== id));
    if (preview?.id === id) setPreview(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Certificates</h2>
        <p className="text-slate-400 mt-1">Upload and view your certificates</p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {certs.map((cert) => (
          <div
            key={cert.id}
            className="group bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col"
          >
            <button
              type="button"
              onClick={() => setPreview(cert)}
              className="aspect-[4/3] bg-slate-950/80 overflow-hidden text-left"
            >
              <img
                src={cert.dataUrl}
                alt={cert.name || "Certificate"}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
              />
            </button>
            <div className="p-4 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                <span aria-hidden>📅</span>
                <span>Added · {formatDate(cert.addedAt)}</span>
              </p>
              <button
                type="button"
                onClick={() => handleDelete(cert.id)}
                className="text-xs text-slate-500 hover:text-rose-400 transition shrink-0 px-2 py-1 rounded-lg hover:bg-rose-500/10"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className="aspect-[4/3] min-h-[180px] rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400/70 bg-slate-900/40 hover:bg-emerald-500/5 transition flex flex-col items-center justify-center gap-3 text-emerald-400 disabled:opacity-60 disabled:cursor-wait"
        >
          {uploading ? (
            <>
              <span className="text-3xl animate-pulse">⏳</span>
              <span className="text-sm font-medium">Compressing & saving…</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-light leading-none">+</span>
              <span className="text-sm font-medium">Add New Certificate</span>
            </>
          )}
        </button>
      </div>

      {certs.length === 0 && !uploading && (
        <p className="text-center text-slate-500 text-sm mt-8">
          No certificates yet. Click the + box to add your first one.
        </p>
      )}

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
                Added · {formatDate(preview.addedAt)}
                {preview.name ? ` · ${preview.name}` : ""}
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
                alt={preview.name || "Certificate"}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
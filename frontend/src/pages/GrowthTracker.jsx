import { useEffect, useState } from "react";

const STORAGE_KEY = "tradevibe_growth_tracker";

const SECTIONS = [
  {
    key: "technical",
    title: "Technical",
    icon: "📐",
    color: "from-cyan-500/20 to-blue-600/10",
    border: "border-cyan-500/30",
    accent: "text-cyan-300",
    hint: "Setups, levels, timing, execution on the chart",
  },
  {
    key: "psychology",
    title: "Psychology",
    icon: "🧠",
    color: "from-violet-500/20 to-purple-600/10",
    border: "border-violet-500/30",
    accent: "text-violet-300",
    hint: "Emotions, FOMO, patience, confidence, tilt",
  },
  {
    key: "risk",
    title: "Risk management",
    icon: "🛡️",
    color: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-500/30",
    accent: "text-amber-300",
    hint: "Size, stops, max loss, rule-breaking around risk",
  },
  {
    key: "habits",
    title: "Habits",
    icon: "🔁",
    color: "from-emerald-500/20 to-teal-600/10",
    border: "border-emerald-500/30",
    accent: "text-emerald-300",
    hint: "Routine, journaling, sleep, prep, consistency",
  },
];

function emptySection() {
  return { struggle: "", good: "" };
}

function emptyWeek(weekLabel) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    weekLabel,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    technical: emptySection(),
    psychology: emptySection(),
    risk: emptySection(),
    habits: emptySection(),
    overallNote: "",
  };
}

function currentWeekLabel() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function loadWeeks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWeeks(weeks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
}

function hasContent(week) {
  if (!week) return false;
  if (week.overallNote?.trim()) return true;
  return SECTIONS.some(
    (s) => week[s.key]?.struggle?.trim() || week[s.key]?.good?.trim()
  );
}

function getPreviewText(week) {
  if (week.overallNote?.trim()) return week.overallNote.trim();
  for (const s of SECTIONS) {
    if (week[s.key]?.good?.trim()) return week[s.key].good.trim();
    if (week[s.key]?.struggle?.trim()) return week[s.key].struggle.trim();
  }
  return "Empty week";
}

export default function GrowthTracker() {
  const [weeks, setWeeks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [viewMode, setViewMode] = useState(false); // true = big visual display
  const [viewWeek, setViewWeek] = useState(null);

  useEffect(() => {
    const list = loadWeeks();
    setWeeks(list);
    if (list.length) {
      setActiveId(list[0].id);
      setForm({ ...list[0] });
    } else {
      const w = emptyWeek(currentWeekLabel());
      setForm(w);
      setActiveId(w.id);
    }
  }, []);

  const persist = (nextWeeks, nextForm) => {
    setWeeks(nextWeeks);
    saveWeeks(nextWeeks);
    if (nextForm) setForm(nextForm);
  };

  const updateSection = (key, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSave = () => {
    if (!form) return;
    const updated = {
      ...form,
      updatedAt: new Date().toISOString(),
    };
    const exists = weeks.some((w) => w.id === updated.id);
    const next = exists
      ? weeks.map((w) => (w.id === updated.id ? updated : w))
      : [updated, ...weeks];
    persist(next, updated);
    setActiveId(updated.id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const handleNewWeek = () => {
    const w = emptyWeek(currentWeekLabel());
    setForm(w);
    setActiveId(w.id);
    setViewMode(false);
  };

  const selectWeek = (id) => {
    const w = weeks.find((x) => x.id === id);
    if (w) {
      setForm({ ...w });
      setActiveId(id);
      // Open the attention-gaining visual view
      setViewWeek(w);
      setViewMode(true);
    }
  };

  const openEdit = () => {
    setViewMode(false);
  };

  const handleDelete = () => {
    if (!form) return;
    if (!window.confirm("Delete this week’s growth notes?")) return;
    const next = weeks.filter((w) => w.id !== form.id);
    persist(next, null);
    setViewMode(false);
    if (next.length) {
      setForm({ ...next[0] });
      setActiveId(next[0].id);
    } else {
      const w = emptyWeek(currentWeekLabel());
      setForm(w);
      setActiveId(w.id);
    }
  };

  if (!form) {
    return (
      <div className="text-slate-400 text-sm">Loading growth tracker…</div>
    );
  }

  // ========== ATTENTION-GAINING VISUAL VIEW ==========
  if (viewMode && viewWeek) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setViewMode(false)}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition"
            >
              ← Back to editor
            </button>
            <div className="flex gap-3">
              <button
                onClick={openEdit}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
              >
                Edit this week
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-sm transition"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Big header card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-8 sm:p-12 mb-8 shadow-2xl shadow-emerald-500/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <p className="text-emerald-400/80 text-sm font-medium tracking-widest uppercase mb-3">
                Growth Snapshot
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
                {viewWeek.weekLabel}
              </h1>
              <p className="text-slate-400 text-sm">
                Last updated{" "}
                {new Date(viewWeek.updatedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Sections as visual cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {SECTIONS.map((sec) => {
              const data = viewWeek[sec.key] || emptySection();
              const hasStruggle = data.struggle?.trim();
              const hasGood = data.good?.trim();
              if (!hasStruggle && !hasGood) return null;

              return (
                <div
                  key={sec.key}
                  className={`relative overflow-hidden rounded-2xl border ${sec.border} bg-gradient-to-br ${sec.color} p-6 shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{sec.icon}</span>
                    <div>
                      <h3 className={`text-lg font-bold ${sec.accent}`}>
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-500">{sec.hint}</p>
                    </div>
                  </div>

                  {hasStruggle && (
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/90 mb-1.5">
                        Struggling with
                      </p>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {data.struggle}
                      </p>
                    </div>
                  )}

                  {hasGood && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90 mb-1.5">
                        Going well
                      </p>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {data.good}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall note */}
          {viewWeek.overallNote?.trim() && (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Overall focus for next week
              </p>
              <p className="text-lg sm:text-xl text-white leading-relaxed font-medium whitespace-pre-wrap">
                “{viewWeek.overallNote}”
              </p>
            </div>
          )}

          {!hasContent(viewWeek) && (
            <div className="text-center py-16 text-slate-500">
              This week has no notes yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== NORMAL EDITOR ==========
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Growth Tracker</h2>
          <p className="text-slate-400 mt-1 max-w-xl">
            Weekly notes on technical skill, psychology, risk, and habits—what
            you struggle with and what is going well.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleNewWeek}
            className="px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-200 hover:bg-slate-800 transition"
          >
            + New week
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition"
          >
            {savedFlash ? "Saved ✓" : "Save week"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Saved weeks – richer cards */}
        <div className="xl:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Saved weeks</h3>
          {weeks.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved weeks yet. Fill the sections and click Save week.
            </p>
          ) : (
            <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {weeks.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => selectWeek(w.id)}
                    className={`w-full text-left p-3.5 rounded-xl transition border group ${
                      activeId === w.id
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`font-semibold text-sm leading-snug ${
                          activeId === w.id ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {w.weekLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                        {new Date(w.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {getPreviewText(w)}
                    </p>
                    <p className="mt-2 text-[10px] text-emerald-500/70 opacity-0 group-hover:opacity-100 transition">
                      Click to view →
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Editor */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">
                Week label
              </label>
              <input
                type="text"
                value={form.weekLabel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weekLabel: e.target.value }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-400 hover:text-rose-300 px-2 py-2 self-end sm:self-center"
            >
              Delete week
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTIONS.map((sec) => (
              <div
                key={sec.key}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{sec.icon}</span>
                  <h3 className="text-base font-semibold text-white">
                    {sec.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">{sec.hint}</p>

                <label className="text-xs font-medium text-rose-300/90 mb-1.5">
                  What I’m struggling with
                </label>
                <textarea
                  value={form[sec.key]?.struggle || ""}
                  onChange={(e) =>
                    updateSection(sec.key, "struggle", e.target.value)
                  }
                  rows={4}
                  placeholder="Be honest—specific is better than vague…"
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-y mb-4"
                />

                <label className="text-xs font-medium text-emerald-300/90 mb-1.5">
                  What’s going well
                </label>
                <textarea
                  value={form[sec.key]?.good || ""}
                  onChange={(e) =>
                    updateSection(sec.key, "good", e.target.value)
                  }
                  rows={4}
                  placeholder="Wins, improvements, habits that stuck…"
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-y"
                />
              </div>
            ))}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <label className="text-sm font-semibold text-white block mb-2">
              Overall note (optional)
            </label>
            <textarea
              value={form.overallNote || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, overallNote: e.target.value }))
              }
              rows={3}
              placeholder="One focus for next week…"
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition shadow-lg shadow-emerald-500/20"
            >
              {savedFlash ? "Saved ✓" : "Save week"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
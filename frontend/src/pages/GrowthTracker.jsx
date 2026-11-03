import { useEffect, useState } from "react";

const STORAGE_KEY = "tradevibe_growth_tracker";

const SECTIONS = [
  {
    key: "technical",
    title: "Technical",
    icon: "📐",
    hint: "Setups, levels, timing, execution on the chart",
  },
  {
    key: "psychology",
    title: "Psychology",
    icon: "🧠",
    hint: "Emotions, FOMO, patience, confidence, tilt",
  },
  {
    key: "risk",
    title: "Risk management",
    icon: "🛡️",
    hint: "Size, stops, max loss, rule-breaking around risk",
  },
  {
    key: "habits",
    title: "Habits",
    icon: "🔁",
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

export default function GrowthTracker() {
  const [weeks, setWeeks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

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
  };

  const selectWeek = (id) => {
    const w = weeks.find((x) => x.id === id);
    if (w) {
      setForm({ ...w });
      setActiveId(id);
    }
  };

  const handleDelete = () => {
    if (!form) return;
    if (!window.confirm("Delete this week’s growth notes?")) return;
    const next = weeks.filter((w) => w.id !== form.id);
    persist(next, null);
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
            {savedFlash ? "Saved" : "Save week"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Past weeks */}
        <div className="xl:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Saved weeks</h3>
          {weeks.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved weeks yet. Fill the sections and click Save week.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[480px] overflow-y-auto">
              {weeks.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => selectWeek(w.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition border ${
                      activeId === w.id
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span className="block font-medium text-xs sm:text-sm truncate">
                      {w.weekLabel}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Updated{" "}
                      {new Date(w.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
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

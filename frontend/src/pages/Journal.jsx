import { useEffect, useMemo, useState } from "react";

const TRADES_KEY = "tradevibe_journal_trades";
const REVIEWS_KEY = "tradevibe_journal_reviews";

const emptyTrade = () => ({
  date: new Date().toISOString().slice(0, 10),
  market: "",
  setup: "",
  side: "LONG",
  risk: "1R",
  result: "",
  planFollowed: "YES",
  notes: "",
});

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseResult(val) {
  if (val === "" || val == null) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function formatDateLabel(iso) {
  try {
    return new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

export default function Journal() {
  const [trades, setTrades] = useState([]);
  const [reviews, setReviews] = useState({});
  const [search, setSearch] = useState("");
  const [filterSide, setFilterSide] = useState("ALL");
  const [filterOutcome, setFilterOutcome] = useState("ALL");
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState(emptyTrade);
  const [editId, setEditId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const [reviewDate, setReviewDate] = useState(today);
  const [review, setReview] = useState({
    session: "London → New York",
    bias: "",
    thesis: "",
    quality: 4,
    emotions: [],
    checklist: {
      htf: false,
      risk: false,
      news: false,
      stop: false,
    },
    lesson: "",
  });

  const emotionOptions = ["Patient", "Focused", "FOMO", "Anxious", "Confident", "Tilted"];

  useEffect(() => {
    setTrades(loadJSON(TRADES_KEY, []));
    setReviews(loadJSON(REVIEWS_KEY, {}));
  }, []);

  useEffect(() => {
    const r = reviews[reviewDate];
    if (r) {
      setReview({
        session: r.session || "London → New York",
        bias: r.bias || "",
        thesis: r.thesis || "",
        quality: r.quality ?? 4,
        emotions: r.emotions || [],
        checklist: r.checklist || { htf: false, risk: false, news: false, stop: false },
        lesson: r.lesson || "",
      });
    } else {
      setReview({
        session: "London → New York",
        bias: "",
        thesis: "",
        quality: 4,
        emotions: [],
        checklist: { htf: false, risk: false, news: false, stop: false },
        lesson: "",
      });
    }
  }, [reviewDate, reviews]);

  const persistTrades = (next) => {
    setTrades(next);
    saveJSON(TRADES_KEY, next);
  };

  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => parseResult(t.result) > 0).length;
    const winRate = total ? (wins / total) * 100 : 0;
    const net = trades.reduce((s, t) => s + parseResult(t.result), 0);
    const planYes = trades.filter((t) => t.planFollowed === "YES").length;
    const adherence = total ? (planYes / total) * 100 : 0;
    return { total, winRate, net, adherence };
  }, [trades]);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        const q = search.toLowerCase();
        const matchQ =
          !q ||
          t.market?.toLowerCase().includes(q) ||
          t.setup?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q);
        const matchSide = filterSide === "ALL" || t.side === filterSide;
        const res = parseResult(t.result);
        const matchOut =
          filterOutcome === "ALL" ||
          (filterOutcome === "WIN" && res > 0) ||
          (filterOutcome === "LOSS" && res < 0) ||
          (filterOutcome === "BE" && res === 0);
        return matchQ && matchSide && matchOut;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [trades, search, filterSide, filterOutcome]);

  // Calendar for current month
  const cal = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = last.getDate();
    const byDay = {};
    trades.forEach((t) => {
      if (!t.date) return;
      const d = new Date(t.date + "T12:00:00");
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      const day = d.getDate();
      byDay[day] = (byDay[day] || 0) + parseResult(t.result);
    });
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const pnl = byDay[d];
      let status = "none";
      if (pnl !== undefined) status = pnl > 0 ? "win" : pnl < 0 ? "loss" : "flat";
      cells.push({ day: d, pnl, status });
    }
    const profitable = Object.values(byDay).filter((v) => v > 0).length;
    const losing = Object.values(byDay).filter((v) => v < 0).length;
    const tradedDays = Object.keys(byDay).length;
    const noTrades = daysInMonth - tradedDays;
    const monthPnl = Object.values(byDay).reduce((s, v) => s + v, 0);
    return {
      label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      cells,
      profitable,
      losing,
      noTrades,
      monthPnl,
    };
  }, [trades]);

  const patterns = useMemo(() => {
    const bySetup = {};
    trades.forEach((t) => {
      const s = t.setup?.trim() || "Unknown";
      if (!bySetup[s]) bySetup[s] = { pnl: 0, wins: 0, n: 0 };
      const r = parseResult(t.result);
      bySetup[s].pnl += r;
      bySetup[s].n += 1;
      if (r > 0) bySetup[s].wins += 1;
    });
    const setups = Object.entries(bySetup).map(([name, v]) => ({
      name,
      ...v,
      wr: v.n ? (v.wins / v.n) * 100 : 0,
    }));
    const best = setups.sort((a, b) => b.pnl - a.pnl)[0];
    const worstWr = setups.filter((s) => s.n >= 2).sort((a, b) => a.wr - b.wr)[0];
    return { best, worstWr };
  }, [trades]);

  const openNewTrade = () => {
    setEditId(null);
    setForm(emptyTrade());
    setShowLog(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      date: t.date || today,
      market: t.market || "",
      setup: t.setup || "",
      side: t.side || "LONG",
      risk: t.risk || "1R",
      result: t.result ?? "",
      planFollowed: t.planFollowed || "YES",
      notes: t.notes || "",
    });
    setShowLog(true);
  };

  const saveTrade = (e) => {
    e.preventDefault();
    if (!form.market.trim()) return;
    if (editId) {
      persistTrades(
        trades.map((t) => (t.id === editId ? { ...t, ...form, result: String(form.result) } : t))
      );
    } else {
      const row = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...form,
        result: String(form.result),
      };
      persistTrades([row, ...trades]);
    }
    setShowLog(false);
  };

  const deleteTrade = (id) => {
    if (!window.confirm("Delete this trade?")) return;
    persistTrades(trades.filter((t) => t.id !== id));
  };

  const toggleEmotion = (em) => {
    setReview((prev) => ({
      ...prev,
      emotions: prev.emotions.includes(em)
        ? prev.emotions.filter((x) => x !== em)
        : [...prev.emotions, em],
    }));
  };

  const saveReview = () => {
    const next = { ...reviews, [reviewDate]: { ...review } };
    setReviews(next);
    saveJSON(REVIEWS_KEY, next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Trading Journal</h2>
          <p className="text-slate-400 mt-1">Review the process. Improve the execution.</p>
        </div>
        <button
          type="button"
          onClick={openNewTrade}
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 shrink-0"
        >
          + Log Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Trades Logged",
            value: String(stats.total),
            icon: "📊",
            color: "text-white",
          },
          {
            label: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: "🎯",
            color: "text-cyan-400",
          },
          {
            label: "Net P&L",
            value: formatMoney(stats.net),
            icon: "$",
            color: stats.net >= 0 ? "text-emerald-400" : "text-rose-400",
          },
          {
            label: "Rule Adherence",
            value: `${stats.adherence.toFixed(1)}%`,
            icon: "🛡️",
            color: "text-violet-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trade history + Daily review */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trade History */}
        <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📋 Trade History
            </h3>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by market, setup, or notes…"
              className="w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="ALL">All Sides</option>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Wins</option>
              <option value="LOSS">Losses</option>
              <option value="BE">Break even</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-800">
                  <th className="pb-3 pr-3 font-medium">DATE</th>
                  <th className="pb-3 pr-3 font-medium">MARKET</th>
                  <th className="pb-3 pr-3 font-medium">SETUP</th>
                  <th className="pb-3 pr-3 font-medium">SIDE</th>
                  <th className="pb-3 pr-3 font-medium">RISK</th>
                  <th className="pb-3 pr-3 font-medium">RESULT</th>
                  <th className="pb-3 pr-3 font-medium">PLAN</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No trades yet. Click “+ Log Trade” to add one.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const res = parseResult(t.result);
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-slate-800/80 hover:bg-slate-800/30"
                      >
                        <td className="py-3 pr-3 text-slate-300 whitespace-nowrap">
                          {formatDateLabel(t.date)}
                        </td>
                        <td className="py-3 pr-3 text-white font-medium">{t.market}</td>
                        <td className="py-3 pr-3 text-slate-400">{t.setup || "—"}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                              t.side === "LONG"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {t.side}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-slate-400">{t.risk}</td>
                        <td
                          className={`py-3 pr-3 font-semibold ${
                            res > 0
                              ? "text-emerald-400"
                              : res < 0
                                ? "text-rose-400"
                                : "text-slate-400"
                          }`}
                        >
                          {formatMoney(res)}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              t.planFollowed === "YES"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {t.planFollowed}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="text-xs text-slate-400 hover:text-white px-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTrade(t.id)}
                            className="text-xs text-slate-500 hover:text-rose-400 px-2"
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Review */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📅 Daily Review</h3>
            <input
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
            />
          </div>

          <div className="space-y-4 flex-1 text-sm">
            <div>
              <label className="text-slate-500 text-xs block mb-1">Session</label>
              <select
                value={review.session}
                onChange={(e) => setReview({ ...review, session: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option>London → New York</option>
                <option>Asia</option>
                <option>London</option>
                <option>New York</option>
                <option>Full day</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Pre-market Bias</label>
              <input
                value={review.bias}
                onChange={(e) => setReview({ ...review, bias: e.target.value })}
                placeholder="e.g., Bearish USD / Bullish Gold"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Setup & Thesis</label>
              <textarea
                value={review.thesis}
                onChange={(e) => setReview({ ...review, thesis: e.target.value })}
                rows={2}
                placeholder="Wait for liquidity sweep, then confirm…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 resize-y"
              />
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">
                Execution Quality · {review.quality}/5
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={review.quality}
                onChange={(e) =>
                  setReview({ ...review, quality: Number(e.target.value) })
                }
                className="w-full accent-emerald-500"
              />
              <div className="flex gap-1 mt-1 text-amber-400 text-sm">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i}>{i < review.quality ? "★" : "☆"}</span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Emotion</label>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => toggleEmotion(em)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      review.emotions.includes(em)
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Checklist</label>
              <div className="space-y-1.5">
                {[
                  ["htf", "HTF bias defined"],
                  ["risk", "Risk set before entry"],
                  ["news", "News checked"],
                  ["stop", "Stop not moved"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!review.checklist[key]}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          checklist: {
                            ...review.checklist,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500/40"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-500 text-xs block mb-1">Lesson Learned</label>
              <textarea
                value={review.lesson}
                onChange={(e) => setReview({ ...review, lesson: e.target.value })}
                rows={3}
                placeholder="Be more patient during NY session…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 resize-y"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveReview}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-xl transition"
          >
            Save Review
          </button>
        </div>
      </div>

      {/* Calendar + Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">
            📅 Monthly P&L Calendar
          </h3>
          <p className="text-sm text-slate-400 mb-3">{cal.label}</p>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs mb-2 text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cal.cells.map((cell, i) =>
              cell === null ? (
                <div key={`e-${i}`} className="aspect-square" />
              ) : (
                <div
                  key={cell.day}
                  title={
                    cell.pnl !== undefined ? formatMoney(cell.pnl) : "No trades"
                  }
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                    cell.status === "win"
                      ? "bg-emerald-500/80 text-slate-950"
                      : cell.status === "loss"
                        ? "bg-rose-500/80 text-white"
                        : cell.status === "flat"
                          ? "bg-slate-600 text-white"
                          : "bg-slate-800/80 text-slate-500"
                  }`}
                >
                  {cell.day}
                </div>
              )
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profitable{" "}
              {cal.profitable}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Losing {cal.losing}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> No trades{" "}
              {cal.noTrades}
            </span>
          </div>
          <p className="mt-3 text-sm">
            <span className="text-slate-400">Monthly P&L </span>
            <span
              className={`font-bold ${
                cal.monthPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatMoney(cal.monthPnl)}
            </span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">
            📈 Patterns to review
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 mb-1">🏆 Best setup</p>
                <p className="text-white font-medium">
                  {patterns.best?.name || "—"}
                </p>
              </div>
              <p
                className={`font-semibold ${
                  (patterns.best?.pnl || 0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {patterns.best ? formatMoney(patterns.best.pnl) : "—"}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 mb-1">⚠️ Weakest setup (WR)</p>
                <p className="text-white font-medium">
                  {patterns.worstWr?.name || "—"}
                  {patterns.worstWr ? (
                    <span className="text-slate-500 text-xs ml-1">
                      ({patterns.worstWr.n} trades)
                    </span>
                  ) : null}
                </p>
              </div>
              <p className="font-semibold text-rose-400">
                {patterns.worstWr
                  ? `${patterns.worstWr.wr.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">💡 Tip</p>
              <p className="text-slate-300 text-sm">
                Log trades with clear setup names so patterns become useful over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Trade modal */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLog(false)}
        >
          <form
            onSubmit={saveTrade}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editId ? "Edit Trade" : "Log Trade"}
              </h3>
              <button
                type="button"
                onClick={() => setShowLog(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Market</label>
                <input
                  required
                  value={form.market}
                  onChange={(e) => setForm({ ...form, market: e.target.value })}
                  placeholder="XAUUSD"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Setup</label>
                <input
                  value={form.setup}
                  onChange={(e) => setForm({ ...form, setup: e.target.value })}
                  placeholder="ICT Reversal"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Side</label>
                <select
                  value={form.side}
                  onChange={(e) => setForm({ ...form, side: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Risk</label>
                <input
                  value={form.risk}
                  onChange={(e) => setForm({ ...form, risk: e.target.value })}
                  placeholder="1R"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Result ($)
                </label>
                <input
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  placeholder="86 or -42.50"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">
                  Plan followed
                </label>
                <select
                  value={form.planFollowed}
                  onChange={(e) =>
                    setForm({ ...form, planFollowed: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm resize-y"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-xl transition"
            >
              {editId ? "Update Trade" : "Save Trade"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

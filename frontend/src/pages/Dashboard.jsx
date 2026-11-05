import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const TRADES_KEY = "tradevibe_journal_trades";
const PLAN_KEY = "tradevibe_daily_plan";

function loadTrades() {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function parseResult(val) {
  if (val === "" || val == null) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n) {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function formatLevel(n) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

const defaultPlan = [
  { id: "levels", label: "Mark key levels (PDH/PDL, liquidity)", done: false },
  { id: "london", label: "Wait for London session (3AM – 6AM EAT)", done: false },
  { id: "smc", label: "Look for SMC setups (FVG, OB, Breaker Block)", done: false },
  { id: "risk", label: "Risk 1–2% per trade", done: false },
  { id: "news", label: "No trading during red-folder news", done: false },
];

const watchlistSymbols = [
  { symbol: "XAUUSD", flag: "🥇" },
  { symbol: "NAS100", flag: "🇺🇸" },
  { symbol: "DXY", flag: "💵" },
  { symbol: "US10Y", flag: "🇺🇸" },
  { symbol: "VIX", flag: "📉" },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [plan, setPlan] = useState(defaultPlan);
  const [now, setNow] = useState(new Date());
  const [curveRange, setCurveRange] = useState("ALL");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setTrades(loadTrades());
    try {
      const p = localStorage.getItem(PLAN_KEY);
      if (p) setPlan(JSON.parse(p));
    } catch {
      /* keep default */
    }
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => parseResult(t.result) > 0).length;
    const losses = trades.filter((t) => parseResult(t.result) < 0).length;
    const be = total - wins - losses;
    const winRate = total ? (wins / total) * 100 : 0;
    const net = trades.reduce((s, t) => s + parseResult(t.result), 0);
    const days = new Set(trades.map((t) => t.date).filter(Boolean));
    const dayOfMonth = now.getDate();
    return {
      total,
      wins,
      losses,
      be,
      winRate,
      net,
      tradingDays: days.size,
      dayOfMonth,
    };
  }, [trades, now]);

  const recent = useMemo(() => {
    return [...trades]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);
  }, [trades]);

  const RANGE_DAYS = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    ALL: null,
  };

  const equityCurve = useMemo(() => {
    const startBal = Number(localStorage.getItem("ab_sniper_starting_balance"));
    const initial = Number.isFinite(startBal) ? startBal : 0;

    const sorted = [...trades]
      .filter((t) => t.date)
      .sort((a, b) => {
        const ka = `${a.date}|${a.time || "00:00"}|${a.id || ""}`;
        const kb = `${b.date}|${b.time || "00:00"}|${b.id || ""}`;
        return ka.localeCompare(kb);
      });

    const days = RANGE_DAYS[curveRange];
    const cutoff = new Date();
    cutoff.setHours(12, 0, 0, 0);
    if (days != null) cutoff.setDate(cutoff.getDate() - days);

    const inWindow = (dateStr) => {
      if (days == null) return true;
      return new Date(dateStr + "T12:00:00") >= cutoff;
    };

    let equity = initial;
    for (const t of sorted) {
      if (!inWindow(t.date)) equity += parseResult(t.result);
    }
    const windowStart = equity;

    const points = [
      {
        equity,
        pnl: 0,
        date: days == null ? "Start" : cutoff.toISOString().slice(0, 10),
        time: "",
        market: "",
      },
    ];

    for (const t of sorted) {
      if (!inWindow(t.date)) continue;
      const pnl = parseResult(t.result);
      equity += pnl;
      points.push({
        equity,
        pnl,
        date: t.date,
        time: t.time || "",
        market: t.market || "",
      });
    }

    const ys = points.map((p) => p.equity);
    let max = Math.max(...ys);
    let min = Math.min(...ys);
    const pad = Math.max((max - min) * 0.12, Math.abs(windowStart) * 0.02, 20);
    max += pad;
    min -= pad;
    if (max === min) {
      max += 50;
      min -= 50;
    }

    const yTicks = [min, (min + max) / 2, max];

    return {
      points,
      max,
      min,
      final: equity,
      windowStart,
      yTicks,
      maxLoss: initial > 0 ? initial * 0.9 : null,
      dailyDd: windowStart > 0 ? windowStart * 0.95 : null,
    };
  }, [trades, curveRange]);

  const setups = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      const name = t.setup?.trim() || "Unknown";
      if (!map[name]) map[name] = { name, n: 0, wins: 0, pnl: 0 };
      const r = parseResult(t.result);
      map[name].n += 1;
      map[name].pnl += r;
      if (r > 0) map[name].wins += 1;
    });
    return Object.values(map)
      .map((s) => ({ ...s, wr: s.n ? (s.wins / s.n) * 100 : 0 }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 4);
  }, [trades]);

  const togglePlan = (id) => {
    const next = plan.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setPlan(next);
    localStorage.setItem(PLAN_KEY, JSON.stringify(next));
  };

  const firstName = user?.name?.split(" ")[0] || "Trader";
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const winPct = stats.total ? (stats.wins / stats.total) * 100 : 0;
  const lossPct = stats.total ? (stats.losses / stats.total) * 100 : 0;
  const bePct = stats.total ? (stats.be / stats.total) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Top meta row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <p className="text-slate-400">
          Market snapshot · values stay at zero until you connect live data or log trades
        </p>
        <p>
          {dateStr} · {timeStr}
        </p>
      </div>

      {/* Ticker strip (placeholder zeros — structure only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {["XAUUSD", "NAS100", "EURUSD", "GBPUSD", "DXY"].map((sym) => (
          <div
            key={sym}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between"
          >
            <span className="text-xs font-medium text-slate-300">{sym}</span>
            <span className="text-xs text-slate-500">0.00</span>
          </div>
        ))}
      </div>

      {/* Welcome + KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="xl:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-sm text-slate-400">Welcome back,</p>
          <p className="text-lg font-bold text-white truncate">{firstName}</p>
          <p className="text-xs text-slate-500 mt-1">Discipline today. Freedom tomorrow.</p>
        </div>
        {[
          {
            label: "Account Balance",
            value: "$0.00",
            sub: "—",
            color: "text-white",
          },
          {
            label: "Total P&L",
            value: formatMoney(stats.net),
            sub: stats.total ? `${stats.total} trades` : "No trades yet",
            color: stats.net >= 0 ? "text-emerald-400" : "text-rose-400",
          },
          {
            label: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            sub: stats.total
              ? `${stats.wins}W / ${stats.losses}L / ${stats.be}BE`
              : "0W / 0L / 0BE",
            color: "text-cyan-400",
          },
          {
            label: "Trading Days",
            value: `${stats.tradingDays} / ${stats.dayOfMonth}`,
            sub: stats.dayOfMonth
              ? `${Math.round((stats.tradingDays / stats.dayOfMonth) * 100)}% of month`
              : "0%",
            color: "text-violet-400",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4"
          >
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Equity Curve + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Trading Growth Curve */}
        <div className="xl:col-span-9 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-h-[340px] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Trading Growth Curve</h3>
              <p className="text-xs text-slate-500">Realized equity after each closed trade</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurveRange(key)}
                  className={`px-2 py-1 rounded-md text-[11px] border ${
                    curveRange === key
                      ? "bg-sky-500/20 border-sky-400 text-sky-300"
                      : "border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {key === "ALL" ? "All" : key}
                </button>
              ))}
            </div>
          </div>
          <p
            className={`text-lg font-bold ${
              equityCurve.final >= equityCurve.windowStart ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatMoney(equityCurve.final).replace(/^\+/, "")}
          </p>

          {equityCurve.points.length <= 1 ? (
            <div className="flex-1 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <span className="text-3xl opacity-50">📈</span>
              <p>No trades yet</p>
              <p className="text-xs">Log trades in Journal — curve starts from $0</p>
            </div>
          ) : (
            <div className="flex-1 relative min-h-[240px]">
              <svg
                viewBox="0 0 520 240"
                className="w-full h-full"
                onMouseLeave={() => setHover(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 520;
                  const n = equityCurve.points.length;
                  let best = 0;
                  let bestDist = Infinity;
                  for (let i = 0; i < n; i++) {
                    const px = 50 + (i / (n - 1 || 1)) * 450;
                    const d = Math.abs(px - x);
                    if (d < bestDist) {
                      bestDist = d;
                      best = i;
                    }
                  }
                  setHover(best);
                }}
              >
                {(() => {
                  const pts = equityCurve.points;
                  const n = pts.length;
                  const range = equityCurve.max - equityCurve.min || 1;
                  const toX = (i) => 50 + (i / (n - 1 || 1)) * 450;
                  const toY = (v) => 20 + ((equityCurve.max - v) / range) * 180;

                  let line = `M ${toX(0)} ${toY(pts[0].equity)}`;
                  for (let i = 1; i < n; i++) {
                    line += ` H ${toX(i)} V ${toY(pts[i].equity)}`;
                  }
                  const area = `${line} V 200 H ${toX(0)} Z`;

                  const ref = (value) =>
                    value == null ? null : 20 + ((equityCurve.max - value) / range) * 180;

                  return (
                    <>
                      {equityCurve.yTicks.map((tick, i) => (
                        <g key={i}>
                          <line
                            x1="50"
                            x2="500"
                            y1={ref(tick)}
                            y2={ref(tick)}
                            stroke="#1e293b"
                            strokeWidth="1"
                          />
                        </g>
                      ))}

                      {ref(equityCurve.maxLoss) != null && (
                        <line
                          x1="50"
                          x2="500"
                          y1={ref(equityCurve.maxLoss)}
                          y2={ref(equityCurve.maxLoss)}
                          stroke="#f43f5e"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      )}
                      {ref(equityCurve.dailyDd) != null && (
                        <line
                          x1="50"
                          x2="500"
                          y1={ref(equityCurve.dailyDd)}
                          y2={ref(equityCurve.dailyDd)}
                          stroke="#f59e0b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      )}

                      <path d={area} fill="rgba(96, 165, 250, 0.12)" />
                      <path
                        d={line}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        strokeLinejoin="miter"
                        strokeLinecap="butt"
                      />

                      {(() => {
                        const i = hover ?? n - 1;
                        const p = pts[i];
                        return (
                          <circle cx={toX(i)} cy={toY(p.equity)} r="3.5" fill="#e0f2fe" />
                        );
                      })()}
                    </>
                  );
                })()}
              </svg>

              {hover != null && equityCurve.points[hover] && (
                <div className="absolute top-2 right-2 text-xs bg-slate-950/90 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 pointer-events-none">
                  <div>
                    {equityCurve.points[hover].date} {equityCurve.points[hover].time}
                  </div>
                  <div>{equityCurve.points[hover].market || "Equity"}</div>
                  <div>Trade P&L: {formatMoney(equityCurve.points[hover].pnl)}</div>
                  <div>Equity: {formatLevel(equityCurve.points[hover].equity)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="xl:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white mb-1">Quick Actions</h3>
          <Link
            to="/journal"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-center py-2.5 rounded-xl transition text-sm"
          >
            + Log Trade
          </Link>
          <Link
            to="/journal"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-center py-2.5 rounded-xl transition text-sm border border-slate-700"
          >
            View Journal
          </Link>
          <Link
            to="/weekly-analysis"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-center py-2.5 rounded-xl transition text-sm border border-slate-700"
          >
            Weekly Analysis
          </Link>
          <Link
            to="/learn"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-center py-2.5 rounded-xl transition text-sm border border-slate-700"
          >
            Learn
          </Link>
          <p className="text-xs text-slate-500 mt-auto pt-3 italic border-t border-slate-800">
            “The market rewards patience, not prediction.”
            <span className="block text-slate-600 mt-1">— AB Sniper</span>
          </p>
        </div>
      </div>

      {/* Watchlist – below the equity curve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Watchlist</h3>
          <span className="text-xs text-slate-500">Prices 0.00</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {watchlistSymbols.map((w) => (
            <div
              key={w.symbol}
              className="flex items-center justify-between text-sm py-2.5 px-3 rounded-xl bg-slate-950/50 border border-slate-800"
            >
              <span className="text-slate-300 flex items-center gap-2">
                <span>{w.flag}</span> {w.symbol}
              </span>
              <div className="text-right">
                <span className="text-slate-500 tabular-nums block">0.00</span>
                <span className="text-slate-600 text-xs">0.00%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance + Distribution + Setups + Daily Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Performance Overview */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Performance Overview</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total Trades</p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Net P&L</p>
              <p
                className={`text-lg font-bold ${
                  stats.net >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatMoney(stats.net)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Win Rate</p>
              <p className="text-lg font-bold text-cyan-400">
                {stats.winRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Profit Factor</p>
              <p className="text-lg font-bold text-slate-300">0.00</p>
            </div>
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Trade Distribution</h3>
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full shrink-0"
              style={{
                background:
                  stats.total === 0
                    ? "conic-gradient(#1e293b 0deg 360deg)"
                    : `conic-gradient(
                        #10b981 0deg ${winPct * 3.6}deg,
                        #f43f5e ${winPct * 3.6}deg ${(winPct + lossPct) * 3.6}deg,
                        #64748b ${(winPct + lossPct) * 3.6}deg 360deg
                      )`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-slate-900 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{stats.total}</span>
                <span className="text-[10px] text-slate-500">Trades</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <p className="text-emerald-400">
                Wins <span className="text-slate-400">{stats.wins}</span>
              </p>
              <p className="text-rose-400">
                Losses <span className="text-slate-400">{stats.losses}</span>
              </p>
              <p className="text-slate-400">
                Breakeven <span className="text-slate-500">{stats.be}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Top Performing Setups */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Top Performing Setups</h3>
          {setups.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No setups yet — log trades with a setup name in Journal
            </p>
          ) : (
            <div className="space-y-2">
              {setups.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-sm border-b border-slate-800/80 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-slate-200 font-medium truncate max-w-[120px]">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.n} trades · {s.wr.toFixed(0)}% WR
                    </p>
                  </div>
                  <p
                    className={`font-semibold text-xs ${
                      s.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatMoney(s.pnl)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Trading Plan */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Daily Trading Plan</h3>
            <span className="text-xs text-slate-500">{dateStr}</span>
          </div>
          <div className="space-y-2 flex-1">
            {plan.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => togglePlan(item.id)}
                  className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500/30"
                />
                <span className={item.done ? "line-through text-slate-500" : ""}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="grid grid-cols-1 gap-4">
        {/* Recent Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
            <Link to="/journal" className="text-xs text-emerald-400 hover:underline">
              View All →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              No trades logged yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-2 pr-2 font-medium">Symbol</th>
                    <th className="pb-2 pr-2 font-medium">Dir</th>
                    <th className="pb-2 pr-2 font-medium">Result</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => {
                    const r = parseResult(t.result);
                    return (
                      <tr key={t.id} className="border-b border-slate-800/60">
                        <td className="py-2 pr-2 text-white font-medium">{t.market}</td>
                        <td className="py-2 pr-2">
                          <span
                            className={
                              t.side === "LONG" ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {t.side}
                          </span>
                        </td>
                        <td
                          className={`py-2 pr-2 font-semibold ${
                            r >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {formatMoney(r)}
                        </td>
                        <td className="py-2 text-slate-500">{t.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Latest News placeholder */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Latest News</h3>
          <span className="text-xs text-slate-500">Placeholder · no live feed</span>
        </div>
        <p className="text-xs text-slate-500 text-center py-6">
          News cards will appear here when you connect a news API later.
        </p>
      </div>
    </div>
  );
}

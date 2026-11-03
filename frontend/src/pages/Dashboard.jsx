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

  // Equity curve – starts at $0, flat on no-trade days
  const equityCurve = useMemo(() => {
    if (!trades.length) {
      return {
        points: [{ date: "Start", y: 0, hasTrade: false }],
        max: 100,
        min: 0,
        final: 0,
        yTicks: [0, 100],
        xLabels: [{ idx: 0, label: "Start" }],
      };
    }

    const sorted = [...trades]
      .filter((t) => t.date)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    const byDay = {};
    sorted.forEach((t) => {
      const d = t.date;
      if (!byDay[d]) byDay[d] = 0;
      byDay[d] += parseResult(t.result);
    });

    const days = Object.keys(byDay).sort();
    const firstDay = new Date(days[0] + "T12:00:00");
    const lastDay = new Date(days[days.length - 1] + "T12:00:00");

    const points = [{ date: "Start", y: 0, hasTrade: false }];

    let cumulative = 0;
    const cursor = new Date(firstDay);

    while (cursor <= lastDay) {
      const key = cursor.toISOString().slice(0, 10);
      if (byDay[key] !== undefined) {
        cumulative += byDay[key];
      }
      points.push({
        date: key,
        y: cumulative,
        hasTrade: byDay[key] !== undefined,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const ys = points.map((p) => p.y);
    let max = Math.max(...ys, 0);
    let min = Math.min(...ys, 0);

    const step = 100;
    max = Math.ceil(max / step) * step;
    min = Math.floor(min / step) * step;
    if (max === min) max = min + step;
    if (max === 0 && min === 0) max = 100;

    const yTicks = [];
    for (let v = min; v <= max; v += step) {
      yTicks.push(v);
    }

    const xLabels = [];
    const labelCount = Math.min(8, points.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / (labelCount - 1 || 1)) * (points.length - 1));
      const p = points[idx];
      let label = p.date === "Start" ? "Start" : p.date;
      if (p.date !== "Start") {
        try {
          label = new Date(p.date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } catch {
          /* keep */
        }
      }
      xLabels.push({ idx, label });
    }

    return {
      points,
      max,
      min,
      final: cumulative,
      yTicks,
      xLabels,
    };
  }, [trades]);

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Trading Growth Curve</h3>
              <p className="text-xs text-slate-500 mt-0.5">Starts at $0 · from your Journal trades</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Equity
              </span>
              <span
                className={`font-semibold ${
                  equityCurve.final >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatMoney(equityCurve.final)}
              </span>
            </div>
          </div>

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
                preserveAspectRatio="none"
              >
                <path
                  d={(() => {
                    const range = equityCurve.max - equityCurve.min || 1;
                    const toX = (i) =>
                      50 + (i / (equityCurve.points.length - 1 || 1)) * 450;
                    const toY = (v) =>
                      20 + ((equityCurve.max - v) / range) * 180;

                    let d = `M ${toX(0)} ${toY(0)} `;
                    equityCurve.points.forEach((p, i) => {
                      d += `L ${toX(i)} ${toY(p.y)} `;
                    });
                    d += `L ${toX(equityCurve.points.length - 1)} ${toY(0)} Z`;
                    return d;
                  })()}
                  fill={
                    equityCurve.final >= 0
                      ? "rgba(96, 165, 250, 0.12)"
                      : "rgba(251, 113, 133, 0.12)"
                  }
                />

                {equityCurve.yTicks.map((tick) => {
                  const range = equityCurve.max - equityCurve.min || 1;
                  const y = 20 + ((equityCurve.max - tick) / range) * 180;
                  return (
                    <line
                      key={tick}
                      x1="50"
                      y1={y}
                      x2="500"
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                  );
                })}

                {(() => {
                  const range = equityCurve.max - equityCurve.min || 1;
                  const y = 20 + ((equityCurve.max - 0) / range) * 180;
                  return (
                    <line
                      x1="50"
                      y1={y}
                      x2="500"
                      y2={y}
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                  );
                })()}

                <polyline
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={equityCurve.points
                    .map((p, i) => {
                      const range = equityCurve.max - equityCurve.min || 1;
                      const x =
                        50 +
                        (i / (equityCurve.points.length - 1 || 1)) * 450;
                      const y = 20 + ((equityCurve.max - p.y) / range) * 180;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {(() => {
                  const range = equityCurve.max - equityCurve.min || 1;
                  const y = 20 + ((equityCurve.max - 0) / range) * 180;
                  return (
                    <circle
                      cx="50"
                      cy={y}
                      r="4"
                      fill="#94a3b8"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  );
                })()}

                {(() => {
                  const last = equityCurve.points[equityCurve.points.length - 1];
                  const range = equityCurve.max - equityCurve.min || 1;
                  const x = 50 + 450;
                  const y = 20 + ((equityCurve.max - last.y) / range) * 180;
                  return (
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#60a5fa"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  );
                })()}
              </svg>

              <div className="absolute left-0 top-[20px] bottom-[40px] w-12 flex flex-col justify-between text-[10px] text-slate-500 pointer-events-none">
                {[...equityCurve.yTicks].reverse().map((tick) => (
                  <span key={tick} className="leading-none">
                    {tick >= 0 ? `$${tick}` : `-$${Math.abs(tick)}`}
                  </span>
                ))}
              </div>

              <div className="absolute bottom-1 left-[50px] right-[20px] flex justify-between text-[10px] text-slate-500">
                {equityCurve.xLabels.map((l, i) => (
                  <span key={i}>{l.label}</span>
                ))}
              </div>
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

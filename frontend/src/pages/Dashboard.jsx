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
  { symbol: "GBPUSD", flag: "🇬🇧" },
  { symbol: "EURUSD", flag: "🇪🇺" },
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

  const calendar = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
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
    for (let d = 1; d <= last.getDate(); d++) {
      const pnl = byDay[d];
      let status = "none";
      if (pnl !== undefined) status = pnl > 0 ? "win" : pnl < 0 ? "loss" : "flat";
      cells.push({ day: d, status, pnl });
    }
    const profitable = Object.values(byDay).filter((v) => v > 0).length;
    const losing = Object.values(byDay).filter((v) => v < 0).length;
    const traded = Object.keys(byDay).length;
    return {
      label: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      cells,
      profitable,
      losing,
      noTrade: last.getDate() - traded,
      monthPnl: Object.values(byDay).reduce((s, v) => s + v, 0),
    };
  }, [trades, now]);

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

      {/* Chart placeholder + Watchlist + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Chart area */}
        <div className="xl:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-h-[280px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">XAUUSD</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">1h</span>
            </div>
            <span className="text-xs text-slate-500">Chart · no live feed</span>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <span className="text-3xl opacity-50">📉</span>
            <p>Price chart placeholder</p>
            <p className="text-xs">Connect a chart widget or broker later</p>
          </div>
        </div>

        {/* Watchlist */}
        <div className="xl:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Watchlist</h3>
            <span className="text-xs text-slate-500">Prices 0.00</span>
          </div>
          <div className="space-y-2">
            {watchlistSymbols.map((w) => (
              <div
                key={w.symbol}
                className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/80 last:border-0"
              >
                <span className="text-slate-300 flex items-center gap-2">
                  <span>{w.flag}</span> {w.symbol}
                </span>
                <span className="text-slate-500 tabular-nums">0.00</span>
                <span className="text-slate-600 text-xs w-12 text-right">0.00%</span>
              </div>
            ))}
          </div>
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

      {/* Recent Trades + Calendar + Monthly P&L summary */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Recent Trades */}
        <div className="xl:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
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

        {/* Monthly Calendar */}
        <div className="xl:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Monthly Calendar</h3>
          <p className="text-xs text-slate-500 mb-2">{calendar.label}</p>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-slate-500 mb-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendar.cells.map((cell, i) =>
              cell === null ? (
                <div key={`e-${i}`} className="aspect-square" />
              ) : (
                <div
                  key={cell.day}
                  className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium ${
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
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-400">
            <span>● Profit {calendar.profitable}</span>
            <span>● Loss {calendar.losing}</span>
            <span>● None {calendar.noTrade}</span>
          </div>
        </div>

        {/* Monthly P&L summary */}
        <div className="xl:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-3">Monthly P&L</h3>
          <p
            className={`text-2xl font-bold ${
              calendar.monthPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatMoney(calendar.monthPnl)}
          </p>
          <p className="text-xs text-slate-500 mt-1">From logged journal trades</p>
          <div className="mt-auto pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Best day</span>
              <span className="text-slate-300">$0.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Worst day</span>
              <span className="text-slate-300">$0.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Avg. trade</span>
              <span className="text-slate-300">
                {stats.total ? formatMoney(stats.net / stats.total) : "$0.00"}
              </span>
            </div>
          </div>
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

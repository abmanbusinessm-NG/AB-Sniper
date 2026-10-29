import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const stats = [
    { label: "Total P&L", value: "$0.00", sub: "Start logging trades", color: "text-emerald-400" },
    { label: "Win Rate", value: "—", sub: "No data yet", color: "text-cyan-400" },
    { label: "Trades Logged", value: "0", sub: "Add your first one", color: "text-violet-400" },
    { label: "Best Day", value: "—", sub: "Coming soon", color: "text-amber-400" },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          {user ? `Hey ${user.name.split(" ")[0]}, ready to trade smarter?` : "Dashboard"}
        </h1>
        <p className="text-slate-400 mt-2">Your performance snapshot lives here.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition"
          >
            <p className="text-sm text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions + placeholders */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-8 h-72 flex flex-col items-center justify-center">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-slate-300 font-medium">Equity curve coming soon</p>
          <p className="text-slate-500 text-sm mt-1">Log a few trades and it will appear here</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Quick start</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              The fastest way to improve is to start recording. One honest trade at a time.
            </p>
          </div>
          <Link
            to="/add-trade"
            className="mt-6 inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 rounded-xl transition"
          >
            + Log a Trade
          </Link>
        </div>
      </div>
    </div>
  );
}
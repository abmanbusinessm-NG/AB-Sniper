import { Link } from "react-router-dom";

const mockTrades = [
  { id: 1, symbol: "EURUSD", type: "Long", entry: 1.0845, exit: 1.0892, pnl: 470, date: "2026-10-24", status: "Win" },
  { id: 2, symbol: "XAUUSD", type: "Short", entry: 2650.2, exit: 2641.8, pnl: 840, date: "2026-10-23", status: "Win" },
  { id: 3, symbol: "NAS100", type: "Long", entry: 18240, exit: 18110, pnl: -650, date: "2026-10-22", status: "Loss" },
];

export default function Trades() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Your Trades</h2>
          <p className="text-slate-400 mt-1">Every trade tells a story. Review them here.</p>
        </div>
        <Link
          to="/add-trade"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-500/20"
        >
          + Add Trade
        </Link>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-400">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Date</th>
                <th className="text-left px-6 py-4 font-medium">Symbol</th>
                <th className="text-left px-6 py-4 font-medium">Type</th>
                <th className="text-right px-6 py-4 font-medium">Entry</th>
                <th className="text-right px-6 py-4 font-medium">Exit</th>
                <th className="text-right px-6 py-4 font-medium">P&L</th>
                <th className="text-center px-6 py-4 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 text-slate-300">{t.date}</td>
                  <td className="px-6 py-4 font-semibold text-white">{t.symbol}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        t.type === "Long"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">{t.entry}</td>
                  <td className="px-6 py-4 text-right text-slate-300">{t.exit}</td>
                  <td
                    className={`px-6 py-4 text-right font-semibold ${
                      t.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.pnl >= 0 ? "+" : ""}${t.pnl}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        t.status === "Win"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
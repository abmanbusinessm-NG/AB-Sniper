export default function Analytics() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white">Analytics</h2>
        <p className="text-slate-400 mt-1">The numbers that actually matter.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 h-64 flex flex-col items-center justify-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-300 font-medium">Performance charts</p>
          <p className="text-slate-500 text-sm mt-1">Coming after you log real trades</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 h-64 flex flex-col items-center justify-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-slate-300 font-medium">Setup breakdown</p>
          <p className="text-slate-500 text-sm mt-1">Win rate by strategy & session</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <p className="text-slate-300">
          Log at least 20–30 trades and this page will start showing powerful insights.
        </p>
      </div>
    </div>
  );
}
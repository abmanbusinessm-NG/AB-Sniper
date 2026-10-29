export default function AddTrade() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Log a Trade</h2>
        <p className="text-slate-400 mt-1">Be honest. This is how you get better.</p>
      </div>

      <form className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Symbol</label>
            <input
              type="text"
              placeholder="EURUSD"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Direction</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition">
              <option>Long</option>
              <option>Short</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Entry Price</label>
            <input
              type="number"
              step="any"
              placeholder="1.0845"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Exit Price</label>
            <input
              type="number"
              step="any"
              placeholder="1.0892"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Position Size</label>
            <input
              type="number"
              placeholder="1.0"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date</label>
            <input
              type="date"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Notes / Lesson</label>
          <textarea
            rows="4"
            placeholder="What did you feel? What did you learn?"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none transition"
          ></textarea>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-7 py-3 rounded-xl font-semibold transition shadow-lg shadow-emerald-500/20"
          >
            Save Trade
          </button>
          <button
            type="button"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-7 py-3 rounded-xl font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
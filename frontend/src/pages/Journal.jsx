export default function Journal() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white">Trading Journal</h2>
        <p className="text-slate-400 mt-1">Thoughts, emotions, and lessons — written down.</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center min-h-[320px]">
        <div className="text-5xl mb-4">📓</div>
        <p className="text-slate-300 font-medium text-lg">No entries yet</p>
        <p className="text-slate-500 text-sm mt-2 max-w-md text-center">
          After you start logging trades, you’ll be able to write deeper reflections here.
        </p>
      </div>
    </div>
  );
}
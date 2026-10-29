import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
      <nav className="relative border-b border-slate-800/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">
            <span className="text-emerald-400">Trade</span>
            <span className="text-white">Vibe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-300 hover:text-white transition px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-full font-semibold transition shadow-lg shadow-emerald-500/25"
            >
              Join the Vibe
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-emerald-500/20">
          🔥 Built for traders who actually want to improve
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          Stop guessing.
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Start journaling.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          TradeVibe is the journal that feels alive. Track trades, spot your patterns,
          and build real consistency — without the boring spreadsheet vibes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-semibold text-lg transition shadow-xl shadow-emerald-500/30"
          >
            Start Free →
          </Link>
          <Link
            to="/login"
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-medium transition border border-slate-700"
          >
            I already have an account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Log it in seconds",
              desc: "Quick trade entry with notes, emotions and screenshots. No friction.",
              emoji: "⚡",
            },
            {
              title: "See the real numbers",
              desc: "Win rate, R-multiples, best days and setups — clear and honest.",
              emoji: "📊",
            },
            {
              title: "Follow the roadmap",
              desc: "A clear path from beginner to consistent. No more random YouTube rabbit holes.",
              emoji: "🗺️",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-8 transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-5">{item.emoji}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap teaser */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Your path to consistency</h2>
          <p className="text-slate-400">Four stages. Clear focus. Real progress.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {[
            { stage: "01", title: "Foundations", items: ["Risk", "Psychology", "Basics"] },
            { stage: "02", title: "Strategy", items: ["Price Action", "Setups", "Backtesting"] },
            { stage: "03", title: "Execution", items: ["Plan", "Journal", "Discipline"] },
            { stage: "04", title: "Mastery", items: ["Edge", "Mindset", "Scaling"] },
          ].map((item) => (
            <div
              key={item.stage}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition"
            >
              <div className="text-6xl font-black text-slate-800/80 absolute -right-1 -top-3 group-hover:text-emerald-500/10 transition">
                {item.stage}
              </div>
              <h3 className="text-lg font-semibold mb-4 relative">{item.title}</h3>
              <ul className="space-y-2 relative">
                {item.items.map((i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-emerald-500/20 via-slate-900 to-cyan-500/10 border border-emerald-500/20 rounded-[2rem] p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to give your trading a real vibe?
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg">
            Create your free account and start logging trades the right way.
          </p>
          <Link
            to="/register"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-10 py-4 rounded-2xl font-semibold text-lg transition shadow-xl shadow-emerald-500/30"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="font-medium">
            <span className="text-emerald-400">Trade</span>Vibe
          </div>
          <div>Made for traders who are done with random results.</div>
        </div>
      </footer>
    </div>
  );
}
export default function Roadmap() {
  const stages = [
    {
      stage: "01",
      title: "Foundations",
      subtitle: "Build the right mindset and core skills",
      color: "emerald",
      items: [
        { title: "Risk Management", desc: "Position sizing, risk per trade, and capital preservation" },
        { title: "Trading Psychology", desc: "Emotional control, discipline, and avoiding revenge trading" },
        { title: "Market Structure Basics", desc: "Understand how markets move and why" },
        { title: "Journaling Habit", desc: "Start recording every trade with honesty" },
      ],
    },
    {
      stage: "02",
      title: "Strategy Development",
      subtitle: "Find and refine your edge",
      color: "blue",
      items: [
        { title: "Price Action Mastery", desc: "Candlesticks, support/resistance, and order flow basics" },
        { title: "Setup Building", desc: "Create clear, rule-based trading setups" },
        { title: "Backtesting", desc: "Test your strategy properly before risking real money" },
        { title: "Trade Plan Creation", desc: "Write a complete plan you can actually follow" },
      ],
    },
    {
      stage: "03",
      title: "Execution & Discipline",
      subtitle: "Turn knowledge into consistent action",
      color: "violet",
      items: [
        { title: "Pre-Market Routine", desc: "Build a daily process before the market opens" },
        { title: "Trade Checklist", desc: "Never enter a trade without checking your rules" },
        { title: "Emotional Journaling", desc: "Track how you feel before, during, and after trades" },
        { title: "Review Process", desc: "Weekly and monthly performance reviews" },
      ],
    },
    {
      stage: "04",
      title: "Mastery",
      subtitle: "Refine your edge and scale with confidence",
      color: "amber",
      items: [
        { title: "Advanced Analytics", desc: "Deep performance breakdown by setup, day, and session" },
        { title: "Psychology Deep Dive", desc: "Master your inner game at a higher level" },
        { title: "Edge Refinement", desc: "Continuously improve what already works" },
        { title: "Scaling Up", desc: "Increase size only when your process is proven" },
      ],
    },
  ];

  const colorMap = {
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      dot: "bg-emerald-500",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/30",
      dot: "bg-blue-500",
    },
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      border: "border-violet-500/30",
      dot: "bg-violet-500",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dot: "bg-amber-500",
    },
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
  <h2 className="text-3xl font-bold text-white mb-2">Learning Roadmap</h2>
  <p className="text-slate-400 max-w-2xl">
    A clear path from beginner to consistent trader. Focus on one stage at a time.
  </p>
    </div>

      {/* Stages */}
      <div className="space-y-8">
        {stages.map((stage) => {
          const colors = colorMap[stage.color];

          return (
            <div
              key={stage.stage}
              className={`bg-slate-900 border ${colors.border} rounded-2xl overflow-hidden`}
            >
              {/* Stage Header */}
              <div className={`${colors.bg} px-7 py-5 border-b ${colors.border} flex items-center gap-5`}>
                <div className={`text-3xl font-bold ${colors.text}`}>{stage.stage}</div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{stage.title}</h3>
                  <p className="text-sm text-slate-400">{stage.subtitle}</p>
                </div>
              </div>

              {/* Items */}
              <div className="p-7 grid md:grid-cols-2 gap-5">
                {stage.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition"
                  >
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ${colors.dot} shrink-0`}></div>
                    <div>
                      <h4 className="font-medium text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Note */}
      <div className="mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-7 text-center">
        <p className="text-slate-300">
          Progress is not about speed — it’s about consistency. Master one stage before moving to the next.
        </p>
      </div>
    </div>
  );
}
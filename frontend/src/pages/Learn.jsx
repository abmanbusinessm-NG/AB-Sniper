import { useState } from "react";

const MODULES = [
  {
    id: "foundations",
    stage: "01",
    title: "Foundations",
    summary: "What trading really is before you chase setups.",
    lessons: [
      {
        title: "Process over prediction",
        body: "You do not need to know what happens next. You need a repeatable way to decide, size, and review. AB Sniper is built around process: plan, execute, journal, adjust. Prediction without process is gambling with extra steps.",
      },
      {
        title: "Markets are probabilities",
        body: "Every setup is a probability, not a promise. A good trade can lose; a bad trade can win. Judge decisions by whether you followed your rules, not by a single outcome. Long-term edge shows up over many trades, not one hero win.",
      },
      {
        title: "Your job as a trader",
        body: "Define risk before entry. Protect attention. Record what you did and how you felt. Improvement comes from honest data in your journal, not from collecting more indicators.",
      },
    ],
  },
  {
    id: "risk",
    stage: "02",
    title: "Risk and money management",
    summary: "Stay in the game long enough for skill to matter.",
    lessons: [
      {
        title: "Risk per trade",
        body: "Decide a fixed fraction of equity you are willing to lose if the stop hits—often 0.5% to 1% while learning, rarely more than 1 to 2% even when experienced. Position size follows stop distance, not hope.",
      },
      {
        title: "Stops are part of the plan",
        body: "Place the stop where the idea is invalid, not where the pain feels comfortable. Moving stops further to avoid being wrong turns planned risk into open-ended risk. If price hits your level, the trade idea failed—exit and review.",
      },
      {
        title: "Drawdown is normal",
        body: "Even a solid edge spends time in drawdown. Define a personal circuit breaker: for example, stop trading for the day after 2 to 3 full losses, or pause the week after a set percent drawdown. Survival is a skill.",
      },
    ],
  },
  {
    id: "psychology",
    stage: "03",
    title: "Psychology and discipline",
    summary: "The hardest chart to read is your own behaviour.",
    lessons: [
      {
        title: "FOMO and revenge",
        body: "FOMO pushes you in late. Revenge pushes you back in after a loss to get it back. Both ignore the plan. If you feel urgency or anger, step away for one full candle or one full session before the next decision.",
      },
      {
        title: "Overtrading",
        body: "More trades do not equal more skill. Cap the number of attempts per day or week. Quality setups are rare; forcing trades fills the journal with noise and drains focus.",
      },
      {
        title: "Use the journal as a mirror",
        body: "Tag emotions on each trade (patient, tilted, rushed). Patterns in mood often explain patterns in results. Weekly Analysis is where you turn those tags into one concrete focus for the next week.",
      },
    ],
  },
  {
    id: "structure",
    stage: "04",
    title: "Market structure (practical)",
    summary: "Simple language for what price is doing.",
    lessons: [
      {
        title: "Trend vs range",
        body: "In a trend, price makes progress in one direction with pullbacks. In a range, price oscillates between clear highs and lows. Your bias and setup type should match the environment—continuation ideas in trends, mean-reversion ideas more carefully in ranges.",
      },
      {
        title: "Levels that matter",
        body: "Prior day high and low, session open, obvious swing highs and lows, and areas where price reacted more than once. Mark a few clean levels. Clutter is the enemy. Weekly levels deserve more respect than random intraday noise.",
      },
      {
        title: "Liquidity and stops (concept)",
        body: "Stops cluster beyond obvious highs and lows. Price often probes those areas before a real move. You do not need complex jargon—just know that the obvious place everyone defends can be probed before expansion. Wait for your confirmation rules instead of guessing the probe.",
      },
    ],
  },
  {
    id: "setups",
    stage: "05",
    title: "Setups and execution",
    summary: "Fewer setups, clearer rules, cleaner journal.",
    lessons: [
      {
        title: "Build a small playbook",
        body: "Pick one or two setups you can describe in three sentences: context, trigger, invalidation. Name them in the journal (for example, liquidity sweep plus displacement). Named setups make performance review possible.",
      },
      {
        title: "Checklist before entry",
        body: "Bias defined? Level relevant? Risk sized? News checked? If any answer is no, skip. A skipped trade is often a win for discipline. Your Daily Review checklist exists for this reason.",
      },
      {
        title: "Execution quality",
        body: "Score yourself after the session—not on profit alone, but on whether entries matched the plan. A green day with broken rules is still a process loss. A red day with perfect rules is data, not failure.",
      },
    ],
  },
  {
    id: "journal",
    stage: "06",
    title: "Journaling the AB Sniper way",
    summary: "How to use this app so learning compounds.",
    lessons: [
      {
        title: "Log every intentional trade",
        body: "Market, setup name, side, risk, result, plan followed yes or no. Optional notes for context. Consistency of logging beats perfect formatting. Empty journal days should mean no trade, not forgot to write.",
      },
      {
        title: "Weekly Analysis",
        body: "Once a week: bias, key levels, risk plan, focus. Attach screenshots if they help. This is your contract with next week—short, specific, reviewable.",
      },
      {
        title: "Review loops",
        body: "Use the calendar and stats to find best setups and worst habits. Change one variable at a time (for example, no trades in the first 15 minutes). Learning is deliberate adjustment, not random strategy hopping.",
      },
    ],
  },
];

export default function Learn() {
  const [openId, setOpenId] = useState(MODULES[0].id);
  const [openLesson, setOpenLesson] = useState(`${MODULES[0].id}-0`);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Learn</h2>
        <p className="text-slate-400 mt-1 max-w-2xl">
          A practical path—not hype. Read in order if you are new; jump to what
          you need if you already trade. Nothing here is financial advice; it is
          process education for disciplined decision-making.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setOpenId(m.id);
              setOpenLesson(`${m.id}-0`);
            }}
            className={`text-left rounded-2xl border p-3 transition ${
              openId === m.id
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
              Stage {m.stage}
            </p>
            <p className="text-sm font-semibold text-white mt-1 leading-snug">
              {m.title}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {MODULES.map((mod) => {
          const isOpen = openId === mod.id;
          return (
            <section
              key={mod.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : mod.id)}
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-800/40 transition"
              >
                <span className="text-2xl font-black text-slate-700 tabular-nums">
                  {mod.stage}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">{mod.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{mod.summary}</p>
                </div>
                <span className="text-slate-500 text-sm shrink-0">
                  {isOpen ? "▴" : "▾"}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-2 border-t border-slate-800 pt-4">
                  {mod.lessons.map((lesson, i) => {
                    const key = `${mod.id}-${i}`;
                    const lessonOpen = openLesson === key;
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenLesson(lessonOpen ? null : key)
                          }
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <span className="text-sm font-medium text-slate-200">
                            {lesson.title}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {lessonOpen ? "Hide" : "Read"}
                          </span>
                        </button>
                        {lessonOpen && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {lesson.body}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          How to use this with the app
        </h3>
        <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
          <li>
            After studying Risk, set your max loss in{" "}
            <span className="text-slate-300">Weekly Analysis</span>.
          </li>
          <li>
            Log every planned trade in{" "}
            <span className="text-slate-300">Journal</span> with a setup name.
          </li>
          <li>
            Use <span className="text-slate-300">Daily Review</span> checklists
            so discipline is visible, not assumed.
          </li>
          <li>
            Revisit one module per week when your calendar shows repeated
            mistakes.
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          Educational content only. Trading involves risk of loss. AB Sniper does
          not provide investment advice.
        </p>
      </div>
    </div>
  );
}
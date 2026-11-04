import { useEffect, useMemo, useState } from "react";

const KEY = "ab_sniper_money_v1";

const PROP_STATUSES = [
  "Challenge Purchased",
  "Phase 1",
  "Phase 2",
  "Funded",
  "Failed",
  "Breached",
  "Inactive",
];
const ACCOUNT_TYPES = ["1-Step", "2-Step", "3-Step", "Instant Funding"];
const SIZES = [2500, 5000, 10000, 25000, 50000, 100000];
const LIVE_STATUSES = ["Active", "Completed", "Lost", "Withdrawn"];

const empty = () => ({
  id: "",
  kind: "prop",
  name: "",
  date: new Date().toISOString().slice(0, 10),
  accountType: "2-Step",
  accountSize: 10000,
  customSize: false,
  amount: "",
  currency: "USD",
  status: "Challenge Purchased",
  reachedFunded: false,
  receivedPayout: false,
  payout: "",
  payoutDate: "",
  plan: "",
  objective: "",
  risk: "",
  target: "",
  planSucceeded: false,
  withdrawn: "",
  balance: "",
  notes: "",
});

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function money(n, ccy) {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy === "USDT" ? "USD" : ccy,
    }).format(v);
  } catch {
    return `${ccy} ${v.toFixed(2)}`;
  }
}

export default function MoneyManagement() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty());
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [ccy, setCcy] = useState("USD");
  const [preset, setPreset] = useState("all");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [notice, setNotice] = useState("");

  useEffect(() => setRows(load()), []);

  function saveRows(next) {
    setRows(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  const range = useMemo(() => {
    const now = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    if (preset === "month") {
      const a = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const b = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      return { from: iso(a), to: iso(b) };
    }
    if (preset === "last") {
      const a = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const b = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { from: iso(a), to: iso(b) };
    }
    if (preset === "year") {
      return { from: `${now.getUTCFullYear()}-01-01`, to: `${now.getUTCFullYear()}-12-31` };
    }
    if (preset === "custom") return { from, to };
    return { from: "2000-01-01", to: "2100-01-01" };
  }, [preset, from, to]);

  const currencies = [...new Set(rows.map((r) => r.currency))].sort();
  const active = currencies.includes(ccy) ? ccy : currencies[0] || "USD";

  const scoped = rows.filter(
    (r) => r.currency === active && r.date >= range.from && r.date <= range.to
  );
  const props = scoped.filter((r) => r.kind === "prop");
  const live = scoped.filter((r) => r.kind === "live");
  const propSpent = props.reduce((s, r) => s + Number(r.amount || 0), 0);
  const liveDep = live.reduce((s, r) => s + Number(r.amount || 0), 0);
  const invested = propSpent + liveDep;
  const payouts = props.reduce(
    (s, r) => s + (r.receivedPayout ? Number(r.payout || 0) : 0),
    0
  );
  const withdrawals = live.reduce(
    (s, r) => s + (r.status === "Withdrawn" ? Number(r.withdrawn || 0) : 0),
    0
  );
  const recovered = payouts + withdrawals;
  const net = recovered - invested;
  const funded = props.filter((r) => r.reachedFunded).length;
  const paid = props.filter((r) => r.receivedPayout).length;

  const visible = scoped.filter((r) => {
    if (type !== "all" && r.kind !== type) return false;
    return `${r.name} ${r.notes} ${r.plan}`.toLowerCase().includes(q.toLowerCase());
  });

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSave(e) {
    e.preventDefault();
    const row = {
      ...form,
      id: form.id || `${Date.now()}`,
      amount: Number(form.amount || 0),
      payout: form.receivedPayout ? Number(form.payout || 0) : 0,
      withdrawn: Number(form.withdrawn || 0),
      accountSize: form.customSize ? Number(form.accountSize || 0) : Number(form.accountSize),
      currency: (form.currency || "USD").toUpperCase(),
    };
    const next = form.id ? rows.map((r) => (r.id === form.id ? row : r)) : [row, ...rows];
    saveRows(next);
    setOpen(false);
    setNotice(form.id ? "Updated." : "Saved on this browser.");
  }

  function edit(r) {
    setForm({ ...empty(), ...r, customSize: !SIZES.includes(Number(r.accountSize)) });
    setOpen(true);
  }

  function remove(id) {
    if (!confirm("Delete this record?")) return;
    saveRows(rows.filter((r) => r.id !== id));
  }

  const box = "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Money Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Prop purchases and live deposits are cash spent. Payouts are separate and are not counted twice.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(empty());
            setOpen(true);
          }}
          className="bg-emerald-500 text-slate-950 font-semibold rounded-full px-5 py-3"
        >
          + Add Investment
        </button>
      </div>

      {notice && <p className="text-emerald-300 text-sm">{notice}</p>}

      <div className="flex flex-wrap gap-3">
        <select className={box} value={preset} onChange={(e) => setPreset(e.target.value)}>
          <option value="month">This month</option>
          <option value="last">Last month</option>
          <option value="year">This year</option>
          <option value="all">All time</option>
          <option value="custom">Custom range</option>
        </select>
        {preset === "custom" && (
          <>
            <input type="date" className={box} value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className={box} value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
        <select className={box} value={active} onChange={(e) => setCcy(e.target.value)}>
          {(currencies.length ? currencies : ["USD"]).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {[
          ["Total money invested", money(invested, active)],
          ["Prop firm purchases", money(propSpent, active)],
          ["Live trading deposits", money(liveDep, active)],
          ["Payouts received", money(payouts, active)],
          ["Money recovered", money(recovered, active)],
          ["Net position", money(net, active)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400">
        Funded {funded}/{props.length || 0} · Payouts {paid}/{props.length || 0} · Recovery{" "}
        {invested ? `${((payouts / invested) * 100).toFixed(1)}%` : "—"}
        {currencies.length > 1 ? " · Currencies are not added together." : ""}
      </p>

      <div className="flex flex-wrap gap-3">
        <input className={box} placeholder="Search firm or broker" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={box} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="prop">Prop firm accounts</option>
          <option value="live">Live deposits</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-slate-400 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th>Type</th>
              <th>Name</th>
              <th>Invested</th>
              <th>Funded</th>
              <th>Payout</th>
              <th>Plan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-slate-500">
                  No records yet.
                </td>
              </tr>
            )}
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <td className="p-3">{r.date}</td>
                <td>{r.kind === "prop" ? "Prop" : "Live"}</td>
                <td>{r.name}</td>
                <td>{money(r.amount, r.currency)}</td>
                <td>{r.kind === "prop" ? (r.reachedFunded ? "Yes" : "No") : "—"}</td>
                <td>{r.kind === "prop" ? (r.receivedPayout ? money(r.payout, r.currency) : "No") : "—"}</td>
                <td>{r.kind === "live" ? (r.planSucceeded ? "Yes" : "No") : "—"}</td>
                <td className="space-x-3 p-3">
                  <button type="button" className="text-emerald-400" onClick={() => edit(r)}>
                    Edit
                  </button>
                  <button type="button" className="text-rose-400" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
          <form onSubmit={onSave} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between">
              <h2 className="font-semibold">{form.id ? "Edit" : "Add"} investment</h2>
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            {!form.id && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={`rounded-xl py-2 border ${form.kind === "prop" ? "border-emerald-400 text-emerald-300" : "border-slate-700"}`} onClick={() => set("kind", "prop")}>
                  Prop firm account
                </button>
                <button type="button" className={`rounded-xl py-2 border ${form.kind === "live" ? "border-emerald-400 text-emerald-300" : "border-slate-700"}`} onClick={() => set("kind", "live")}>
                  Live trading deposit
                </button>
              </div>
            )}
            <input required className={box} placeholder={form.kind === "prop" ? "Prop firm name" : "Broker name"} value={form.name} onChange={(e) => set("name", e.target.value)} />
            <input required type="date" className={box} value={form.date} onChange={(e) => set("date", e.target.value)} />
            <input required type="number" min="0" step="0.01" className={box} placeholder={form.kind === "prop" ? "Purchase price" : "Deposit amount"} value={form.amount} onChange={(e) => set("amount", e.target.value)} />
            <input className={box} placeholder="Currency (USD)" value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            {form.kind === "prop" ? (
              <>
                <select className={box} value={form.accountType} onChange={(e) => set("accountType", e.target.value)}>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <select
                  className={box}
                  value={form.customSize ? "custom" : String(form.accountSize)}
                  onChange={(e) => {
                    if (e.target.value === "custom") set("customSize", true);
                    else {
                      set("customSize", false);
                      set("accountSize", Number(e.target.value));
                    }
                  }}
                >
                  {SIZES.map((n) => (
                    <option key={n} value={n}>
                      ${n.toLocaleString()}
                    </option>
                  ))}
                  <option value="custom">Custom amount</option>
                </select>
                {form.customSize && (
                  <input type="number" min="1" className={box} placeholder="Custom account size" value={form.accountSize} onChange={(e) => set("accountSize", e.target.value)} />
                )}
                <select className={box} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {PROP_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={form.reachedFunded} onChange={(e) => set("reachedFunded", e.target.checked)} />
                  Reached funded stage
                </label>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={form.receivedPayout} onChange={(e) => set("receivedPayout", e.target.checked)} />
                  Received payout
                </label>
                {form.receivedPayout && (
                  <>
                    <input type="number" min="0" step="0.01" className={box} placeholder="Total payout" value={form.payout} onChange={(e) => set("payout", e.target.value)} />
                    <input type="date" className={box} value={form.payoutDate} onChange={(e) => set("payoutDate", e.target.value)} />
                  </>
                )}
              </>
            ) : (
              <>
                <input className={box} placeholder="Trading plan" value={form.plan} onChange={(e) => set("plan", e.target.value)} />
                <input className={box} placeholder="Objective" value={form.objective} onChange={(e) => set("objective", e.target.value)} />
                <input className={box} placeholder="Risk per trade" value={form.risk} onChange={(e) => set("risk", e.target.value)} />
                <input className={box} placeholder="Target" value={form.target} onChange={(e) => set("target", e.target.value)} />
                <input className={box} placeholder="Account balance (optional)" value={form.balance} onChange={(e) => set("balance", e.target.value)} />
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={form.planSucceeded} onChange={(e) => set("planSucceeded", e.target.checked)} />
                  Plan succeeded
                </label>
                <select className={box} value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {LIVE_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input type="number" min="0" step="0.01" className={box} placeholder="Amount withdrawn" value={form.withdrawn} onChange={(e) => set("withdrawn", e.target.value)} />
              </>
            )}
            <textarea className={box} rows={3} placeholder="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            <button className="w-full bg-emerald-500 text-slate-950 font-semibold rounded-xl py-3">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}

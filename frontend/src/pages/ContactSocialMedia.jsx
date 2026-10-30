import { useState } from "react";

const DEMO_FORM = {
  name: "Alex Mensah",
  email: "alex.demo@example.com",
  topic: "Signal question",
  message:
    "Hi team, I'd like to know which sessions your EURUSD and XAUUSD setups focus on, and whether the strategy works on prop firm accounts.",
};

const TOPICS = [
  "Signal question",
  "Mentorship",
  "Partnership",
  "Technical support",
  "Other",
];

const SOCIALS = [
  { name: "Telegram", handle: "@absniper_signals", url: "https://t.me/absniper_signals", note: "Live setups and trade updates" },
  { name: "Instagram", handle: "@ab.sniper", url: "https://instagram.com/ab.sniper", note: "Chart breakdowns and results" },
  { name: "X", handle: "@ABSniperFX", url: "https://x.com/ABSniperFX", note: "Daily bias and market notes" },
  { name: "YouTube", handle: "AB Sniper FX", url: "https://youtube.com/@absniperfx", note: "Weekly analysis and tutorials" },
  { name: "TikTok", handle: "@absniperfx", url: "https://tiktok.com/@absniperfx", note: "Short trade clips" },
];

const CONTACT = [
  { label: "Email", value: "support@absniper.demo", href: "mailto:support@absniper.demo" },
  { label: "WhatsApp", value: "+251 900 000 000", href: "https://wa.me/251900000000" },
  { label: "Reply time", value: "Within 24 hours, Mon to Fri" },
];

export default function ContactSocialMedia() {
  const [form, setForm] = useState(DEMO_FORM);
  const [sent, setSent] = useState(false);

  const update = (e) => {
    setSent(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = (e) => {
    e.preventDefault();
    // Demo only: replace with a call to your backend, e.g.
    // fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    console.log("Contact form submitted:", form);
    setSent(true);
  };

  const reset = () => {
    setSent(false);
    setForm({ name: "", email: "", topic: TOPICS[0], message: "" });
  };

  return (
    <main className="cs-page">
      <style>{css}</style>

      <header className="cs-head">
        <h1>Contact and social media</h1>
        <p>
          Questions about a setup, your funded account, or working together?
          Send a message or find us where we post trades.
        </p>
      </header>

      <div className="cs-grid">
        <section className="cs-panel" aria-labelledby="msg-title">
          <h2 id="msg-title">Send a message</h2>

          <form onSubmit={submit} className="cs-form">
            <label>
              Your name
              <input name="name" value={form.name} onChange={update} required />
            </label>

            <label>
              Email address
              <input type="email" name="email" value={form.email} onChange={update} required />
            </label>

            <label>
              Topic
              <select name="topic" value={form.topic} onChange={update}>
                {TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>

            <label>
              Message
              <textarea name="message" rows={6} value={form.message} onChange={update} required />
            </label>

            <div className="cs-actions">
              <button type="submit" className="cs-btn">Send message</button>
              <button type="button" className="cs-btn cs-ghost" onClick={reset}>Clear form</button>
            </div>

            {sent && (
              <p className="cs-ok" role="status">
                Message sent. We'll reply to {form.email} within 24 hours.
              </p>
            )}
          </form>
        </section>

        <div className="cs-side">
          <section className="cs-panel" aria-labelledby="direct-title">
            <h2 id="direct-title">Direct contact</h2>
            <dl className="cs-contact">
              {CONTACT.map((c) => (
                <div key={c.label}>
                  <dt>{c.label}</dt>
                  <dd>{c.href ? <a href={c.href}>{c.value}</a> : c.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="cs-panel" aria-labelledby="social-title">
            <h2 id="social-title">Follow us</h2>
            <ul className="cs-social">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <span className="cs-mark" aria-hidden="true">{s.name[0]}</span>
                    <span className="cs-text">
                      <strong>{s.name}</strong>
                      <span>{s.handle}</span>
                      <em>{s.note}</em>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <p className="cs-risk">
        Trading forex carries risk. Nothing on this page is financial advice.
      </p>
    </main>
  );
}

const css = `
.cs-page {
  --bg: transparent;
  --card: #0e1628;
  --field: #0a1120;
  --line: #1d2a44;
  --text: #e6ebf5;
  --muted: #8a97b1;
  --accent: #22d89a;
  --accent-dim: rgba(34, 216, 154, 0.12);
  --danger: #ef5b5b;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px 64px;
  color: var(--text);
  background: var(--bg);
  font-family: inherit;
  line-height: 1.55;
  box-sizing: border-box;
}
.cs-page *, .cs-page *::before, .cs-page *::after { box-sizing: border-box; }

.cs-head { margin-bottom: 28px; max-width: 60ch; }
.cs-head h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); line-height: 1.15; margin: 0 0 10px; letter-spacing: -0.01em; color: #fff; }
.cs-head p { margin: 0; color: var(--muted); }

.cs-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: start; }
.cs-side { display: grid; gap: 20px; }

.cs-panel { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 22px; }
.cs-panel h2 { margin: 0 0 16px; font-size: 1.1rem; color: #fff; }

.cs-form { display: grid; gap: 16px; }
.cs-form label { display: grid; gap: 6px; font-size: 0.85rem; font-weight: 600; color: var(--muted); }
.cs-form input, .cs-form select, .cs-form textarea {
  font: inherit; font-weight: 400; color: var(--text);
  padding: 10px 12px; width: 100%;
  background: var(--field); border: 1px solid var(--line); border-radius: 8px;
  color-scheme: dark;
}
.cs-form textarea { resize: vertical; }
.cs-form input:focus, .cs-form select:focus, .cs-form textarea:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px var(--accent-dim); }
.cs-page a:focus-visible, .cs-page button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.cs-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.cs-btn { font: inherit; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: 1px solid var(--accent); background: var(--accent); color: #04120c; cursor: pointer; }
.cs-btn:hover { filter: brightness(1.1); }
.cs-ghost { background: transparent; color: var(--text); border-color: var(--line); }
.cs-ghost:hover { border-color: var(--danger); color: var(--danger); filter: none; }

.cs-ok { margin: 0; padding: 10px 12px; border-radius: 8px; background: var(--accent-dim); border: 1px solid var(--accent); color: var(--accent); font-size: 0.92rem; }

.cs-contact { margin: 0; display: grid; gap: 14px; }
.cs-contact dt { font-size: 0.8rem; color: var(--muted); }
.cs-contact dd { margin: 0; font-weight: 600; }
.cs-contact a { color: var(--accent); text-decoration: none; }
.cs-contact a:hover { text-decoration: underline; }

.cs-social { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.cs-social a { display: flex; gap: 14px; align-items: center; padding: 10px; border-radius: 8px; text-decoration: none; color: inherit; border: 1px solid transparent; }
.cs-social a:hover { background: var(--accent-dim); border-color: var(--line); }
.cs-mark { flex: none; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent); font-weight: 700; }
.cs-text { display: grid; }
.cs-text strong { color: #fff; }
.cs-text span { color: var(--accent); font-weight: 600; font-size: 0.88rem; }
.cs-text em { font-style: normal; color: var(--muted); font-size: 0.82rem; }

.cs-risk { margin: 28px 0 0; font-size: 0.82rem; color: var(--muted); }

@media (max-width: 820px) { .cs-grid { grid-template-columns: 1fr; } }
`;

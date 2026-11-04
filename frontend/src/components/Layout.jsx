import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/learn", label: "Learn", icon: "📚" },
  { path: "/weekly-analysis", label: "Weekly Analysis", icon: "📊" },
  { path: "/journal", label: "Journal", icon: "📓" },
  { path: "/growth-tracker", label: "Growth Tracker", icon: "📈" }, // ← NEW
  { path: "/money", label: "Money Management", icon: "💰" },
  { path: "/certificate", label: "Certificate", icon: "🎓" },
  { path: "/payout", label: "Payout", icon: "💸" },
  { path: "/contact-social-media", label: "Contact and Social Media", icon: "💬" },
];

export default function Layout() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Open arrow when sidebar is hidden */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          className="fixed top-4 left-3 z-50 h-9 w-9 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shadow-lg transition"
        >
          ›
        </button>
      )}

      {/* Sidebar always fixed — does not reserve page width when closed */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 max-w-[85vw]
          bg-slate-900/95 border-r border-slate-800
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-end px-3 pt-3 pb-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ‹
          </button>
        </div>

        <div className="px-6 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt="AB Sniper"
              className="h-14 w-14 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                <span className="text-emerald-400">AB</span>
                <span className="text-white"> Sniper</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Trade · Learn · Grow</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-0.5">Logged in as</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main uses full width when closed; shifts right when open on desktop */}
      <main
        className={`
          min-h-screen overflow-auto
          bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900
          transition-[padding] duration-300 ease-in-out
          ${open ? "md:pl-64" : "pl-0"}
        `}
      >
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
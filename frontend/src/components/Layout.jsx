import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/learn", label: "Learn", icon: "📚" },
  { path: "/weekly-analysis", label: "Weekly Analysis", icon: "📊" },
  { path: "/journal", label: "Journal", icon: "📓" },
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-emerald-400">Trade</span>
            <span className="text-white">Vibe</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Stay consistent. Stay sharp.</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
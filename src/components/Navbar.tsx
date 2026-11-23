import React, { useState } from "react";
import {
  Award,
  LogOut,
  LogIn,
  TrendingUp,
  FolderGit,
  Shield,
  UserCheck,
  Plus,
  Menu,
  X
} from "lucide-react";
import { UserRole } from "../types";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  } | null;
  currentTab: string;
  activeNavTab?: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  currentTab,
  activeNavTab,
  onChangeTab,
  onLogout
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canViewLeaderboard =
    Boolean(user && (user.role === "Admin" || user.role === "Judge"));
  const resolvedActive = activeNavTab || currentTab;

  const navigate = (tab: string) => {
    setMobileMenuOpen(false);
    onChangeTab(tab);
  };

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }> = [
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
      visible: canViewLeaderboard
    },
    {
      id: "projects",
      label: "Hackathons",
      icon: <FolderGit className="w-4 h-4 shrink-0" />,
      visible: true
    },
    {
      id: "ledger",
      label: "Credentials",
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
      visible: true
    },
    {
      id: "cert-generator",
      label: "Cert Studio",
      icon: <Award className="w-4 h-4 shrink-0" />,
      visible: true
    },
    {
      id: "admin",
      label: "Admin",
      icon: <Shield className="w-4 h-4 shrink-0" />,
      visible: Boolean(user && user.role === "Admin")
    }
  ];

  const visibleNavItems = navItems.filter((item) => item.visible);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Identity */}
          <button
            type="button"
            onClick={() => navigate("projects")}
            className="flex items-center gap-2.5 shrink-0 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg py-1 pr-1"
            aria-label="HackEval Home"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm transition-colors">
              <Award className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-sans font-extrabold text-lg tracking-tight text-slate-900 whitespace-nowrap">
              HackEval
            </span>
          </button>

          {/* Zone 2: Center Typographic Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2 h-full"
          >
            {visibleNavItems.map((item) => {
              const isActive = resolvedActive === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`h-full inline-flex items-center gap-1.5 px-2.5 lg:px-3 text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:bg-slate-50 ${
                    isActive
                      ? "border-indigo-600 text-indigo-700 font-semibold"
                      : "border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300 font-medium"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA + User Profile Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {(!user || user.role !== "Admin") && (
              <button
                type="button"
                onClick={() => navigate("submit-project")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  currentTab === "submit-project"
                    ? "bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Submit Project
              </button>
            )}

            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />

            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                  <span className="font-semibold text-slate-800 max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className={`font-mono font-bold text-[11px] uppercase tracking-wide ${
                      user.role === "Admin"
                        ? "text-rose-700"
                        : user.role === "Judge"
                        ? "text-indigo-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("login")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTab === "login"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {(!user || user.role !== "Admin") && (
              <button
                type="button"
                onClick={() => navigate("submit-project")}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5 shadow-lg">
          {visibleNavItems.map((item) => {
            const isActive = resolvedActive === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    {user.role} · {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("login")}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

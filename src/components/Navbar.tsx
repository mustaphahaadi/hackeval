import React from "react";
import { Award, LogOut, LogIn, TrendingUp, FolderGit, Shield, UserCheck, Globe, Plus } from "lucide-react";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: "Admin" | "Participant";
  } | null;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

export function Navbar({ user, currentTab, onChangeTab, onLogout }: NavbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 text-indigo-600 cursor-pointer" onClick={() => onChangeTab("leaderboard")}>
            <Award className="w-8 h-8 stroke-[2]" />
            <span className="font-sans font-bold text-xl tracking-tight text-slate-900">
              HackEval
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => onChangeTab("leaderboard")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === "leaderboard"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Leaderboard
            </button>

            <button
              onClick={() => onChangeTab("projects")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === "projects"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FolderGit className="w-4 h-4" /> All Projects
            </button>

            <button
              onClick={() => onChangeTab("live-analyzer")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === "live-analyzer"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" /> Live Analyzer
            </button>

            {/* Public Submit Project Button */}
            {(!user || user.role !== "Admin") && (
              <button
                onClick={() => onChangeTab("submit-project")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  currentTab === "submit-project"
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Plus className="w-4 h-4" /> Submit Project
              </button>
            )}

            {user && user.role === "Participant" && (
              <button
                onClick={() => onChangeTab("portal")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentTab === "portal"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-4 h-4" /> Participant Portal
              </button>
            )}

            {user && user.role === "Admin" && (
              <button
                onClick={() => onChangeTab("admin")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentTab === "admin"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield className="w-4 h-4" /> Admin Console
              </button>
            )}
          </nav>

          {/* User Profile / Logout / Login */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === "Admin" 
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Logout from platform"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onChangeTab("login")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all ${
                  currentTab === "login"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="md:hidden flex border-t border-slate-100 divide-x divide-slate-100 bg-white">
        <button
          onClick={() => onChangeTab("leaderboard")}
          className={`flex-1 text-center py-2.5 text-xs font-semibold ${
            currentTab === "leaderboard" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => onChangeTab("projects")}
          className={`flex-1 text-center py-2.5 text-xs font-semibold ${
            currentTab === "projects" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
          }`}
        >
          All Projects
        </button>
        <button
          onClick={() => onChangeTab("live-analyzer")}
          className={`flex-1 text-center py-2.5 text-xs font-semibold ${
            currentTab === "live-analyzer" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
          }`}
        >
          Live Analyzer
        </button>

        {(!user || user.role !== "Admin") && (
          <button
            onClick={() => onChangeTab("submit-project")}
            className={`flex-1 text-center py-2.5 text-xs font-bold ${
              currentTab === "submit-project" ? "text-emerald-700 bg-emerald-50/50" : "text-emerald-600"
            }`}
          >
            Submit
          </button>
        )}

        {user && user.role === "Participant" && (
          <button
            onClick={() => onChangeTab("portal")}
            className={`flex-1 text-center py-2.5 text-xs font-semibold ${
              currentTab === "portal" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
            }`}
          >
            Portal
          </button>
        )}

        {user && user.role === "Admin" && (
          <button
            onClick={() => onChangeTab("admin")}
            className={`flex-1 text-center py-2.5 text-xs font-semibold ${
              currentTab === "admin" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
            }`}
          >
            Admin
          </button>
        )}

        {!user && (
          <button
            onClick={() => onChangeTab("login")}
            className={`flex-1 text-center py-2.5 text-xs font-semibold ${
              currentTab === "login" ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"
            }`}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

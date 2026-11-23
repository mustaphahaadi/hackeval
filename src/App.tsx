import React, { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen.js";
import { Navbar } from "./components/Navbar.js";
import { LeaderboardView } from "./components/LeaderboardView.js";
import { AdminDashboard } from "./components/AdminDashboard.js";
import { AnalyticsReport } from "./components/AnalyticsReport.js";
import { ProjectDetailView } from "./components/ProjectDetailView.js";
import { ProjectSubmissionForm } from "./components/ProjectSubmissionForm.js";
import { HackathonDetailView } from "./components/HackathonDetailView.js";
import { CredentialsLedger } from "./components/CredentialsLedger.js";
import { CertificateGeneratorStudio } from "./components/CertificateGeneratorStudio.js";
import { UserRole } from "./types";

import { FolderGit, Search, Calendar, RefreshCw, Shield, AlertCircle } from "lucide-react";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<StoredUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [currentTab, setCurrentTab] = useState<string>("projects");
  const [returnTab, setReturnTab] = useState<string>("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Projects general list states (used for counts per hackathon)
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsError, setProjectsError] = useState("");

  // Hackathon general list + filter states
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<any | null>(null);
  const [preselectedHkIdForSubmit, setPreselectedHkIdForSubmit] = useState<string | null>(null);
  const [hackathonSearch, setHackathonSearch] = useState("");
  const [hackathonStatusFilter, setHackathonStatusFilter] = useState<"all" | "active" | "ended">("all");

  // Validate persisted token on mount so stale/revoked tokens don't leave broken UI
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          return;
        }
        const data = await res.json();
        if (data?.user && active) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        }
      })
      .catch(() => {
        // Keep current session state on transient offline checks
      });
    return () => {
      active = false;
    };
  }, [token]);

  const fetchHackathonsList = async () => {
    setHackathonsLoading(true);
    try {
      const res = await fetch("/api/hackathons");
      if (res.ok) {
        const data = await res.json();
        setHackathons(data);
      }
    } catch (err) {
      console.error("Failed to load hackathons list", err);
    } finally {
      setHackathonsLoading(false);
    }
  };

  const fetchProjectsList = async () => {
    setProjectsError("");
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/projects", { headers });
      if (!res.ok) throw new Error("Failed to load project list.");
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setProjectsError(err.message);
    }
  };

  const handleLoginSuccess = (newToken: string, loggedUser: StoredUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setToken(newToken);
    setUser(loggedUser);
    setCurrentTab(
      loggedUser.role === "Admin" || loggedUser.role === "Judge" ? "leaderboard" : "projects"
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSelectedProjectId(null);
    setSelectedHackathon(null);
    setPreselectedHkIdForSubmit(null);
    if (currentTab === "admin" || currentTab === "leaderboard") {
      setCurrentTab("projects");
    }
  };

  useEffect(() => {
    fetchProjectsList();
    fetchHackathonsList();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const codeParam = params.get("code") || params.get("cert");
    if (tabParam === "ledger" || codeParam) {
      setCurrentTab("ledger");
    }
  }, []);

  const handleSelectProject = (projectId: string, sourceTab?: string) => {
    setReturnTab(sourceTab || currentTab || "projects");
    setSelectedProjectId(projectId);
    setCurrentTab("project-detail");
  };

  const filteredHackathons = hackathons.filter((hk) => {
    const q = hackathonSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (hk.name || "").toLowerCase().includes(q) ||
      (hk.description || "").toLowerCase().includes(q);
    const matchesStatus =
      hackathonStatusFilter === "all" ||
      (hackathonStatusFilter === "active" && Boolean(hk.active)) ||
      (hackathonStatusFilter === "ended" && !hk.active);
    return matchesSearch && matchesStatus;
  });

  const canAccessLeaderboard = user && (user.role === "Admin" || user.role === "Judge");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        user={user}
        currentTab={currentTab}
        activeNavTab={currentTab === "project-detail" ? returnTab : currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setSelectedProjectId(null);
          if (tab === "projects") {
            setSelectedHackathon(null);
          }
          if (tab === "projects" || tab === "leaderboard") {
            fetchProjectsList();
            fetchHackathonsList();
          }
        }}
        onLogout={handleLogout}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedProjectId && currentTab === "project-detail" ? (
          <ProjectDetailView
            projectId={selectedProjectId}
            token={token || ""}
            currentUser={user}
            onBack={() => {
              setSelectedProjectId(null);
              setCurrentTab(returnTab || "projects");
              fetchProjectsList();
            }}
          />
        ) : (
          <>
            {currentTab === "leaderboard" && canAccessLeaderboard && (
              <div className="space-y-8 animate-fade-in">
                <LeaderboardView
                  token={token || ""}
                  currentUser={user}
                  onSelectProject={(projectId) => handleSelectProject(projectId, "leaderboard")}
                />
                <div className="border-t border-slate-200 pt-8">
                  <AnalyticsReport token={token || ""} />
                </div>
              </div>
            )}

            {currentTab === "projects" && (
              <div className="space-y-6 animate-fade-in">
                {selectedHackathon ? (
                  <HackathonDetailView
                    hackathon={selectedHackathon}
                    token={token || ""}
                    currentUser={user}
                    onBack={() => setSelectedHackathon(null)}
                    onSelectProject={(projectId) => handleSelectProject(projectId, "projects")}
                    onSubmitProjectToHackathon={(hackathonId) => {
                      setPreselectedHkIdForSubmit(hackathonId);
                      setCurrentTab("submit-project");
                    }}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 flex items-center gap-2">
                          <FolderGit className="w-7 h-7 text-indigo-600" />
                          All Hackathons
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                          Browse registered hackathons. Select an event to inspect submissions, run audits, or submit a project.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={hackathonSearch}
                            onChange={(e) => setHackathonSearch(e.target.value)}
                            placeholder="Filter hackathons..."
                            className="pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
                          />
                        </div>

                        <div className="inline-flex bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
                          {(["all", "active", "ended"] as const).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setHackathonStatusFilter(status)}
                              className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                                hackathonStatusFilter === status
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {projectsError && (
                      <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{projectsError}</span>
                      </div>
                    )}

                    {hackathonsLoading ? (
                      <div className="flex justify-center py-12">
                        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                      </div>
                    ) : filteredHackathons.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">
                          {hackathons.length === 0
                            ? "No hackathons have been created yet."
                            : "No hackathons match your current filter."}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-sans">
                          {hackathons.length === 0
                            ? "Administrators can launch new hackathon tracks from the Admin Console."
                            : "Try clearing the search input or switching the status filter."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredHackathons.map((hk) => {
                          const hkSubmissionsCount = projects.filter(
                            (p) => p.hackathonId === hk.id
                          ).length;
                          return (
                            <div
                              key={hk.id}
                              onClick={() => setSelectedHackathon(hk)}
                              className={`bg-white border p-6 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md ${
                                hk.active
                                  ? "border-indigo-200 hover:border-indigo-400"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="font-sans font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {hk.name}
                                  </h3>
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                                      hk.active
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                    }`}
                                  >
                                    {hk.active ? "Active" : "Ended"}
                                  </span>
                                </div>

                                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                                  {hk.description}
                                </p>
                              </div>

                              <div className="border-t border-slate-100 mt-5 pt-3.5 flex justify-between items-center text-[11px] font-semibold text-slate-500 font-mono">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {hk.startDate} – {hk.endDate}
                                </span>
                                <span className="bg-slate-100 text-slate-700 font-bold tabular-nums px-2 py-0.5 rounded text-[11px]">
                                  {hkSubmissionsCount}{" "}
                                  {hkSubmissionsCount === 1 ? "entry" : "entries"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentTab === "submit-project" && (
              <div className="max-w-3xl mx-auto py-4 animate-fade-in">
                <ProjectSubmissionForm
                  token={token || ""}
                  currentUser={user}
                  preselectedHackathonId={preselectedHkIdForSubmit}
                  onSuccess={async (hackathonId) => {
                    await fetchProjectsList();
                    await fetchHackathonsList();

                    if (hackathonId) {
                      try {
                        const res = await fetch("/api/hackathons");
                        if (res.ok) {
                          const hks = await res.json();
                          const matched = hks.find((h: any) => h.id === hackathonId);
                          if (matched) {
                            setSelectedHackathon(matched);
                          }
                        }
                      } catch (err) {
                        console.error("Failed to select hackathon after submission", err);
                      }
                    }
                    setCurrentTab("projects");
                    setPreselectedHkIdForSubmit(null);
                  }}
                  onCancel={() => {
                    setCurrentTab("projects");
                    setPreselectedHkIdForSubmit(null);
                  }}
                />
              </div>
            )}

            {currentTab === "ledger" && (
              <div className="space-y-8 animate-fade-in">
                <CredentialsLedger token={token} currentUser={user} />
              </div>
            )}

            {currentTab === "cert-generator" && (
              <div className="space-y-8 animate-fade-in">
                <CertificateGeneratorStudio
                  token={token}
                  currentUser={user}
                  onCertificatesIssued={() => {
                    fetchProjectsList();
                    fetchHackathonsList();
                  }}
                />
              </div>
            )}

            {currentTab === "login" && (
              <div className="max-w-md mx-auto py-4 animate-fade-in">
                <AuthScreen onLoginSuccess={handleLoginSuccess} />
              </div>
            )}

            {currentTab === "admin" &&
              (user && user.role === "Admin" ? (
                <AdminDashboard
                  token={token || ""}
                  onOpenCertStudio={() => setCurrentTab("cert-generator")}
                />
              ) : (
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm animate-fade-in mt-8">
                  <Shield className="w-12 h-12 text-rose-500 mx-auto" />
                  <h3 className="text-lg font-sans font-bold text-slate-900">
                    Administrator Access Required
                  </h3>
                  <p className="text-slate-500 text-sm">
                    The requested management interface is protected. Please sign in with an Administrator account to access the control panel.
                  </p>
                  <button
                    onClick={() => setCurrentTab("login")}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              ))}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            © 2026 HackEval Platform. Engineered for structured hackathon evaluation, transparent rankings, and verifiable credentials.
          </p>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen.js";
import { Navbar } from "./components/Navbar.js";
import { LeaderboardView } from "./components/LeaderboardView.js";
import { AdminDashboard } from "./components/AdminDashboard.js";
import { AnalyticsReport } from "./components/AnalyticsReport.js";
import { ProjectDetailView } from "./components/ProjectDetailView.js";
import { ProjectSubmissionForm } from "./components/ProjectSubmissionForm.js";
import { HackathonDetailView } from "./components/HackathonDetailView.js";

import { 
  FolderGit, Eye, Search, Plus, Award, 
  Sparkles, Star, Calendar, RefreshCw, BarChart2 
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any | null>(JSON.parse(localStorage.getItem("user") || "null"));
  const [currentTab, setCurrentTab] = useState<string>("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Projects general list states
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [searchProjectTerm, setSearchProjectTerm] = useState("");

  // Hackathon general list states
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<any | null>(null);
  const [preselectedHkIdForSubmit, setPreselectedHkIdForSubmit] = useState<string | null>(null);

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

  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setToken(newToken);
    setUser(loggedUser);
    setCurrentTab("leaderboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSelectedProjectId(null);
    setSelectedHackathon(null);
    setPreselectedHkIdForSubmit(null);
  };

  const fetchProjectsList = async () => {
    setProjectsLoading(true);
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
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsList();
    fetchHackathonsList();
  }, [token]);

  // Handle detailed sub-view
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab("project-detail");
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(searchProjectTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchProjectTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        user={user} 
        currentTab={currentTab} 
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setSelectedProjectId(null); // Reset detail stack
          if (tab === "projects") {
            fetchProjectsList();
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
              setCurrentTab("projects"); // Fallback
            }}
          />
        ) : (
          <>
            {currentTab === "leaderboard" && user?.role === "Admin" && (
              <div className="space-y-8 animate-fade-in">
                <LeaderboardView token={token || ""} onSelectProject={handleSelectProject} />
                <div className="border-t border-slate-200 pt-8">
                  <AnalyticsReport token={token || ""} />
                </div>
              </div>
            )}

            {currentTab === "projects" && (
              <div className="space-y-8 animate-fade-in">
                {selectedHackathon ? (
                  <HackathonDetailView
                    hackathon={selectedHackathon}
                    token={token || ""}
                    onBack={() => setSelectedHackathon(null)}
                    onSelectProject={(projectId) => {
                      setSelectedProjectId(projectId);
                      setCurrentTab("project-detail");
                    }}
                    onSubmitProjectToHackathon={(hackathonId) => {
                      setPreselectedHkIdForSubmit(hackathonId);
                      setCurrentTab("submit-project");
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <FolderGit className="w-7 h-7 text-indigo-600" />
                        All Hackathons
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">
                        Browse registered hackathons. Select an event to view its submissions and grade them.
                      </p>
                    </div>

                    {hackathonsLoading ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                      </div>
                    ) : hackathons.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No Hackathon projects have been established yet.</p>
                        <p className="text-xs text-slate-400 mt-1 font-sans">Set one up on-the-fly during project submission or through the Admin Console.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hackathons.map((hk) => {
                          const hkSubmissionsCount = projects.filter(p => p.hackathonId === hk.id).length;
                          return (
                            <div
                              key={hk.id}
                              onClick={() => setSelectedHackathon(hk)}
                              className={`bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md p-6 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                                hk.active ? "border-l-4 border-l-indigo-600" : "border-l-4 border-l-slate-300"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="font-sans font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {hk.name}
                                  </h3>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide whitespace-nowrap ${
                                    hk.active 
                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                      : "bg-slate-50 text-slate-500 border border-slate-200"
                                  }`}>
                                    {hk.active ? "Active" : "Ended"}
                                  </span>
                                </div>
                                
                                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                                  {hk.description}
                                </p>
                              </div>

                              <div className="border-t border-slate-100 mt-5 pt-3.5 flex justify-between items-center text-[10px] font-semibold text-slate-400 font-mono">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {hk.startDate} - {hk.endDate}
                                </span>
                                <span className="bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded text-[10px]">
                                  {hkSubmissionsCount} {hkSubmissionsCount === 1 ? "entry" : "entries"}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xl font-sans font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FolderGit className="w-6 h-6 text-indigo-600" />
                    Submit Hackathon Project
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">
                    Enter your project details, provide a public GitHub repository link, and specify any optional AI Studio links or live endpoints.
                  </p>
                  <ProjectSubmissionForm
                    token={token || ""}
                    preselectedHackathonId={preselectedHkIdForSubmit}
                    onSuccess={async (hackathonId) => {
                      await fetchProjectsList();
                      await fetchHackathonsList();
                      
                      if (hackathonId) {
                        // Load and auto-select this hackathon to show its submissions
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
                          console.error("Failed to re-select hackathon after success", err);
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
              </div>
            )}

            {currentTab === "login" && (
              <div className="max-w-md mx-auto py-4 animate-fade-in">
                <AuthScreen onLoginSuccess={handleLoginSuccess} />
              </div>
            )}

            {currentTab === "admin" && user && user.role === "Admin" && (
              <AdminDashboard token={token || ""} />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 HackEval Platform. Crafted for premium academic innovation and strict grading consistency.</p>
        </div>
      </footer>
    </div>
  );
}

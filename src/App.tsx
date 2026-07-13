import React, { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen.js";
import { Navbar } from "./components/Navbar.js";
import { LeaderboardView } from "./components/LeaderboardView.js";
import { ParticipantPortal } from "./components/ParticipantPortal.js";
import { AdminDashboard } from "./components/AdminDashboard.js";
import { AnalyticsReport } from "./components/AnalyticsReport.js";
import { ProjectDetailView } from "./components/ProjectDetailView.js";
import { LiveAnalyzerView } from "./components/LiveAnalyzerView.js";
import { ProjectSubmissionForm } from "./components/ProjectSubmissionForm.js";

import { 
  FolderGit, Eye, Search, Plus, Award, 
  Sparkles, Star, Calendar, RefreshCw, BarChart2 
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any | null>(JSON.parse(localStorage.getItem("user") || "null"));
  const [currentTab, setCurrentTab] = useState<string>("leaderboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Projects general list states
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [searchProjectTerm, setSearchProjectTerm] = useState("");

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
              setCurrentTab("leaderboard"); // Fallback
            }}
          />
        ) : (
          <>
            {currentTab === "leaderboard" && (
              <div className="space-y-8">
                <LeaderboardView token={token || ""} onSelectProject={handleSelectProject} />
                
                {/* Embedded Quick Analytics Preview */}
                <div className="border-t border-slate-200 pt-8">
                  <AnalyticsReport token={token || ""} />
                </div>
              </div>
            )}

            {currentTab === "projects" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
                      <FolderGit className="w-7 h-7 text-indigo-600" />
                      Hackathon Project Listings
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Explore submissions registered by student developers and universities across all events.
                    </p>
                  </div>

                  <button
                    onClick={fetchProjectsList}
                    disabled={projectsLoading}
                    className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${projectsLoading ? "animate-spin" : ""}`} />
                    Refresh List
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search submissions by project title, team name, language..."
                    value={searchProjectTerm}
                    onChange={(e) => setSearchProjectTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {projectsLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    No submissions match your query. Try another keyword!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProject(p.id)}
                        className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md p-6 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-sans font-bold text-slate-950 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {p.projectName}
                            </h3>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                              p.status === "evaluated"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {p.status === "evaluated" ? "Scored" : "Pending"}
                            </span>
                          </div>
                          
                          <p className="text-slate-500 text-xs font-semibold">
                            Team: {p.teamName}
                          </p>

                          <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                            {p.description}
                          </p>
                        </div>

                        <div className="border-t border-slate-100 mt-5 pt-3 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                          <span className="font-mono">{new Date(p.createdAt).toLocaleDateString()}</span>
                          <span className="text-indigo-600 group-hover:underline flex items-center gap-1">
                            Inspect Details <Eye className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
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
                    onSuccess={() => {
                      setCurrentTab("projects");
                      fetchProjectsList();
                    }}
                    onCancel={() => {
                      setCurrentTab("leaderboard");
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

            {currentTab === "portal" && user && user.role === "Participant" && (
              <ParticipantPortal token={token || ""} currentUser={user} onSelectProject={handleSelectProject} />
            )}

            {currentTab === "admin" && user && user.role === "Admin" && (
              <AdminDashboard token={token || ""} />
            )}

            {currentTab === "live-analyzer" && (
              <LiveAnalyzerView token={token || ""} />
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

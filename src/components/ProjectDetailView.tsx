import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ExternalLink, Github, Sparkles, Star, Award, 
  Layers, PlayCircle, MessageSquare, Send, RefreshCw, SendIcon, ShieldAlert, CheckCircle, ChevronDown, Check, Info, FileText,
  Lock, Shield, GitBranch, GitPullRequest, AlertTriangle, CheckSquare, Square, Globe
} from "lucide-react";
import { ProjectSubmission, GitHubAnalysis, AIEvaluation, JudgeReview, Comment, UserRole } from "../types";

interface ProjectDetailViewProps {
  projectId: string;
  token?: string;
  currentUser: {
    id: string;
    name: string;
    role: UserRole;
  } | null;
  onBack: () => void;
}

export function ProjectDetailView({ projectId, token, currentUser, onBack }: ProjectDetailViewProps) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Comment State
  const [newComment, setNewComment] = useState("");
  const [submitCommentLoading, setSubmitCommentLoading] = useState(false);

  // AI Evaluation states
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalSuccessMsg, setEvalSuccessMsg] = useState("");

  // Live website analyzer states
  const [liveAnalysis, setLiveAnalysis] = useState<any>(null);
  const [liveAnalysisLoading, setLiveAnalysisLoading] = useState(false);
  const [liveAnalysisError, setLiveAnalysisError] = useState("");

  const fetchSavedLiveAnalysis = async (targetUrl: string) => {
    if (!targetUrl) return;
    try {
      const res = await fetch("/api/live-analyses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const matched = list.find((h: any) => h.url.toLowerCase().trim() === targetUrl.toLowerCase().trim() || h.url.toLowerCase().trim().includes(targetUrl.toLowerCase().trim()));
        if (matched) {
          setLiveAnalysis(matched);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch matching live analysis log:", e);
    }
  };

  const handleTriggerLiveAudit = async () => {
    if (!project || !project.liveUrl) return;
    setLiveAnalysisLoading(true);
    setLiveAnalysisError("");
    try {
      const res = await fetch("/api/analyze-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: project.liveUrl })
      });
      if (!res.ok) throw new Error("Server rejected the live web audit request.");
      const data = await res.json();
      setLiveAnalysis(data);
    } catch (err: any) {
      setLiveAnalysisError(err.message || "Failed to analyze website.");
    } finally {
      setLiveAnalysisLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch project submission.");
      const data = await res.json();
      setProject(data);
      
      if (data.liveUrl) {
        fetchSavedLiveAnalysis(data.liveUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId, token]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitCommentLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          content: newComment
        })
      });

      if (!res.ok) throw new Error("Failed to post comment.");
      
      setNewComment("");
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitCommentLoading(false);
    }
  };

  const handleRunAIEvaluation = async () => {
    setEvalLoading(true);
    setError("");
    setEvalSuccessMsg("");

    try {
      const res = await fetch(`/api/evaluate/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI evaluation engine failed.");

      setEvalSuccessMsg("Success! AI scoring has been completed and dynamic composite tables have been updated.");
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 animate-fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 max-w-xl mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Project details not available</h3>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to List
        </button>
      </div>
    );
  }

  const overallScore = project.aiEvaluation ? project.aiEvaluation.overallScore : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        {currentUser?.role === "Admin" && (
          <button
            onClick={handleRunAIEvaluation}
            disabled={evalLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {evalLoading ? "AI Engine Running..." : "Re-run AI Scoring"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium flex gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {evalSuccessMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-700 text-sm rounded-r-lg font-medium flex gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          {evalSuccessMsg}
        </div>
      )}

      {/* Main Grid: Info + Analytics on left, AI metrics + comments on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
                Project Entry Details
              </span>
              <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 tracking-tight">
                {project.projectName}
              </h1>
              <p className="text-slate-500 text-sm font-semibold mt-1 flex items-center gap-1">
                Submitted by Team: <span className="text-indigo-600 font-bold">{project.teamName}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Members: {project.teamMembers}
              </p>
            </div>

            {/* Links bar */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {project.githubUrl && (
                <a 
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <Github className="w-4 h-4" /> Github
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {project.liveUrl && (
                <a 
                  href={project.liveUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Live App
                </a>
              )}
              {project.aiStudioUrl && (
                <a 
                  href={project.aiStudioUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" /> AI Studio App
                </a>
              )}
              {project.demoVideoUrl && (
                <a 
                  href={project.demoVideoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <PlayCircle className="w-4 h-4" /> Pitch Video
                </a>
              )}
              {project.presentationDocName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all">
                  <FileText className="w-4 h-4 text-slate-500" /> {project.presentationDocName}
                </div>
              )}
            </div>

            {/* Core Text fields */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Problem Statement</h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{project.problemStatement}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Proposed Solution & Details</h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>
          </div>

          {/* GitHub Analysis Analytics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-800" />
                Advanced GitHub Engineering Audit
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Analyzed: {project.githubAnalysis ? new Date(project.githubAnalysis.analyzedAt).toLocaleDateString() : "Pending evaluation"}
              </span>
            </div>

            {project.githubAnalysis ? (
              <div className="space-y-8">
                {/* --- ERROR & BOUNDARY CONDITIONS DISPLAY --- */}
                {project.githubAnalysis.errorState === "invalid_url" && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Invalid Repository URL</h4>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        The repository link submitted is invalid or cannot be parsed. Please check the URL format under the project editing portal.
                      </p>
                    </div>
                  </div>
                )}

                {project.githubAnalysis.isPrivate && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">🔒 Private / Inaccessible Repository</h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        This repository is private or does not exist. The platform generated a high-fidelity mock audit to simulate grades. Change your repository on GitHub to <strong>Public</strong> to allow production-grade, live-connected judges to review it.
                      </p>
                    </div>
                  </div>
                )}

                {project.githubAnalysis.isEmpty && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">📭 Empty Repository Detected</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        The repository exists and is public, but it contains no branches, commits, or code assets. Push your code to the main branch to initiate a live audit.
                      </p>
                    </div>
                  </div>
                )}

                {/* --- DUAL RADIAL SCORES / GAUGES --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Repo Health score card */}
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repository Health</span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">Audit Score</h3>
                      <p className="text-xs text-slate-500 mt-1">Based on documentation, structure & activity.</p>
                    </div>
                    <div className="relative flex items-center justify-center h-16 w-16">
                      {/* SVG Circle Gauge */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                        <circle 
                          cx="32" cy="32" r="28" 
                          stroke={
                            (project.githubAnalysis.repoHealthScore || 0) >= 80 ? "#10b981" : 
                            (project.githubAnalysis.repoHealthScore || 0) >= 60 ? "#f59e0b" : "#ef4444"
                          } 
                          strokeWidth="4" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - (project.githubAnalysis.repoHealthScore || 0) / 100)}
                        />
                      </svg>
                      <span className="absolute text-sm font-black font-mono text-slate-950">
                        {project.githubAnalysis.repoHealthScore || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Dev Practice grade card */}
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Developer Practices</span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">Workflow Quality</h3>
                      <p className="text-xs text-slate-500 mt-1">Based on licensing, branch habits, and CI tools.</p>
                    </div>
                    <div className="relative flex items-center justify-center h-16 w-16">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                        <circle 
                          cx="32" cy="32" r="28" 
                          stroke={
                            (project.githubAnalysis.developerPracticeScore || 0) >= 80 ? "#6366f1" : 
                            (project.githubAnalysis.developerPracticeScore || 0) >= 60 ? "#d946ef" : "#f43f5e"
                          } 
                          strokeWidth="4" 
                          fill="transparent" 
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - (project.githubAnalysis.developerPracticeScore || 0) / 100)}
                        />
                      </svg>
                      <span className="absolute text-sm font-black font-mono text-slate-950">
                        {project.githubAnalysis.developerPracticeScore || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- GITHUB STATS LIST GRID --- */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Commits</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">{project.githubAnalysis.commits}</span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5 truncate" title={project.githubAnalysis.commitFrequency}>
                      {project.githubAnalysis.commitFrequency || "Static history"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">PRs / Issues</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
                      {project.githubAnalysis.pullRequests?.total || 0} / {project.githubAnalysis.issues?.total || 0}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                      PRs: <span className="text-emerald-600 font-bold">{project.githubAnalysis.pullRequests?.open || 0} Open</span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Branches</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
                      {project.githubAnalysis.branches?.length || 1}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5 truncate" title={project.githubAnalysis.branches?.join(", ") || "main"}>
                      Primary: {project.githubAnalysis.branches?.[0] || "main"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Stars / Forks</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
                      ⭐ {project.githubAnalysis.stars} / 🍴 {project.githubAnalysis.forks}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-0.5 truncate">
                      License: {project.githubAnalysis.license || "None"}
                    </span>
                  </div>
                </div>

                {/* --- PIPELINE & SECURITY CONFIG CHECKS --- */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${project.githubAnalysis.hasGitignore ? "text-emerald-500" : "text-slate-300"}`} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Git Ignore Shield</span>
                      <span className="text-[10px] text-slate-400">{project.githubAnalysis.hasGitignore ? "Active (.gitignore present)" : "Lacking ignore specs"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${project.githubAnalysis.githubActions?.hasActions ? "text-emerald-500" : "text-slate-300"}`} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">CI/CD Pipelines</span>
                      <span className="text-[10px] text-slate-400 truncate block max-w-44">
                        {project.githubAnalysis.githubActions?.hasActions 
                          ? `${project.githubAnalysis.githubActions.workflows.join(", ")}` 
                          : "No Actions triggers found"
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${project.githubAnalysis.license ? "text-emerald-500" : "text-slate-300"}`} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Compliance License</span>
                      <span className="text-[10px] text-slate-400">{project.githubAnalysis.license ? `${project.githubAnalysis.license} Open Source` : "No LICENSE file parsed"}</span>
                    </div>
                  </div>
                </div>

                {/* --- COGNITIVE PROGRAMMATIC AUDIT OBSERVATIONS --- */}
                {project.githubAnalysis.codeQualityObservations && project.githubAnalysis.codeQualityObservations.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      Engineering & Code Quality Audit Observations
                    </h3>
                    <ul className="space-y-1.5 pl-1.5">
                      {project.githubAnalysis.codeQualityObservations.map((obs: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-600 flex gap-2">
                          <span className="text-indigo-500 font-bold shrink-0">•</span>
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* --- README QUALITY CARD --- */}
                {project.githubAnalysis.readmeQuality && (
                  <div className="border border-slate-200/80 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">README Documentation Quality</h3>
                      </div>
                      <span className="text-xs font-extrabold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        Score: {project.githubAnalysis.readmeQuality.score}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasSetupGuide ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={project.githubAnalysis.readmeQuality.hasSetupGuide ? "text-slate-800 font-semibold" : "text-slate-400"}>
                          Setup / Installation Guide
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasPrerequisites ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={project.githubAnalysis.readmeQuality.hasPrerequisites ? "text-slate-800 font-semibold" : "text-slate-400"}>
                          Prerequisite Declarations
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasArchitectureSection ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={project.githubAnalysis.readmeQuality.hasArchitectureSection ? "text-slate-800 font-semibold" : "text-slate-400"}>
                          Architecture / Layout Overview
                        </span>
                      </div>
                    </div>

                    {project.githubAnalysis.readmeQuality.missingSections.length > 0 && (
                      <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60 text-[11px] text-amber-900 leading-normal">
                        <strong>Missing Documentation elements:</strong> {project.githubAnalysis.readmeQuality.missingSections.join(", ")}. Adding these will elevate documentation clarity.
                      </div>
                    )}
                  </div>
                )}

                {/* Languages usage distribution */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Languages Distribution</h3>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    {Object.entries(project.githubAnalysis.languages || {}).map(([lang, pct]: any, idx) => {
                      const colors = ["bg-indigo-500", "bg-emerald-400", "bg-amber-300", "bg-rose-400", "bg-violet-400"];
                      return (
                        <div
                          key={lang}
                          className={`${colors[idx % colors.length]} h-full`}
                          style={{ width: `${pct}%` }}
                          title={`${lang}: ${pct}%`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {Object.entries(project.githubAnalysis.languages || {}).map(([lang, pct]: any, idx) => {
                      const colors = ["bg-indigo-500", "bg-emerald-400", "bg-amber-300", "bg-rose-400", "bg-violet-400"];
                      return (
                        <div key={lang} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                          <span className="font-semibold">{lang}</span>
                          <span className="text-slate-400 font-mono">({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Structure list */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Workspace Layout & Structure</h3>
                  <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-xl max-h-40 overflow-y-auto border border-slate-800 space-y-1">
                    {project.githubAnalysis.repoStructure?.map((path: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-indigo-400">📄</span>
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No GitHub repository statistics have been fetched for this project. Triggering an evaluation will parse these automatically.
              </div>
            )}
          </div>

          {/* --- LIVE WEBSITE & UX AUDIT CARD --- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-sans font-extrabold text-slate-950 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Live Deployment & UX Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated latency, performance, security headers, and visual accessibility diagnostic checks.
                </p>
              </div>
              {project?.liveUrl && (
                <button
                  onClick={handleTriggerLiveAudit}
                  disabled={liveAnalysisLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${liveAnalysisLoading ? "animate-spin" : ""}`} />
                  {liveAnalysisLoading ? "Auditing App..." : "Audit Now"}
                </button>
              )}
            </div>

            {liveAnalysisError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{liveAnalysisError}</span>
              </div>
            )}

            {!project?.liveUrl ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No active deployed live application URL was supplied for this project submission.
              </div>
            ) : liveAnalysisLoading ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Executing Deep Lighthouse & Gemini UX Audit</h4>
                <p className="text-[10px] text-slate-400 italic max-w-sm mx-auto leading-relaxed">
                  Crawling page references, scanning security response headers, running PageSpeed tests, and compiling diagnostic recommendation guides.
                </p>
              </div>
            ) : liveAnalysis ? (
              <div className="space-y-6 animate-fade-in">
                {/* Score indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "Speed", score: liveAnalysis.performance_score, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "A11y", score: liveAnalysis.accessibility_score, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "SEO", score: liveAnalysis.seo_score, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "UX Flow", score: liveAnalysis.ux_score, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Security", score: liveAnalysis.security_score, color: "text-cyan-600", bg: "bg-cyan-50" },
                    { label: "Mobile", score: liveAnalysis.mobile_responsiveness_score, color: "text-fuchsia-600", bg: "bg-fuchsia-50" }
                  ].map((gauge, i) => (
                    <div key={i} className="border border-slate-100 p-2.5 rounded-xl text-center space-y-1 bg-slate-50/50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{gauge.label}</span>
                      <span className={`text-base font-extrabold font-mono block ${gauge.color}`}>
                        {gauge.score}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Audit summary indicators */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex justify-between items-center text-xs font-mono">
                  <span>Server Status: <span className={liveAnalysis.available ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{liveAnalysis.available ? "ONLINE" : "OFFLINE"}</span></span>
                  <span>Latency: <span className="text-indigo-300 font-bold">{liveAnalysis.responseTimeMs}ms</span></span>
                  <span>Code: <span className="text-amber-400 font-bold">{liveAnalysis.statusCode || "---"}</span></span>
                </div>

                {/* Issues list preview */}
                {liveAnalysis.issues && liveAnalysis.issues.length > 0 ? (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Discovered Compliance & UX Defects ({liveAnalysis.issues.length})
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {liveAnalysis.issues.map((iss: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1.5 hover:bg-slate-100/50 transition-all">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              iss.severity === "high" ? "bg-rose-50 text-rose-700 border-rose-100" :
                              iss.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {iss.severity} Severity
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{iss.type}</span>
                          </div>
                          <p className="font-bold text-slate-800 leading-tight">{iss.message}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{iss.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs italic flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Perfect web compliance score! No issues discovered.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                <Globe className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-700">Live Audit Data Unavailable</h4>
                  <p className="text-slate-400 mt-0.5 max-w-sm mx-auto">
                    Evaluate this submission's deployed website to parse real-time compliance results.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Scoring Cards */}
        <div className="space-y-8">
          {/* AI Scorecard panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h2 className="font-sans font-extrabold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 fill-indigo-200 text-indigo-200 animate-pulse" />
                AI Scorecard Summary
              </h2>
              {project.aiEvaluation && (
                <div className="text-2xl font-black font-mono tracking-tight bg-white/15 px-3 py-1 rounded-lg">
                  {project.aiEvaluation.overallScore}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {project.aiEvaluation ? (
                <>
                  <div className="space-y-4">
                    {/* Dimension list with small progress bars */}
                    {[
                      { label: "Idea Viability", key: "ideaScore", color: "bg-indigo-500" },
                      { label: "Innovation Quotient", key: "innovationScore", color: "bg-pink-500" },
                      { label: "Code Quality & Organization", key: "codeQualityScore", color: "bg-emerald-500" },
                      { label: "Documentation & README", key: "readmeScore", color: "bg-amber-500" },
                      { label: "Fidelity & UX flow", key: "uiScore", color: "bg-teal-500" },
                      { label: "AI Integration Logic", key: "aiUsageScore", color: "bg-violet-500" },
                      { label: "Technical Sophistication", key: "technicalScore", color: "bg-sky-500" },
                    ].map((row) => {
                      const score = project.aiEvaluation[row.key] || 0;
                      return (
                        <div key={row.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{row.label}</span>
                            <span className="font-mono font-bold text-slate-900">{score}/100</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${row.color}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback block */}
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1 mb-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Critique Feedback
                    </h3>
                    <p className="text-xs text-indigo-950 leading-relaxed font-sans">{project.aiEvaluation.feedback}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm space-y-4">
                  <p>This project has not been scored by the AI Evaluation engine yet.</p>
                  {currentUser?.role === "Admin" && (
                    <button
                      onClick={handleRunAIEvaluation}
                      disabled={evalLoading}
                      className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {evalLoading ? "Analyzing Repo..." : "Run AI Analysis now"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Comments Stream */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              Real-time Feedback Thread
            </h2>

            {/* Comment list */}
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {project.comments?.length > 0 ? (
                project.comments.map((comm: any) => (
                  <div key={comm.id} className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{comm.userName}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                        comm.userRole === "Admin" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {comm.userRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{comm.content}</p>
                    <span className="text-[9px] text-slate-400 block pt-0.5 font-mono">
                      {new Date(comm.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No feedback or discussions posted yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Comment box */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a query or review..."
                className="flex-grow px-3 py-1.5 text-xs border border-slate-300 bg-slate-50/50 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={submitCommentLoading || !newComment.trim()}
                className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

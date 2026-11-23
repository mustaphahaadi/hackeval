import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Sparkles,
  Star,
  Award,
  PlayCircle,
  MessageSquare,
  RefreshCw,
  Send as SendIcon,
  ShieldAlert,
  CheckCircle,
  Check,
  Info,
  FileText,
  Lock,
  Shield,
  AlertTriangle,
  CheckSquare,
  Square,
  Globe
} from "lucide-react";
import { Certificate, UserRole } from "../types";
import { CertificateModal } from "./CertificateModal.js";
import { CertificateGeneratorStudio } from "./CertificateGeneratorStudio.js";
import { CredentialCard } from "./CredentialCard.js";

interface ProjectDetailViewProps {
  projectId: string;
  token?: string;
  currentUser: {
    id: string;
    name: string;
    email?: string;
    role: UserRole;
  } | null;
  onBack: () => void;
}

function safeExternalUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function renderFormattedFeedback(text: string) {
  if (!text) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-2 text-xs text-indigo-950 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        if (line.startsWith("### ") || line.startsWith("## ")) {
          return (
            <h4
              key={idx}
              className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 pt-1.5"
            >
              {line.replace(/^#{2,3}\s+/, "")}
            </h4>
          );
        }

        const bulletClean = line.replace(/^[•*-]\s+/, "");
        const boldMatch = bulletClean.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
        if (boldMatch) {
          return (
            <div key={idx} className="flex gap-2">
              <span className="text-indigo-500 font-bold shrink-0">•</span>
              <p>
                <strong className="font-semibold text-indigo-950">{boldMatch[1]}:</strong>{" "}
                <span className="text-indigo-900">{boldMatch[2]}</span>
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className="text-indigo-900">
            {bulletClean}
          </p>
        );
      })}
    </div>
  );
}

export function ProjectDetailView({
  projectId,
  token,
  currentUser,
  onBack
}: ProjectDetailViewProps) {
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

  // Judge manual review states
  const [judgeIdea, setJudgeIdea] = useState(80);
  const [judgeInnovation, setJudgeInnovation] = useState(80);
  const [judgeCodeQuality, setJudgeCodeQuality] = useState(80);
  const [judgeReadme, setJudgeReadme] = useState(80);
  const [judgeUi, setJudgeUi] = useState(80);
  const [judgeAiUsage, setJudgeAiUsage] = useState(80);
  const [judgeTechnical, setJudgeTechnical] = useState(80);
  const [judgeFeedback, setJudgeFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Certificate Modal & Generation State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [generatingCerts, setGeneratingCerts] = useState(false);
  const [showCertBuilder, setShowCertBuilder] = useState(false);

  const canEvaluate = currentUser?.role === "Admin" || currentUser?.role === "Judge";
  const isAdmin = currentUser?.role === "Admin";

  useEffect(() => {
    if (project && project.judgeReviews && currentUser) {
      const myReview = project.judgeReviews.find((r: any) => r.judgeId === currentUser.id);
      if (myReview) {
        setJudgeIdea(myReview.scores?.idea ?? 80);
        setJudgeInnovation(myReview.scores?.innovation ?? 80);
        setJudgeCodeQuality(myReview.scores?.codeQuality ?? 80);
        setJudgeReadme(myReview.scores?.readme ?? 80);
        setJudgeUi(myReview.scores?.ui ?? 80);
        setJudgeAiUsage(myReview.scores?.aiUsage ?? 80);
        setJudgeTechnical(myReview.scores?.technical ?? 80);
        setJudgeFeedback(myReview.feedback ?? "");
      }
    }
  }, [project, currentUser]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewSuccess("");
    setReviewError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          scores: {
            idea: Number(judgeIdea),
            innovation: Number(judgeInnovation),
            codeQuality: Number(judgeCodeQuality),
            readme: Number(judgeReadme),
            ui: Number(judgeUi),
            aiUsage: Number(judgeAiUsage),
            technical: Number(judgeTechnical)
          },
          feedback: judgeFeedback
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit grading.");

      setReviewSuccess("Your judge scorecard has been recorded and synced to rankings.");
      fetchProjectDetails();
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchSavedLiveAnalysis = async (targetUrl: string) => {
    if (!targetUrl || !token) return;
    try {
      const res = await fetch("/api/live-analyses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const matched = list.find(
          (h: any) =>
            h.url.toLowerCase().trim() === targetUrl.toLowerCase().trim() ||
            h.url.toLowerCase().trim().includes(targetUrl.toLowerCase().trim())
        );
        if (matched) {
          setLiveAnalysis(matched);
        }
      }
    } catch {
      // Optional live analysis log lookup
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server rejected the live web audit request.");
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
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/projects/${projectId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch project submission.");
      const data = await res.json();
      setProject(data);

      if (data.liveUrl && token) {
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/comments", {
        method: "POST",
        headers,
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

      setEvalSuccessMsg(
        "AI scoring completed and composite rankings have been updated."
      );
      fetchProjectDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleGenerateProjectCertificates = async () => {
    if (!token) return;
    setGeneratingCerts(true);
    setError("");
    setEvalSuccessMsg("");
    try {
      const res = await fetch("/api/admin/certificates/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          role: "auto"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate project certificates.");
      }
      setEvalSuccessMsg(
        `Issued ${data.issuedCount} verifiable Landscape A4 certificate(s) as "${data.role}".`
      );
      await fetchProjectDetails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingCerts(false);
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
        <button
          onClick={onBack}
          className="mt-4 text-indigo-600 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to List
        </button>
      </div>
    );
  }

  const safeGithubUrl = safeExternalUrl(project.githubUrl);
  const safeLiveUrl = safeExternalUrl(project.liveUrl);
  const safeAiStudioUrl = safeExternalUrl(project.aiStudioUrl);
  const safeDemoVideoUrl = safeExternalUrl(project.demoVideoUrl);
  const safeDocUrl = safeExternalUrl(project.presentationDocUrl);
  const projectCerts: Certificate[] = Array.isArray(project.certificates)
    ? project.certificates
    : [];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        {canEvaluate && (
          <button
            onClick={handleRunAIEvaluation}
            disabled={evalLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {evalLoading ? "AI Engine Running..." : "Re-run AI Scoring"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex gap-2 items-center">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {evalSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm rounded-xl font-medium flex gap-2 items-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{evalSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Info + Analytics on left, AI metrics + reviews + comments on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Project Entry Details
                  </span>
                  {(project.hackathonName || project.hackathon?.name) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {project.hackathonName || project.hackathon?.name}
                    </span>
                  )}
                </div>

                {typeof project.officialRank === "number" && project.officialRank > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-extrabold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Locked Standing: Rank #{project.officialRank}
                    {project.totalHackathonEntries ? ` of ${project.totalHackathonEntries}` : ""}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 tracking-tight">
                  {project.projectName}
                </h1>
                <p className="text-slate-600 text-sm font-semibold mt-1.5">
                  Submitted by Team:{" "}
                  <span className="text-indigo-600 font-bold">{project.teamName}</span>
                </p>
                {project.teamMembers && (
                  <p className="text-xs text-slate-500 mt-1">
                    Members:{" "}
                    {project.teamMembers
                      .split(",")
                      .map((m: string) => m.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              {(project.aiOverallScore !== null || project.judgeAverageScore !== null || (project.combinedScore !== null && project.combinedScore > 0)) && (
                <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200/90 rounded-xl p-3.5">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Composite Score</div>
                    <div className="text-base font-mono font-extrabold text-slate-900 mt-0.5">
                      {project.combinedScore !== null && project.combinedScore !== undefined
                        ? `${project.combinedScore}/100`
                        : "Pending"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500">AI Score (40%)</div>
                    <div className="text-base font-mono font-bold text-indigo-700 mt-0.5">
                      {project.aiOverallScore !== null && project.aiOverallScore !== undefined
                        ? `${project.aiOverallScore}/100`
                        : "Pending"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-500">Judge Avg (60%)</div>
                    <div className="text-base font-mono font-bold text-emerald-700 mt-0.5">
                      {project.judgeAverageScore !== null && project.judgeAverageScore !== undefined
                        ? `${project.judgeAverageScore}/100`
                        : "Pending"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Links bar */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {safeGithubUrl && (
                <a
                  href={safeGithubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Github className="w-4 h-4" /> GitHub Repo
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {safeLiveUrl && (
                <a
                  href={safeLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Live App
                </a>
              )}
              {safeAiStudioUrl && (
                <a
                  href={safeAiStudioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> AI Studio App
                </a>
              )}
              {safeDemoVideoUrl && (
                <a
                  href={safeDemoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <PlayCircle className="w-4 h-4" /> Pitch Video
                </a>
              )}
              {safeDocUrl ? (
                <a
                  href={safeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  {project.presentationDocName || "Presentation Slides"}
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : (
                project.presentationDocName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                    <FileText className="w-4 h-4 text-slate-500" /> {project.presentationDocName}
                  </div>
                )
              )}
            </div>

            {/* Core Text fields */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Problem Statement
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {project.problemStatement}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Proposed Solution & Architecture
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            </div>
          </div>

          {/* Official Verifiable & Custom Certificates for this Project */}
          <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h2 className="font-sans font-bold text-slate-900 text-base">
                  Project Certificates ({projectCerts.length})
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Landscape A4 PDF + QR
                </span>
                <button
                  type="button"
                  onClick={() => setShowCertBuilder((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  {showCertBuilder ? "Hide Certificate Studio" : "Generate Certificate"}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleGenerateProjectCertificates}
                    disabled={generatingCerts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingCerts
                      ? "Issuing Team Certs..."
                      : projectCerts.length > 0
                      ? "Quick Auto-Issue Team"
                      : "Auto-Issue Team"}
                  </button>
                )}
              </div>
            </div>

            {showCertBuilder && (
              <div className="bg-slate-50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5">
                <CertificateGeneratorStudio
                  token={token}
                  currentUser={currentUser}
                  initialHackathonId={project.hackathonId}
                  initialProject={project}
                  compactModal={true}
                  onCertificatesIssued={() => {
                    fetchProjectDetails();
                  }}
                />
              </div>
            )}

            {projectCerts.length === 0 ? (
              !showCertBuilder && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">No certificates issued for this project yet.</p>
                  <p>
                    Click <strong>Generate Certificate</strong> above to input recipient name, email, and award role, or auto-generate Landscape A4 credentials linked to this project's locked standing.
                  </p>
                </div>
              )
            ) : (
                <div className="space-y-4">
                  {projectCerts.map((cert) => (
                    <div key={cert.id}>
                      <CredentialCard
                        certificate={cert}
                        onPreview={(c) => setSelectedCert(c)}
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* GitHub Analysis Analytics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-800" />
                GitHub Engineering Audit
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Analyzed:{" "}
                {project.githubAnalysis
                  ? new Date(project.githubAnalysis.analyzedAt).toLocaleDateString()
                  : "Pending evaluation"}
              </span>
            </div>

            {project.githubAnalysis ? (
              <div className="space-y-8">
                {project.githubAnalysis.errorState === "invalid_url" && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                        Invalid Repository URL
                      </h4>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        The repository link submitted could not be parsed as a valid GitHub repository.
                      </p>
                    </div>
                  </div>
                )}

                {project.githubAnalysis.isPrivate && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Private / Inaccessible Repository
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        This repository is currently private or unreachable. Set visibility to{" "}
                        <strong>Public</strong> on GitHub and re-run evaluation for live telemetry.
                      </p>
                    </div>
                  </div>
                )}

                {project.githubAnalysis.isEmpty && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Empty Repository Detected
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        The repository exists and is public, but contains no branches or commits yet.
                      </p>
                    </div>
                  </div>
                )}

                {/* Dual Radial Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Repository Health
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">Audit Score</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Documentation, structure & activity.
                      </p>
                    </div>
                    <div className="relative flex items-center justify-center h-16 w-16 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e2e8f0"
                          strokeWidth="4"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke={
                            (project.githubAnalysis.repoHealthScore || 0) >= 80
                              ? "#10b981"
                              : (project.githubAnalysis.repoHealthScore || 0) >= 60
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={
                            2 * Math.PI * 28 * (1 - (project.githubAnalysis.repoHealthScore || 0) / 100)
                          }
                        />
                      </svg>
                      <span className="absolute text-sm font-black font-mono tabular-nums text-slate-950">
                        {project.githubAnalysis.repoHealthScore || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Developer Practices
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">Workflow Quality</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Licensing, branching & CI/CD setup.
                      </p>
                    </div>
                    <div className="relative flex items-center justify-center h-16 w-16 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e2e8f0"
                          strokeWidth="4"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke={
                            (project.githubAnalysis.developerPracticeScore || 0) >= 80
                              ? "#6366f1"
                              : (project.githubAnalysis.developerPracticeScore || 0) >= 60
                              ? "#d946ef"
                              : "#f43f5e"
                          }
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={
                            2 *
                            Math.PI *
                            28 *
                            (1 - (project.githubAnalysis.developerPracticeScore || 0) / 100)
                          }
                        />
                      </svg>
                      <span className="absolute text-sm font-black font-mono tabular-nums text-slate-950">
                        {project.githubAnalysis.developerPracticeScore || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* GitHub Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Commits
                    </span>
                    <span className="text-base font-extrabold text-slate-800 font-mono tabular-nums mt-0.5 block">
                      {project.githubAnalysis.commits}
                    </span>
                    <span
                      className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate"
                      title={project.githubAnalysis.commitFrequency}
                    >
                      {project.githubAnalysis.commitFrequency || "Repository history"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      PRs / Issues
                    </span>
                    <span className="text-base font-extrabold text-slate-800 font-mono tabular-nums mt-0.5 block">
                      {project.githubAnalysis.pullRequests?.total || 0} /{" "}
                      {project.githubAnalysis.issues?.total || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      PRs:{" "}
                      <span className="text-emerald-600 font-bold">
                        {project.githubAnalysis.pullRequests?.open || 0} Open
                      </span>
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Branches
                    </span>
                    <span className="text-base font-extrabold text-slate-800 font-mono tabular-nums mt-0.5 block">
                      {project.githubAnalysis.branches?.length || 1}
                    </span>
                    <span
                      className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate"
                      title={project.githubAnalysis.branches?.join(", ") || "main"}
                    >
                      Primary: {project.githubAnalysis.branches?.[0] || "main"}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Stars / Forks
                    </span>
                    <span className="text-base font-extrabold text-slate-800 font-mono tabular-nums mt-0.5 block">
                      {project.githubAnalysis.stars} / {project.githubAnalysis.forks}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">
                      License: {project.githubAnalysis.license || "None"}
                    </span>
                  </div>
                </div>

                {/* Pipeline & Security Checks */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${
                        project.githubAnalysis.hasGitignore ? "text-emerald-500" : "text-slate-300"
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Git Ignore Shield
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {project.githubAnalysis.hasGitignore
                          ? "Active (.gitignore present)"
                          : "No .gitignore detected"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${
                        project.githubAnalysis.githubActions?.hasActions
                          ? "text-emerald-500"
                          : "text-slate-300"
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        CI/CD Pipelines
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-44">
                        {project.githubAnalysis.githubActions?.hasActions
                          ? project.githubAnalysis.githubActions.workflows.join(", ")
                          : "No Actions found"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 ${
                        project.githubAnalysis.license ? "text-emerald-500" : "text-slate-300"
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Compliance License
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {project.githubAnalysis.license
                          ? `${project.githubAnalysis.license} Open Source`
                          : "No LICENSE file parsed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Observations */}
                {project.githubAnalysis.codeQualityObservations &&
                  project.githubAnalysis.codeQualityObservations.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        Engineering & Code Quality Observations
                      </h3>
                      <ul className="space-y-1.5 pl-1.5">
                        {project.githubAnalysis.codeQualityObservations.map(
                          (obs: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-600 flex gap-2">
                              <span className="text-indigo-500 font-bold shrink-0">•</span>
                              <span>{obs}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* README Quality Card */}
                {project.githubAnalysis.readmeQuality && (
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          README Documentation Quality
                        </h3>
                      </div>
                      <span className="text-xs font-extrabold font-mono tabular-nums text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {project.githubAnalysis.readmeQuality.score}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasSetupGuide ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span
                          className={
                            project.githubAnalysis.readmeQuality.hasSetupGuide
                              ? "text-slate-800 font-semibold"
                              : "text-slate-400"
                          }
                        >
                          Setup Guide
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasPrerequisites ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span
                          className={
                            project.githubAnalysis.readmeQuality.hasPrerequisites
                              ? "text-slate-800 font-semibold"
                              : "text-slate-400"
                          }
                        >
                          Prerequisites
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {project.githubAnalysis.readmeQuality.hasArchitectureSection ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span
                          className={
                            project.githubAnalysis.readmeQuality.hasArchitectureSection
                              ? "text-slate-800 font-semibold"
                              : "text-slate-400"
                          }
                        >
                          Architecture Overview
                        </span>
                      </div>
                    </div>

                    {project.githubAnalysis.readmeQuality.missingSections.length > 0 && (
                      <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">
                        <strong>Missing documentation sections:</strong>{" "}
                        {project.githubAnalysis.readmeQuality.missingSections.join(", ")}.
                      </div>
                    )}
                  </div>
                )}

                {/* Languages usage distribution */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Languages Distribution
                  </h3>
                  <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                    {Object.entries(project.githubAnalysis.languages || {}).map(
                      ([lang, pct]: any, idx) => {
                        const colors = [
                          "bg-indigo-500",
                          "bg-emerald-500",
                          "bg-amber-400",
                          "bg-rose-400",
                          "bg-violet-500"
                        ];
                        return (
                          <div
                            key={lang}
                            className={`${colors[idx % colors.length]} h-full`}
                            style={{ width: `${pct}%` }}
                            title={`${lang}: ${pct}%`}
                          />
                        );
                      }
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {Object.entries(project.githubAnalysis.languages || {}).map(
                      ([lang, pct]: any, idx) => {
                        const colors = [
                          "bg-indigo-500",
                          "bg-emerald-500",
                          "bg-amber-400",
                          "bg-rose-400",
                          "bg-violet-500"
                        ];
                        return (
                          <div key={lang} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}
                            />
                            <span className="font-semibold">{lang}</span>
                            <span className="text-slate-400 font-mono tabular-nums">({pct}%)</span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Structure list */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Repository File Structure
                  </h3>
                  <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-xl max-h-40 overflow-y-auto border border-slate-800 space-y-1">
                    {project.githubAnalysis.repoStructure?.map((path: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                No GitHub repository telemetry fetched yet. Triggering an evaluation will analyze this repository automatically.
              </div>
            )}
          </div>

          {/* Live Website & UX Audit Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-sans font-extrabold text-slate-950 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Live Deployment & UX Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated latency, security headers, SEO, and visual accessibility diagnostics.
                </p>
              </div>
              {safeLiveUrl && token && (
                <button
                  onClick={handleTriggerLiveAudit}
                  disabled={liveAnalysisLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${liveAnalysisLoading ? "animate-spin" : ""}`} />
                  {liveAnalysisLoading ? "Auditing App..." : "Audit Now"}
                </button>
              )}
            </div>

            {liveAnalysisError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{liveAnalysisError}</span>
              </div>
            )}

            {!safeLiveUrl ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No valid public deployment URL was supplied for this submission.
              </div>
            ) : liveAnalysisLoading ? (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">
                  Running Live Deployment & Header Audit
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Checking HTTP reachability, response latency, security response headers, and UX heuristics.
                </p>
              </div>
            ) : liveAnalysis ? (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "Speed", score: liveAnalysis.performance_score, color: "text-emerald-600" },
                    { label: "A11y", score: liveAnalysis.accessibility_score, color: "text-indigo-600" },
                    { label: "SEO", score: liveAnalysis.seo_score, color: "text-amber-600" },
                    { label: "UX Flow", score: liveAnalysis.ux_score, color: "text-rose-600" },
                    { label: "Security", score: liveAnalysis.security_score, color: "text-cyan-600" },
                    { label: "Mobile", score: liveAnalysis.mobile_responsiveness_score, color: "text-fuchsia-600" }
                  ].map((gauge, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 p-2.5 rounded-xl text-center space-y-1 bg-slate-50/70"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {gauge.label}
                      </span>
                      <span className={`text-base font-extrabold font-mono tabular-nums block ${gauge.color}`}>
                        {gauge.score}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex flex-wrap gap-3 justify-between items-center text-xs font-mono">
                  <span>
                    Status:{" "}
                    <span
                      className={
                        liveAnalysis.available ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"
                      }
                    >
                      {liveAnalysis.available ? "ONLINE" : "OFFLINE"}
                    </span>
                  </span>
                  <span>
                    Latency:{" "}
                    <span className="text-indigo-300 font-bold tabular-nums">
                      {liveAnalysis.responseTimeMs}ms
                    </span>
                  </span>
                  <span>
                    HTTP:{" "}
                    <span className="text-amber-400 font-bold tabular-nums">
                      {liveAnalysis.statusCode || "---"}
                    </span>
                  </span>
                </div>

                {liveAnalysis.issues && liveAnalysis.issues.length > 0 ? (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Audit Findings ({liveAnalysis.issues.length})
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {liveAnalysis.issues.map((iss: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                iss.severity === "high"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : iss.severity === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {iss.severity} severity
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                              {iss.type}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 leading-tight">{iss.message}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {iss.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> All deployment checks passed cleanly.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                <Globe className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-700">Live Audit Not Run Yet</h4>
                  <p className="text-slate-400 mt-0.5 max-w-sm mx-auto">
                    {token
                      ? "Click 'Audit Now' to test deployment reachability, latency, and headers."
                      : "Sign in to trigger an automated live deployment audit."}
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
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h2 className="font-sans font-bold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                AI Scorecard Summary
              </h2>
              {project.aiEvaluation && (
                <div className="text-xl font-black font-mono tabular-nums tracking-tight bg-indigo-600 px-3 py-1 rounded-lg">
                  {project.aiEvaluation.overallScore}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {project.aiEvaluation ? (
                <>
                  <div className="space-y-3.5">
                    {[
                      { label: "Idea Viability", key: "ideaScore", color: "bg-indigo-500" },
                      { label: "Innovation Quotient", key: "innovationScore", color: "bg-pink-500" },
                      { label: "Code Quality & Organization", key: "codeQualityScore", color: "bg-emerald-500" },
                      { label: "Documentation & README", key: "readmeScore", color: "bg-amber-500" },
                      { label: "Fidelity & UX Flow", key: "uiScore", color: "bg-teal-500" },
                      { label: "AI Integration Logic", key: "aiUsageScore", color: "bg-violet-500" },
                      { label: "Technical Sophistication", key: "technicalScore", color: "bg-sky-500" }
                    ].map((row) => {
                      const score = project.aiEvaluation[row.key] || 0;
                      return (
                        <div key={row.key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{row.label}</span>
                            <span className="font-mono tabular-nums font-bold text-slate-900">
                              {score}/100
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${row.color}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Structured Feedback block */}
                  <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Evaluation Critique
                    </h3>
                    {renderFormattedFeedback(project.aiEvaluation.feedback)}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm space-y-4">
                  <p>This project has not been scored by the AI Evaluation engine yet.</p>
                  {canEvaluate && (
                    <button
                      onClick={handleRunAIEvaluation}
                      disabled={evalLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {evalLoading ? "Analyzing Repo..." : "Run AI Analysis Now"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Judge & Organizer Scorecard Grading Panel */}
          {canEvaluate && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-emerald-700 px-6 py-4 flex items-center justify-between text-white">
                <h2 className="font-sans font-bold text-base flex items-center gap-2">
                  <Star className="w-5 h-5 fill-emerald-200 text-emerald-200" />
                  Judge Grading Form
                </h2>
                {project.judgeReviews && project.judgeReviews.length > 0 && (
                  <span className="text-xs bg-white/15 px-2.5 py-0.5 rounded font-bold font-mono">
                    {project.judgeReviews.length}{" "}
                    {project.judgeReviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                {reviewSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="bg-rose-50 border border-rose-200 p-3 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { label: "Idea Viability", state: judgeIdea, setState: setJudgeIdea, color: "accent-indigo-600" },
                    { label: "Innovation Quotient", state: judgeInnovation, setState: setJudgeInnovation, color: "accent-pink-500" },
                    { label: "Code Quality & Organization", state: judgeCodeQuality, setState: setJudgeCodeQuality, color: "accent-emerald-500" },
                    { label: "Documentation & README", state: judgeReadme, setState: setJudgeReadme, color: "accent-amber-500" },
                    { label: "Fidelity & UX Flow", state: judgeUi, setState: setJudgeUi, color: "accent-teal-500" },
                    { label: "AI Integration Logic", state: judgeAiUsage, setState: setJudgeAiUsage, color: "accent-violet-500" },
                    { label: "Technical Sophistication", state: judgeTechnical, setState: setJudgeTechnical, color: "accent-sky-500" }
                  ].map((row) => (
                    <div key={row.label} className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{row.label}</span>
                        <span className="font-mono tabular-nums font-bold text-slate-900 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                          {row.state} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={row.state}
                        onChange={(e) => row.setState(Number(e.target.value))}
                        className={`w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer ${row.color}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Judge Feedback & Justification
                  </label>
                  <textarea
                    rows={3}
                    value={judgeFeedback}
                    onChange={(e) => setJudgeFeedback(e.target.value)}
                    placeholder="Enter review remarks, architectural highlights, or suggestions for the team..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50/50 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {reviewLoading ? "Saving Grade..." : "Submit Judge Scorecard"}
                </button>
              </form>
            </div>
          )}

          {/* Interactive Comments Stream */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-5 h-5 text-slate-500" />
              Feedback Discussion ({project.comments?.length || 0})
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {project.comments?.length > 0 ? (
                project.comments.map((comm: any) => (
                  <div
                    key={comm.id}
                    className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/70"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{comm.userName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                          comm.userRole === "Admin"
                            ? "bg-rose-100 text-rose-800"
                            : comm.userRole === "Judge"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {comm.userRole}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{comm.content}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                      {new Date(comm.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No comments posted yet. Start the discussion below.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post feedback or ask a question..."
                className="flex-grow px-3 py-2 text-xs border border-slate-300 bg-slate-50/50 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                disabled={submitCommentLoading || !newComment.trim()}
                className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Send feedback"
              >
                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Certificate Preview & A4 PDF Export Modal */}
      <CertificateModal
        certificate={selectedCert}
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}

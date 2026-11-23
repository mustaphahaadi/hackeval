import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Award,
  Sparkles,
  Star,
  Plus,
  Check,
  AlertCircle,
  FolderGit,
  ExternalLink,
  X
} from "lucide-react";
import { HackathonEvent, LeaderboardRanking, UserRole } from "../types";
import { CertificateGeneratorStudio } from "./CertificateGeneratorStudio.js";

interface HackathonDetailViewProps {
  hackathon: HackathonEvent;
  token?: string;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: UserRole;
  } | null;
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
  onSubmitProjectToHackathon: (hackathonId: string) => void;
}

export function HackathonDetailView({
  hackathon,
  token,
  currentUser,
  onBack,
  onSelectProject,
  onSubmitProjectToHackathon
}: HackathonDetailViewProps) {
  const [submissions, setSubmissions] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [certTargetProject, setCertTargetProject] = useState<any | null>(null);

  const canEvaluate = currentUser?.role === "Admin" || currentUser?.role === "Judge";

  const fetchHackathonSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/leaderboard?hackathonId=${encodeURIComponent(hackathon.id)}`
      );
      if (!res.ok) {
        throw new Error("Failed to load submissions for this hackathon.");
      }
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathonSubmissions();
  }, [hackathon.id]);

  const handleEvaluateAndRankAll = async (force = false) => {
    setError("");
    setSuccess("");
    setEvaluating(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/evaluate-all", {
        method: "POST",
        headers,
        body: JSON.stringify({ hackathonId: hackathon.id, force })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete AI evaluation and ranking.");
      }

      setSuccess(
        data.evaluatedCount > 0
          ? `Evaluated ${data.evaluatedCount} pending submission(s) for ${hackathon.name}${data.skippedEvaluatedCount ? ` (kept ${data.skippedEvaluatedCount} already-graded projects unchanged)` : ""} and locked rankings.`
          : `All submissions for ${hackathon.name} are already graded; official rankings remain locked.`
      );
      await fetchHackathonSubmissions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const handleOpenCertModalForEntry = async (item: LeaderboardRanking) => {
    const fallbackObj = {
      id: item.projectId,
      projectId: item.projectId,
      projectName: item.projectName,
      teamName: item.teamName,
      hackathonId: hackathon.id,
      hackathonName: hackathon.name,
      officialRank: item.rank,
      combinedScore: item.combinedScore,
      aiOverallScore: item.aiOverallScore,
      judgeAverageScore: item.judgeAverageScore,
      totalHackathonEntries: submissions.length,
      status: item.status || (item.aiOverallScore !== null ? "evaluated" : "pending")
    };
    setCertTargetProject(fallbackObj);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/projects/${item.projectId}`, { headers });
      if (res.ok) {
        const fullProj = await res.json();
        setCertTargetProject(fullProj);
      }
    } catch {
      // Keep fallback snapshot
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer text-slate-700 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hackathon List
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              hackathon.active
                ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {hackathon.active ? "Active Hackathon" : "Past Event"}
          </span>
        </div>
      </div>

      {/* Main Hackathon Event Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FolderGit className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">
              Hackathon Track Overview
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 tracking-tight">
            {hackathon.name}
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            {hackathon.description}
          </p>
          <div className="text-xs text-slate-500 font-mono flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Start: <strong className="text-slate-700">{hackathon.startDate}</strong>
            </span>
            <span>•</span>
            <span>
              End: <strong className="text-slate-700">{hackathon.endDate}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
          <button
            onClick={() => onSubmitProjectToHackathon(hackathon.id)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Project
          </button>

          {canEvaluate && (
            <>
              <button
                onClick={() => handleEvaluateAndRankAll(false)}
                disabled={evaluating || submissions.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-colors"
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Grading Pending...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Grade Pending & Lock Ranks
                  </>
                )}
              </button>
              <button
                onClick={() => handleEvaluateAndRankAll(true)}
                disabled={evaluating || submissions.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                title="Re-evaluate all projects in this event"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
                Re-grade All
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm rounded-xl font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <h3 className="font-sans font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Hackathon Entries & Standings
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums font-bold">
            {submissions.length} {submissions.length === 1 ? "Submission" : "Submissions"}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16 bg-white border border-slate-200 rounded-2xl">
            <RefreshCw className="animate-spin w-8 h-8 text-indigo-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <FolderGit className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-3" />
            <p className="font-bold text-base text-slate-700">No project submissions yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Submit the first project to this Hackathon to initiate automated repository analysis and judging.
            </p>
            <button
              onClick={() => onSubmitProjectToHackathon(hackathon.id)}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Submit First Project
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">
                      Rank
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Project Submission
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">
                      AI Score
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">
                      Judge Score
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">
                      Composite
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-28">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-40">
                      Certificate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {submissions.map((item) => {
                    const isEvaluated =
                      item.aiOverallScore !== null && item.aiOverallScore !== undefined;
                    return (
                      <tr
                        key={item.projectId}
                        onClick={() => onSelectProject(item.projectId)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {isEvaluated ? `#${item.rank}` : "—"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {item.projectName}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-slate-500">
                              By team: <strong className="text-slate-700">{item.teamName}</strong>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isEvaluated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 font-mono tabular-nums">
                              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                              {item.aiOverallScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {item.judgeAverageScore !== null &&
                          item.judgeAverageScore !== undefined ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tabular-nums">
                              <Star className="w-3.5 h-3.5 fill-emerald-100 text-emerald-600" />
                              {item.judgeAverageScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="font-mono tabular-nums font-extrabold text-sm text-slate-900">
                            {item.combinedScore > 0 ? (
                              <span>
                                {item.combinedScore}{" "}
                                <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-sans font-normal">
                                Unranked
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isEvaluated
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isEvaluated ? "Evaluated" : "Waiting"}
                          </span>
                        </td>

                        <td
                          className="px-6 py-4 whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenCertModalForEntry(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            Generate Cert
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Flexible Certificate Generator for Selected Submission */}
      {certTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Generate Certificate — {certTargetProject.projectName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Customize recipient name, email, and award title or export Landscape A4 PDF immediately.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCertTargetProject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close certificate generator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto">
              <CertificateGeneratorStudio
                token={token}
                currentUser={currentUser}
                initialHackathonId={hackathon.id}
                initialProject={certTargetProject}
                compactModal={true}
                onCertificatesIssued={() => {
                  fetchHackathonSubmissions();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, RefreshCw, Play, Award, Sparkles, Star, 
  Plus, Check, HelpCircle, AlertCircle, Trash, Code, FolderGit, ExternalLink 
} from "lucide-react";
import { HackathonEvent, ProjectSubmission, LeaderboardRanking } from "../types";

interface HackathonDetailViewProps {
  hackathon: HackathonEvent;
  token?: string;
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
  onSubmitProjectToHackathon: (hackathonId: string) => void;
}

export function HackathonDetailView({ 
  hackathon, 
  token, 
  onBack, 
  onSelectProject,
  onSubmitProjectToHackathon
}: HackathonDetailViewProps) {
  const [submissions, setSubmissions] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  const fetchHackathonSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leaderboard?hackathonId=${hackathon.id}`);
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

  const handleEvaluateAndRankAll = async () => {
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
        body: JSON.stringify({ hackathonId: hackathon.id })
      });

      if (!res.ok) {
        throw new Error("Failed to complete AI evaluation and ranking.");
      }

      const data = await res.json();
      setSuccess(`Success! The AI engine successfully evaluated all ${data.evaluatedCount} submissions for this hackathon and re-calculated the official ranks.`);
      await fetchHackathonSubmissions(); // Re-fetch list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvaluating(false);
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
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            hackathon.active 
              ? "bg-indigo-100 text-indigo-800 border border-indigo-200" 
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            {hackathon.active ? "Active Hackathon" : "Past Event"}
          </span>
        </div>
      </div>

      {/* Main Hackathon Event Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FolderGit className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Organization Project Context</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 tracking-tight">{hackathon.name}</h2>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">{hackathon.description}</p>
          <div className="text-xs text-slate-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
            <span>Start Date: <strong className="text-slate-600">{hackathon.startDate}</strong></span>
            <span>•</span>
            <span>End Date: <strong className="text-slate-600">{hackathon.endDate}</strong></span>
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

          <button
            onClick={handleEvaluateAndRankAll}
            disabled={evaluating || submissions.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-colors"
          >
            {evaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Grading & Ranking...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Analyze & Grade All
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-800 text-sm rounded-r-lg font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-sans font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Hackathon Entries & Leaderboard
          </h3>
          <span className="text-xs text-slate-400 font-mono font-bold">
            {submissions.length} {submissions.length === 1 ? "Submission" : "Submissions"}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16 bg-white border border-slate-100 rounded-2xl">
            <RefreshCw className="animate-spin w-8 h-8 text-indigo-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <FolderGit className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-3" />
            <p className="font-bold text-base text-slate-700">No project submissions yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Be the first to submit a project to this Hackathon and trigger the AI evaluation engine!
            </p>
            <button
              onClick={() => onSubmitProjectToHackathon(hackathon.id)}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
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
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Rank</th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Submission</th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">AI Score</th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">Organizer Score</th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">Composite Score</th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {submissions.map((item) => {
                    const isEvaluated = item.aiOverallScore !== null;
                    return (
                      <tr 
                        key={item.projectId}
                        onClick={() => onSelectProject(item.projectId)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        {/* Rank */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {item.rank === 1 && isEvaluated ? (
                              <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-extrabold border border-amber-200" title="1st Place">🏆</span>
                            ) : item.rank === 2 && isEvaluated ? (
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-extrabold border border-slate-200" title="2nd Place">🥈</span>
                            ) : item.rank === 3 && isEvaluated ? (
                              <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-xs font-extrabold border border-amber-200/50" title="3rd Place">🥉</span>
                            ) : (
                              <span className="text-slate-500 font-mono text-xs font-semibold">
                                {isEvaluated ? `#${item.rank}` : "—"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Project Details */}
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

                        {/* AI Score */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isEvaluated ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                              {item.aiOverallScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Pending</span>
                          )}
                        </td>

                        {/* Judge Score */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {item.judgeAverageScore !== null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              <Star className="w-3.5 h-3.5 fill-emerald-100 text-emerald-500" />
                              {item.judgeAverageScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Pending</span>
                          )}
                        </td>

                        {/* Composite Score */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="font-mono font-extrabold text-sm text-slate-900">
                            {item.combinedScore > 0 ? (
                              <span>{item.combinedScore} <span className="text-[10px] text-slate-400 font-normal">/ 100</span></span>
                            ) : (
                              <span className="text-slate-400 text-xs font-sans font-normal italic">Unranked</span>
                            )}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isEvaluated 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {isEvaluated ? "Evaluated" : "Waiting"}
                          </span>
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
    </div>
  );
}

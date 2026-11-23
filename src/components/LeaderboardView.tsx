import React, { useState, useEffect } from "react";
import {
  Trophy,
  Search,
  Star,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Play,
  Check,
  AlertCircle
} from "lucide-react";
import { LeaderboardRanking, UserRole } from "../types";
import { AIJudgeAssistant } from "./AIJudgeAssistant.js";

interface LeaderboardViewProps {
  token?: string;
  currentUser?: {
    id?: string;
    name?: string;
    role?: UserRole;
  } | null;
  onSelectProject: (projectId: string) => void;
}

export function LeaderboardView({ token, currentUser, onSelectProject }: LeaderboardViewProps) {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(true);
  const [selectedHackathon, setSelectedHackathon] = useState<any | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canEvaluate = currentUser?.role === "Admin" || currentUser?.role === "Judge";

  const fetchHackathons = async () => {
    setHackathonsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hackathons");
      if (!res.ok) throw new Error("Failed to fetch hackathons.");
      const data = await res.json();
      setHackathons(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHackathonsLoading(false);
    }
  };

  const fetchLeaderboard = async (hackathonId: string) => {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/leaderboard?hackathonId=${encodeURIComponent(hackathonId)}`, {
        headers
      });
      if (!res.ok) throw new Error("Failed to fetch leaderboard data.");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify({ hackathonId: selectedHackathon.id, force })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete AI evaluation and ranking.");
      }

      setSuccess(
        data.evaluatedCount > 0
          ? `Evaluated ${data.evaluatedCount} submission(s) for ${selectedHackathon.name}${data.skippedEvaluatedCount ? ` (preserved ${data.skippedEvaluatedCount} already-ranked projects)` : ""} and locked rankings.`
          : `All submissions in ${selectedHackathon.name} are already graded; rankings remain locked.`
      );
      await fetchLeaderboard(selectedHackathon.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, [token]);

  useEffect(() => {
    if (selectedHackathon) {
      fetchLeaderboard(selectedHackathon.id);
    }
  }, [selectedHackathon, token]);

  const filtered = leaderboard.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filtered.slice(0, 3);

  // VIEW 1: Hackathon Selector List
  if (selectedHackathon === null) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-500 fill-amber-100" />
              Leaderboards by Hackathon
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a hackathon event below to view compiled rankings, AI scores, and judge verdicts.
            </p>
          </div>
          <button
            onClick={fetchHackathons}
            disabled={hackathonsLoading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${hackathonsLoading ? "animate-spin" : ""}`} />
            Refresh Events
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            {error}
          </div>
        )}

        {hackathonsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : hackathons.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <Trophy className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-4" />
            <p className="font-semibold text-lg text-slate-700">No Hackathon Events Available</p>
            <p className="text-sm mt-1 text-slate-400">There are no hackathons registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hk) => (
              <div
                key={hk.id}
                onClick={() => setSelectedHackathon(hk)}
                className={`bg-white border hover:shadow-md p-6 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between ${
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

                <div className="border-t border-slate-100 mt-5 pt-3.5 flex justify-between items-center text-[11px] font-semibold text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {hk.startDate} – {hk.endDate}
                  </span>
                  <span className="text-indigo-600 font-sans font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Rankings <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Selected Hackathon Leaderboard
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back Button and Header */}
      <div className="space-y-4">
        <button
          onClick={() => {
            setSelectedHackathon(null);
            setLeaderboard([]);
            setSuccess("");
            setError("");
          }}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hackathons
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                Leaderboard Rankings
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-slate-500 text-xs font-semibold">{selectedHackathon.name}</span>
            </div>
            <h2 className="text-3xl font-sans font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500 fill-amber-100" />
              {selectedHackathon.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-3xl">
              {selectedHackathon.description ||
                "Weighted composite leaderboard combining automated AI evaluation (40%) and human judge reviews (60%)."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              onClick={() => fetchLeaderboard(selectedHackathon.id)}
              disabled={loading || evaluating}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading && !evaluating ? "animate-spin" : ""}`}
              />
              Refresh Rankings
            </button>

            {canEvaluate && (
              <>
                <button
                  onClick={() => handleEvaluateAndRankAll(false)}
                  disabled={evaluating || leaderboard.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Grading Pending...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Grade Pending & Sync Ranks
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEvaluateAndRankAll(true)}
                  disabled={evaluating || leaderboard.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                  title="Force full AI re-evaluation across every project"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
                  Re-grade All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm rounded-xl font-medium flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {loading && !evaluating ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Search className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-4" />
          <p className="font-semibold text-lg text-slate-700">No Submissions Found</p>
          <p className="text-sm mt-1 text-slate-400">
            There are no project submissions matching your filter for this hackathon yet.
          </p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {searchTerm === "" && topThree.length > 0 && topThree.some((item) => item.combinedScore > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-2 pb-2">
              {/* Rank 2 */}
              {topThree[1] && (
                <div
                  onClick={() => onSelectProject(topThree[1].projectId)}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-2 md:order-1 transition-all h-[230px] justify-between relative overflow-hidden group shadow-sm"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-300" />
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm mb-3">
                      2nd
                    </div>
                    <h3 className="font-sans font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {topThree[1].projectName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{topThree[1].teamName}</p>
                  </div>
                  <div className="w-full">
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-800">
                      {topThree[1].combinedScore}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                      Composite Score
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {topThree[0] && (
                <div
                  onClick={() => onSelectProject(topThree[0].projectId)}
                  className="bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-300 hover:border-amber-400 hover:shadow-lg rounded-2xl p-7 flex flex-col items-center text-center cursor-pointer order-1 md:order-2 transition-all h-[265px] justify-between relative overflow-hidden group shadow-sm"
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center text-amber-600 mb-3 shadow-sm">
                      <Trophy className="w-7 h-7 fill-amber-200" />
                    </div>
                    <h3 className="font-sans font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {topThree[0].projectName}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {topThree[0].teamName}
                    </p>
                  </div>
                  <div className="w-full">
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                      {topThree[0].combinedScore}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700 mt-0.5">
                      Grand Champion
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <div
                  onClick={() => onSelectProject(topThree[2].projectId)}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-3 md:order-3 transition-all h-[215px] justify-between relative overflow-hidden group shadow-sm"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600/40" />
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center font-bold text-amber-800 text-sm mb-3">
                      3rd
                    </div>
                    <h3 className="font-sans font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {topThree[2].projectName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{topThree[2].teamName}</p>
                  </div>
                  <div className="w-full">
                    <div className="text-2xl font-bold font-mono tabular-nums text-slate-800">
                      {topThree[2].combinedScore}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                      Composite Score
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Controls */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search rankings by project name or team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
                      Rank
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Project & Team
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                      AI Score (40%)
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-36">
                      Judge Score (60%)
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                      Composite
                    </th>
                    <th className="relative px-6 py-3.5 w-14">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filtered.map((item) => (
                    <tr
                      key={item.projectId}
                      onClick={() => onSelectProject(item.projectId)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          #{item.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.projectName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.teamName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.aiOverallScore !== null && item.aiOverallScore !== undefined ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 font-mono tabular-nums">
                            <Sparkles className="w-3 h-3" />
                            {item.aiOverallScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.judgeAverageScore !== null && item.judgeAverageScore !== undefined ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono tabular-nums">
                            <Star className="w-3 h-3 fill-emerald-200 text-emerald-600" />
                            {item.judgeAverageScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-mono tabular-nums font-bold text-sm text-slate-900">
                        {item.combinedScore > 0 ? (
                          <span>{item.combinedScore}</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-sans font-normal">Unranked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive AI Judging Co-Pilot */}
          {token && canEvaluate && (
            <AIJudgeAssistant
              token={token}
              hackathonId={selectedHackathon.id}
              hackathonName={selectedHackathon.name}
            />
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Trophy, Search, Star, Sparkles, UserCheck, RefreshCw, Award, ArrowUpRight } from "lucide-react";
import { LeaderboardRanking } from "../types";

interface LeaderboardViewProps {
  token: string;
  onSelectProject: (projectId: string) => void;
}

export function LeaderboardView({ token, onSelectProject }: LeaderboardViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboard", {
        headers: { Authorization: `Bearer ${token}` }
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

  useEffect(() => {
    fetchLeaderboard();
  }, [token]);

  const filtered = leaderboard.filter(
    (item) =>
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filtered.slice(0, 3);
  const remainder = filtered.slice(3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500 fill-amber-100" />
            Live Rankings Leaderboard
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time composite rankings: 40% AI Evaluation Engine, 60% Jury Scoring weighted average.
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <Search className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-4" />
          <p className="font-semibold text-lg text-slate-700">No projects found</p>
          <p className="text-sm mt-1">Adjust your search term or submit your project to see it on the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {searchTerm === "" && topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 pb-2">
              {/* Rank 2 */}
              {topThree[1] && (
                <div 
                  onClick={() => onSelectProject(topThree[1].projectId)}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-2 md:order-1 transition-all h-[240px] justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-300" />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500 text-lg mb-3 shadow-inner">
                      2nd
                    </div>
                    <h3 className="font-sans font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{topThree[1].projectName}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{topThree[1].teamName}</p>
                  </div>
                  <div className="w-full">
                    <div className="text-2xl font-bold font-mono text-slate-800">{topThree[1].combinedScore}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Composite Score</div>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold Podium) */}
              {topThree[0] && (
                <div 
                  onClick={() => onSelectProject(topThree[0].projectId)}
                  className="bg-gradient-to-b from-indigo-50/50 to-white border-2 border-amber-300 hover:border-amber-400 hover:shadow-lg rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer order-1 md:order-2 transition-all h-[280px] justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-300 to-yellow-500" />
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center text-amber-500 mb-3 shadow-md animate-pulse">
                      <Trophy className="w-8 h-8 fill-amber-200" />
                    </div>
                    <h3 className="font-sans font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{topThree[0].projectName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {topThree[0].teamName}
                    </p>
                  </div>
                  <div className="w-full">
                    <div className="text-3xl font-extrabold font-mono text-slate-900">{topThree[0].combinedScore}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 mt-0.5">Grand Champion</div>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <div 
                  onClick={() => onSelectProject(topThree[2].projectId)}
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-3 md:order-3 transition-all h-[220px] justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600/30" />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-200/50 rounded-full flex items-center justify-center font-bold text-amber-800 text-lg mb-3 shadow-inner">
                      3rd
                    </div>
                    <h3 className="font-sans font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{topThree[2].projectName}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{topThree[2].teamName}</p>
                  </div>
                  <div className="w-full">
                    <div className="text-2xl font-bold font-mono text-slate-800">{topThree[2].combinedScore}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Composite Score</div>
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
              placeholder="Search by project name or team name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Rank</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Project & Team</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28">AI Score</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Judge Score</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Combined (Wtd)</th>
                  <th scope="col" className="relative px-6 py-3.5 w-16">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filtered.map((item, idx) => (
                  <tr 
                    key={item.projectId}
                    onClick={() => onSelectProject(item.projectId)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      <div className="flex items-center gap-1">
                        {item.rank === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-extrabold border border-amber-200">🏆</span>
                        ) : item.rank === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-extrabold border border-slate-200">🥈</span>
                        ) : item.rank === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-xs font-extrabold border border-amber-200/50">🥉</span>
                        ) : (
                          <span className="text-slate-500 font-mono pl-1.5">{item.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.projectName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.teamName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.aiOverallScore !== null ? (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                          <Sparkles className="w-3 h-3" />
                          {item.aiOverallScore}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.judgeAverageScore !== null ? (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          <Star className="w-3 h-3 fill-emerald-100 text-emerald-500" />
                          {item.judgeAverageScore}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-bold text-sm text-slate-800">
                      {item.combinedScore > 0 ? (
                        <span>{item.combinedScore}</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-sans font-normal italic">Unranked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <button className="text-slate-400 group-hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

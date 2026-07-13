import React, { useState, useEffect } from "react";
import { Trophy, Search, Star, Sparkles, RefreshCw, ArrowUpRight, ArrowLeft, Calendar, ChevronRight } from "lucide-react";
import { LeaderboardRanking } from "../types";

interface LeaderboardViewProps {
  token?: string;
  onSelectProject: (projectId: string) => void;
}

export function LeaderboardView({ token, onSelectProject }: LeaderboardViewProps) {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonsLoading, setHackathonsLoading] = useState(true);
  const [selectedHackathon, setSelectedHackathon] = useState<any | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

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
      const res = await fetch(`/api/leaderboard?hackathonId=${hackathonId}`, { headers });
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
  const remainder = filtered.slice(3);

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
              Select a hackathon event below to view its compiled rankings, AI grades, and developer results.
            </p>
          </div>
          <button
            onClick={fetchHackathons}
            disabled={hackathonsLoading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${hackathonsLoading ? "animate-spin" : ""}`} />
            Refresh Events
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium">
            {error}
          </div>
        )}

        {hackathonsLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : hackathons.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 animate-fade-in">
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
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {hk.startDate} - {hk.endDate}
                  </span>
                  <span className="text-indigo-600 font-extrabold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    View Rankings <ChevronRight className="w-3 h-3" />
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
          }}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hackathons
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                Leaderboard Rankings
              </span>
              <span className="text-slate-300 text-xs">|</span>
              <span className="text-slate-500 text-xs font-semibold">{selectedHackathon.name}</span>
            </div>
            <h2 className="text-3xl font-sans font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500 fill-amber-100" />
              {selectedHackathon.name}
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-3xl">
              {selectedHackathon.description || "Compiled score weighted composite rankings: AI Evaluation and Jury scoring."}
            </p>
          </div>
          <button
            onClick={() => fetchLeaderboard(selectedHackathon.id)}
            disabled={loading}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Rankings
          </button>
        </div>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 animate-fade-in">
          <Search className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-4" />
          <p className="font-semibold text-lg text-slate-700">No Submissions Found</p>
          <p className="text-sm mt-1 text-slate-400">There are no evaluated submissions recorded for this hackathon yet.</p>
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
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-2 md:order-1 transition-all h-[240px] justify-between relative overflow-hidden group shadow-sm"
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
                  className="bg-gradient-to-b from-indigo-50/50 to-white border-2 border-amber-300 hover:border-amber-400 hover:shadow-lg rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer order-1 md:order-2 transition-all h-[280px] justify-between relative overflow-hidden group shadow-md"
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-300 to-yellow-500" />
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center text-amber-500 mb-3 shadow-md animate-pulse">
                      <Trophy className="w-8 h-8 fill-amber-200" />
                    </div>
                    <h3 className="font-sans font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{topThree[0].projectName}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
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
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer order-3 md:order-3 transition-all h-[220px] justify-between relative overflow-hidden group shadow-sm"
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

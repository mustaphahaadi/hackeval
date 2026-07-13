import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Eye, Sparkles, CheckCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { ProjectSubmission } from "../types";

interface JudgeDashboardProps {
  token: string;
  onSelectProject: (projectId: string) => void;
}

export function JudgeDashboard({ token, onSelectProject }: JudgeDashboardProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "scored">("all");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load project submissions list.");
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const scoredCount = projects.filter((p) => p.status === "evaluated").length;
  const pendingCount = projects.length - scoredCount;

  const filtered = projects.filter((p) => {
    if (filter === "pending") return p.status !== "evaluated";
    if (filter === "scored") return p.status === "evaluated";
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600" />
            Judge Desk Panel
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Conduct academic reviews of submitted team products. Trigger AI evaluations and submit customized scorecards.
          </p>
        </div>
        <button
          onClick={fetchProjects}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload List
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium flex gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-800">{projects.length}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Submissions</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-800">{pendingCount}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider font-sans">Pending AI evaluation</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-slate-800">{scoredCount}</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scored Projects</div>
          </div>
        </div>
      </div>

      {/* Filters tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-sm">
        <button
          onClick={() => setFilter("all")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            filter === "all" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          All Projects ({projects.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            filter === "pending" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Pending Evaluation ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("scored")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            filter === "scored" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Evaluated ({scoredCount})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          No projects match this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj.id)}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md p-6 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-sans font-bold text-slate-950 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {proj.projectName}
                  </h3>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                    proj.status === "evaluated"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {proj.status === "evaluated" ? "Scored" : "Pending AI"}
                  </span>
                </div>
                
                <p className="text-slate-500 text-xs font-semibold">
                  Team: {proj.teamName}
                </p>

                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                  {proj.description}
                </p>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-3.5 flex justify-between items-center text-xs font-semibold text-slate-400">
                <span className="font-mono text-[10px]">{new Date(proj.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-600 group-hover:underline flex items-center gap-1">
                  Evaluate Project <Eye className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

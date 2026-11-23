import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  FileText,
  Download,
  TrendingUp,
  Languages,
  Check,
  RefreshCw,
  AlertCircle,
  Award
} from "lucide-react";

interface AnalyticsReportProps {
  token?: string;
  hackathonId?: string;
}

interface AnalyticsSummary {
  totalProjects: number;
  ratedProjects: number;
  totalStars: number;
  totalCommits: number;
  certificatesIssued: number;
  scoreChartData: Array<{
    name: string;
    fullName?: string;
    overall: number;
    idea: number;
    innovation: number;
    codeQuality: number;
    readme: number;
    ui: number;
    aiUsage: number;
    technical: number;
  }>;
  languageChartData: Array<{
    name: string;
    value: number;
  }>;
}

export function AnalyticsReport({ token, hackathonId }: AnalyticsReportProps) {
  const [report, setReport] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportSuccess, setExportSuccess] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const query = hackathonId ? `?hackathonId=${encodeURIComponent(hackathonId)}` : "";
      const res = await fetch(`/api/analytics/summary${query}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load analytics summary.");
      }
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [token, hackathonId]);

  const handleExportJSON = () => {
    if (!report) return;
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);

    const reportObj = {
      timestamp: new Date().toISOString(),
      hackathonId: hackathonId || "all",
      summary: {
        totalSubmissions: report.totalProjects,
        evaluatedSubmissions: report.ratedProjects,
        totalGitHubStars: report.totalStars,
        totalGitHubCommits: report.totalCommits,
        certificatesIssued: report.certificatesIssued
      },
      evaluationDetail: report.scoreChartData,
      languageDistribution: report.languageChartData
    };

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `hackeval_analytics_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];
  const scoreChartData = report?.scoreChartData || [];
  const languageChartData = report?.languageChartData || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Platform Reports & Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Live score comparisons, repository activity totals, code language breakdown, and structured metric exports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={fetchReportData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!report}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-xs font-semibold rounded-lg text-white shadow-sm transition-colors cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-100" /> Exported!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Metrics (JSON)
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Grid Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Total Submissions
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {report?.totalProjects ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            AI-Evaluated
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {report?.ratedProjects ?? 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Total GitHub Stars
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {(report?.totalStars ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Total Git Commits
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-1">
            {(report?.totalCommits ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Award className="w-3 h-3 text-indigo-500" /> Certificates Issued
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-indigo-700 mt-1">
            {report?.certificatesIssued ?? 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Score Comparisons Across Projects
          </h3>
          {scoreChartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-6 text-slate-500">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Evaluated Projects Yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Run AI evaluation on submitted projects to populate cross-team score comparisons.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      borderRadius: "8px",
                      borderColor: "#e2e8f0"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="overall" name="Overall Avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="codeQuality" name="Code Quality" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="innovation" name="Innovation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Language Pie chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-1.5">
            <Languages className="w-5 h-5 text-emerald-500" /> Code Language Breakdown
          </h3>
          {languageChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-6 text-slate-500">
              <Languages className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Repository Language Data</p>
              <p className="text-xs text-slate-400 mt-1">
                Language telemetry appears after repository audits run on public GitHub projects.
              </p>
            </div>
          ) : (
            <>
              <div className="h-64 w-full text-xs flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {languageChartData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontFamily: "monospace",
                        fontSize: "11px",
                        borderRadius: "8px",
                        borderColor: "#e2e8f0"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-2">
                {languageChartData.map((entry, index) => (
                  <div
                    key={entry.name}
                    className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                    <span className="text-slate-400 font-mono tabular-nums text-[10px]">
                      ({entry.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

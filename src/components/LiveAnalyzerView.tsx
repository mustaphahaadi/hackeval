import React, { useState, useEffect } from "react";
import { 
  Globe, Activity, Cpu, ShieldAlert, Smartphone, CheckCircle, 
  AlertTriangle, Info, ExternalLink, Gauge, Clock, ArrowRight, 
  History, Server, Code, ArrowUpRight, Check, AlertCircle, RefreshCw
} from "lucide-react";
import { LiveAnalysisResult, LiveAnalysisIssue } from "../types";

interface LiveAnalyzerViewProps {
  token?: string;
}

export function LiveAnalyzerView({ token }: LiveAnalyzerViewProps) {
  const [urlInput, setUrlInput] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<LiveAnalysisResult | null>(null);
  const [history, setHistory] = useState<LiveAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  // Filters for issues
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchHistory = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/live-analyses", { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0 && !activeAnalysis) {
          setActiveAnalysis(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartAnalysis = async (targetUrl?: string) => {
    const urlToAnalyze = targetUrl || urlInput;
    if (!urlToAnalyze.trim()) {
      setError("Please input a valid website address.");
      return;
    }

    setIsLoading(true);
    setError("");
    setStatusMessage("Initializing secure connections...");

    // Timed step feedback to keep user informed of background server tasks
    const messages = [
      { text: "Pinging target host servers...", delay: 800 },
      { text: "Retrieving HTML documents and assets...", delay: 1800 },
      { text: "Crawling external page hyperlinks to inspect broken links...", delay: 3000 },
      { text: "Triggering Google Lighthouse (PageSpeed) engine API...", delay: 4500 },
      { text: "Synthesizing UI/UX recommendations with Gemini AI...", delay: 7000 }
    ];

    const timeouts = messages.map(m => {
      return setTimeout(() => setStatusMessage(m.text), m.delay);
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/analyze-website", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: urlToAnalyze })
      });

      timeouts.forEach(clearTimeout);

      if (!res.ok) {
        throw new Error("The network analysis request was rejected by the server.");
      }

      const result: LiveAnalysisResult = await res.json();
      setActiveAnalysis(result);
      if (!targetUrl) {
        setUrlInput("");
      }
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || "Failed to complete live web audit.");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  // Helper to colorize score badges
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", stroke: "stroke-emerald-500" };
    if (score >= 70) return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", stroke: "stroke-amber-500" };
    return { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", stroke: "stroke-rose-500" };
  };

  const filteredIssues = activeAnalysis?.issues.filter(issue => {
    const matchesCat = categoryFilter === "all" || issue.type === categoryFilter;
    const matchesSev = severityFilter === "all" || issue.severity === severityFilter;
    return matchesCat && matchesSev;
  }) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-600 animate-pulse" />
            Live Application & UX Auditor
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Diagnose speed metrics, SEO headers, accessibility elements, mobile responsive tags, and security defenses on live student deployments. Powered by Google Lighthouse and Gemini AI.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchHistory()} 
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer"
            title="Refresh history logs"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Audit Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-base font-bold text-slate-950 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Initiate New Live Audit
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled={isLoading}
                    placeholder="Enter deployment URL (e.g. hackathon-app.web.app or localhost:3000)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) handleStartAnalysis();
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 bg-white rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={() => handleStartAnalysis()}
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLoading ? "Running..." : "Analyze URL"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {isLoading && (
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      {statusMessage}
                    </span>
                    <span className="text-slate-400 font-mono">Running Lighthouse...</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full animate-bar-load" style={{ width: "80%" }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Note: Running headless Chrome simulation with Google PageSpeed and executing prompt synthesis. This can take up to 10 seconds.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Analysis Detail view */}
          {activeAnalysis ? (
            <div className="space-y-6">
              {/* Summary card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Target Deploy Host</span>
                    <h2 className="text-lg font-mono font-bold text-indigo-300 break-all">{activeAnalysis.url}</h2>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {activeAnalysis.available ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Response Time</span>
                    <span className="text-sm font-sans font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {activeAnalysis.responseTimeMs}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">HTTP Code</span>
                    <span className="text-sm font-mono font-bold text-amber-400">
                      {activeAnalysis.statusCode || "Connection Failed"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Audit Stamp</span>
                    <span className="text-sm font-sans font-semibold">
                      {new Date(activeAnalysis.analyzedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Audit Defects</span>
                    <span className="text-sm font-sans font-bold text-rose-400">
                      {activeAnalysis.issues.length} Issues found
                    </span>
                  </div>
                </div>
              </div>

              {/* Bento grid Score Gauges */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. Performance */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speed index</span>
                    <Gauge className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.performance_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.performance_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.performance_score).text}`}>
                      {activeAnalysis.performance_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Performance</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">RTT latency & assets minification</p>
                  </div>
                </div>

                {/* 2. Accessibility */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">A11y standards</span>
                    <Cpu className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.accessibility_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.accessibility_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.accessibility_score).text}`}>
                      {activeAnalysis.accessibility_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Accessibility</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Alt tags & doc structured hierarchy</p>
                  </div>
                </div>

                {/* 3. SEO */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discoverability</span>
                    <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.seo_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.seo_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.seo_score).text}`}>
                      {activeAnalysis.seo_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">SEO Audit</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Title, description & key tags</p>
                  </div>
                </div>

                {/* 4. UX */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual & Links</span>
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.ux_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.ux_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.ux_score).text}`}>
                      {activeAnalysis.ux_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">UI/UX Quality</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Design balance & crawler health</p>
                  </div>
                </div>

                {/* 5. Security */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Headers Shields</span>
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.security_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.security_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.security_score).text}`}>
                      {activeAnalysis.security_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Security Headers</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">CSP, HSTS, XFO & security options</p>
                  </div>
                </div>

                {/* 6. Mobile */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center flex flex-col justify-between items-center space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Responsiveness</span>
                    <Smartphone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="currentColor" fill="transparent"
                        className={`${getScoreColor(activeAnalysis.mobile_responsiveness_score).text} transition-all duration-1000`}
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - activeAnalysis.mobile_responsiveness_score / 100)}
                      />
                    </svg>
                    <span className={`absolute text-lg font-extrabold ${getScoreColor(activeAnalysis.mobile_responsiveness_score).text}`}>
                      {activeAnalysis.mobile_responsiveness_score}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Mobile Adaptability</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Viewport scale & responsive fits</p>
                  </div>
                </div>
              </div>

              {/* Diagnostic Issues List */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Remediation & Diagnostics Checklist
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Filter and solve coding defects identified by Google Lighthouse audits.</p>
                  </div>
                  
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-1.5">
                    {["all", "performance", "accessibility", "seo", "ux", "security", "mobile"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer uppercase tracking-wider transition-colors ${
                          categoryFilter === cat 
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-900">Zero Critical Defects Discovered</h4>
                    <p className="text-xs text-slate-400 mt-1">This module meets compliance scores in the selected categories!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredIssues.map((issue, idx) => {
                      const getSeverityStyle = (s: string) => {
                        if (s === "high") return "bg-rose-50 text-rose-700 border-rose-100";
                        if (s === "medium") return "bg-amber-50 text-amber-700 border-amber-100";
                        return "bg-slate-50 text-slate-700 border-slate-200";
                      };

                      return (
                        <div key={idx} className="p-6 hover:bg-slate-50/30 transition-all space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getSeverityStyle(issue.severity)}`}>
                                  {issue.severity} severity
                                </span>
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                  {issue.type}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                {issue.message}
                              </h4>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-2.5">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-900 block font-semibold mb-0.5">Remediation Steps:</strong>
                                <span className="leading-relaxed">{issue.recommendation}</span>
                              </div>
                            </div>
                            
                            {/* Code snippet fallback generator for typical recommendations */}
                            <div className="border-t border-slate-200/60 pt-2.5 mt-2.5">
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mb-1.5">
                                <Code className="w-3 h-3 text-slate-500" />
                                Recommended Implementation
                              </span>
                              <pre className="bg-slate-950 text-slate-200 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                                {issue.type === "security" && issue.message.includes("CSP") && (
                                  `# nginx.conf\nadd_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';";`
                                )}
                                {issue.type === "security" && issue.message.includes("HSTS") && (
                                  `# Express Server\napp.use((req, res, next) => {\n  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");\n  next();\n});`
                                )}
                                {issue.type === "security" && issue.message.includes("X-Frame") && (
                                  `# Helmet middleware / Express\nres.setHeader("X-Frame-Options", "SAMEORIGIN");`
                                )}
                                {issue.type === "mobile" && (
                                  `<!-- index.html -->\n<meta name="viewport" content="width=device-width, initial-scale=1.0">`
                                )}
                                {issue.type === "accessibility" && (
                                  `<!-- React Compliance -->\n<img src={logo} alt="HackEval Platform Main Branding" className="w-12 h-12" />`
                                )}
                                {issue.type === "performance" && (
                                  `// Vite configuration\nbuild: {\n  minify: "terser",\n  cssMinify: true,\n  rollupOptions: { ... }\n}`
                                )}
                                {issue.type === "seo" && (
                                  `<head>\n  <title>HackEval Platform - Advanced evaluations</title>\n  <meta name="description" content="Detailed analytical scoring.">\n</head>`
                                )}
                                {!["security", "mobile", "accessibility", "performance", "seo"].includes(issue.type) && (
                                  `// Compliance recommendation patch applied.`
                                )}
                              </pre>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-12 text-center text-slate-500 rounded-2xl">
              <Globe className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-900">Ready to audit live applets</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Provide an absolute web address above and trigger our automated auditing workspace to extract performance and UX scores!
              </p>
            </div>
          )}
        </div>

        {/* Audit logs History panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-950 mb-3 flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-indigo-600" />
              Audit History Logs
            </h2>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Previously audited target URLs on this platform. Click on any record to load details instantly.
            </p>

            {history.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                No audited history records found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {history.map((h, index) => {
                  const avgScore = Math.round(
                    (h.performance_score + h.accessibility_score + h.seo_score + h.ux_score + h.security_score + h.mobile_responsiveness_score) / 6
                  );
                  const isSelected = activeAnalysis?.url === h.url;

                  return (
                    <div
                      key={index}
                      onClick={() => setActiveAnalysis(h)}
                      className={`p-4 border rounded-xl transition-all cursor-pointer text-left space-y-2 hover:bg-slate-50/50 ${
                        isSelected 
                          ? "bg-indigo-50/50 border-indigo-200 shadow-sm" 
                          : "bg-white border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-700 truncate max-w-[160px] break-all block">
                          {h.url.replace(/^https?:\/\//i, "")}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getScoreColor(avgScore).bg} ${getScoreColor(avgScore).text} ${getScoreColor(avgScore).border}`}>
                          {avgScore}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {h.responseTimeMs}ms
                        </span>
                        <span>
                          {new Date(h.analyzedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Code Reference Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Auditing Checklist Specifications</h3>
            <ul className="text-xs space-y-3 text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Lighthouse Core</strong>: Measures and extracts web performance categories.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Security Shield</strong>: Validates security headers (CSP, HSTS, XFO, XCTO).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Compliance Scan</strong>: Inspects missing alt properties, meta titles, & descriptions.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Broken Links Crawler</strong>: Traces anchor links to find 404/500 errors.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

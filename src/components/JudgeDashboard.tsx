import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Eye, Sparkles, CheckCircle, Clock, RefreshCw, AlertCircle, Send, MessageSquare, HelpCircle, Bot } from "lucide-react";
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

  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello Judge! I am your AI Judge Assistant. I have read all project details, AI scores, and panel scorecard reviews. Ask me anything about the team submissions, rankings, or specific criteria details!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

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

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || sending) return;

    // Add user message to state
    const userMsg = { sender: "user" as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setChatInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-judge-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: textToSend })
      });

      if (!res.ok) throw new Error("Failed to reach AI Judge Assistant.");
      const data = await res.json();
      
      setMessages(prev => [...prev, { sender: "ai", text: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: "ai", text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

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

      {/* Split layout: left column has projects list, right column has AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
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

        {/* Right column: AI Judge Assistant Chat */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden sticky top-6">
            {/* Assistant Header */}
            <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2 text-white shrink-0">
              <div className="p-1 rounded bg-indigo-500 text-white shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-xs leading-none text-white animate-fade-in">AI Judge Assistant</h3>
                <p className="text-[9px] text-indigo-100 font-medium mt-0.5 animate-fade-in">Academic & Quality Oracle</p>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/40">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender === "ai" && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 self-start border border-indigo-100">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-br-none font-medium shadow-sm" 
                      : "bg-white text-slate-800 rounded-bl-none shadow-xs border border-slate-200/60 whitespace-pre-wrap"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 self-start border border-indigo-100">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-white text-slate-400 rounded-bl-none border border-slate-200/60 shadow-xs flex items-center gap-1.5 py-3">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions list */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 space-y-1.5 shrink-0">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-indigo-500" /> Suggested Queries
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { label: "❓ Why did EcoSphere receive 90+ points?", query: "Why did EcoSphere receive such high points?" },
                  { label: "⚖️ Compare EcoSphere and EduPulse", query: "Compare EcoSphere and EduPulse." },
                  { label: "🏆 What are the strongest projects?", query: "What are the strongest projects?" },
                  { label: "💡 Which project has the highest innovation?", query: "Which project has the highest innovation?" }
                ].map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={sending}
                    onClick={() => handleSendQuery(sug.query)}
                    className="bg-white hover:bg-indigo-50/50 active:bg-indigo-100/50 border border-slate-200 hover:border-indigo-200 rounded-lg px-2.5 py-1.5 text-left text-[10px] text-slate-600 hover:text-indigo-700 font-medium transition-all shadow-xs cursor-pointer truncate max-w-full"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Box */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
              className="p-2.5 bg-white border-t border-slate-100 flex gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask about project details, innovation..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={sending}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sending}
                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-300 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

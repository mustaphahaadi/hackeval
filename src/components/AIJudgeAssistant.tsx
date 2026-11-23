import React, { useState } from "react";
import { Sparkles, Send, RefreshCw, AlertCircle, MessageSquare } from "lucide-react";

interface AIJudgeAssistantProps {
  token: string;
  hackathonId?: string;
  hackathonName?: string;
}

const SUGGESTED_PROMPTS = [
  "Which project is the strongest overall?",
  "Compare the top two projects",
  "Which project has the highest innovation score?",
  "Which submissions are still pending evaluation?"
];

export function AIJudgeAssistant({ token, hackathonId, hackathonName }: AIJudgeAssistantProps) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [askedQuery, setAskedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (promptText?: string) => {
    const q = (promptText ?? query).trim();
    if (!q) return;

    setLoading(true);
    setError("");
    setAskedQuery(q);
    if (promptText) setQuery(promptText);

    try {
      const res = await fetch("/api/ai-judge-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: q, hackathonId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to query the AI Judge Assistant.");
      }
      setAnswer(data.answer || "No analysis returned.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              AI Judging Co-Pilot
            </h3>
            <p className="text-xs text-slate-500">
              Ask analytical questions grounded in live scores, criteria, and judge feedback{hackathonName ? ` for ${hackathonName}` : ""}.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about rankings, score breakdowns, or compare competing teams..."
          className="flex-1 px-4 py-2.5 border border-slate-300 bg-slate-50/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Ask Assistant
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={loading}
            onClick={() => handleAsk(prompt)}
            className="text-xs font-medium px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            Response · "{askedQuery}"
          </div>
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}

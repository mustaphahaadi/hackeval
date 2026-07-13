import React, { useState, useRef, useEffect } from "react";
import { FolderGit, Upload, Globe, Link, Youtube, HelpCircle, Sparkles, Check, AlertCircle } from "lucide-react";
import { HackathonEvent } from "../types";

interface ProjectSubmissionFormProps {
  token?: string;
  preselectedHackathonId?: string | null;
  onSuccess: (hackathonId?: string) => void;
  onCancel: () => void;
}

export function ProjectSubmissionForm({ 
  token, 
  preselectedHackathonId, 
  onSuccess, 
  onCancel 
}: ProjectSubmissionFormProps) {
  const [projectName, setProjectName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [aiStudioUrl, setAiStudioUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [demoVideoUrl, setDemoVideoUrl] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  
  const [hackathonsList, setHackathonsList] = useState<HackathonEvent[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for on-the-fly Hackathon Setup
  const [showCreateHkForm, setShowCreateHkForm] = useState(false);
  const [newHkName, setNewHkName] = useState("");
  const [newHkDesc, setNewHkDesc] = useState("");
  const [newHkStart, setNewHkStart] = useState("");
  const [newHkEnd, setNewHkEnd] = useState("");
  const [creatingHk, setCreatingHk] = useState(false);
  const [hkSuccessMsg, setHkSuccessMsg] = useState("");

  const handleCreateHackathonOnTheFly = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setHkSuccessMsg("");

    if (!newHkName || !newHkDesc || !newHkStart || !newHkEnd) {
      setError("Please fill out all fields to set up a new hackathon project.");
      return;
    }

    setCreatingHk(true);
    try {
      const body = {
        name: newHkName,
        description: newHkDesc,
        startDate: newHkStart,
        endDate: newHkEnd,
        active: true
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to set up new hackathon.");
      }

      // Add to list, select it, and close form
      setHackathonsList(prev => [...prev, data]);
      setSelectedHackathonId(data.id);
      setHkSuccessMsg(`Successfully set up Hackathon: "${data.name}"! It is now selected.`);
      setShowCreateHkForm(false);
      
      // Clear inputs
      setNewHkName("");
      setNewHkDesc("");
      setNewHkStart("");
      setNewHkEnd("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingHk(false);
    }
  };

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await fetch("/api/hackathons");
        if (res.ok) {
          const data: HackathonEvent[] = await res.json();
          setHackathonsList(data);
          
          if (preselectedHackathonId) {
            setSelectedHackathonId(preselectedHackathonId);
          } else {
            // Auto select active hackathon or first one
            const active = data.find(h => h.active);
            if (active) {
              setSelectedHackathonId(active.id);
            } else if (data.length > 0) {
              setSelectedHackathonId(data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load hackathons", err);
      }
    };
    fetchHackathons();
  }, [preselectedHackathonId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDocFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!projectName || !teamName || !description || !problemStatement || !githubUrl) {
      setError("Please fill out all mandatory fields: Project Name, Team Name, Description, Problem Statement, and GitHub Repository URL.");
      return;
    }

    setLoading(true);

    try {
      // Create the submission body
      const body = {
        projectName,
        teamName,
        teamMembers,
        description,
        problemStatement,
        githubUrl,
        aiStudioUrl,
        liveUrl,
        demoVideoUrl,
        presentationDocName: docFile ? docFile.name : "slides.pdf",
        presentationDocUrl: docFile ? `https://example.com/uploads/${docFile.name}` : "https://example.com/slides.pdf",
        hackathonId: selectedHackathonId
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit project.");
      }

      onSuccess(selectedHackathonId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-xl font-sans font-bold text-slate-950 flex items-center gap-2">
          <FolderGit className="w-5 h-5 text-indigo-600" />
          Submit Hackathon Entry
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete the 10 fields below to register your product prototype. All submissions are automatically evaluated by our AI evaluator upon receipt.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex gap-2 text-rose-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hackathon Selection */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Target Hackathon *</label>
            <button
              type="button"
              onClick={() => { setShowCreateHkForm(!showCreateHkForm); setHkSuccessMsg(""); setError(""); }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer bg-none border-none p-0"
            >
              {showCreateHkForm ? "Cancel setup" : "+ Set up a new Hackathon"}
            </button>
          </div>

          {hkSuccessMsg && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg text-emerald-700 text-xs font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              {hkSuccessMsg}
            </div>
          )}

          {showCreateHkForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Set Up New Hackathon Event</h4>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Event Name *</label>
                  <input
                    type="text"
                    value={newHkName}
                    onChange={(e) => setNewHkName(e.target.value)}
                    placeholder="e.g. PennApps Fall 2026"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Description *</label>
                  <textarea
                    rows={2}
                    value={newHkDesc}
                    onChange={(e) => setNewHkDesc(e.target.value)}
                    placeholder="e.g. Premium academic innovation hackathon focused on AI and web solutions."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Start Date *</label>
                    <input
                      type="date"
                      value={newHkStart}
                      onChange={(e) => setNewHkStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">End Date *</label>
                    <input
                      type="date"
                      value={newHkEnd}
                      onChange={(e) => setNewHkEnd(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateHkForm(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold rounded-lg text-slate-700 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingHk}
                  onClick={handleCreateHackathonOnTheFly}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-none"
                >
                  {creatingHk ? "Setting up..." : "Set Up & Select"}
                </button>
              </div>
            </div>
          )}

          <select
            required
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
          >
            {hackathonsList.length === 0 ? (
              <option value="">No hackathons configured yet</option>
            ) : (
              hackathonsList.map((hk) => (
                <option key={hk.id} value={hk.id}>
                  {hk.name} {hk.active ? "(Active Now)" : ""}
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Choose the specific event you are establishing this submission under.
          </p>
        </div>

        {/* Row 1: Project & Team Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. EcoSphere"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. GreenEarth Developers"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Team Members */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Team Members (Comma Separated)</label>
          <input
            type="text"
            value={teamMembers}
            onChange={(e) => setTeamMembers(e.target.value)}
            placeholder="e.g. Alice Johnson, Bob Smith, Sarah Connor"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Project Description *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Give a deep overview of how your product works, the architecture, and core features..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Problem Statement */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Problem Statement *</label>
          <textarea
            required
            rows={3}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="What real-world problem does your hackathon project solve?"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Grid URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <FolderGit className="w-3.5 h-3.5 text-slate-400" />
              GitHub Repository URL *
            </label>
            <input
              type="url"
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Google AI Studio App URL
            </label>
            <input
              type="url"
              value={aiStudioUrl}
              onChange={(e) => setAiStudioUrl(e.target.value)}
              placeholder="https://ai.studio/build/app/..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Live Deployed Application URL
            </label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://project-demo.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-rose-500" />
              Demo Video URL (YouTube / Vimeo)
            </label>
            <input
              type="url"
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Drag and Drop Presentation Doc Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Presentation Document Upload</label>
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              dragActive 
                ? "border-indigo-500 bg-indigo-50/40" 
                : docFile 
                ? "border-emerald-300 bg-emerald-50/20" 
                : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.ppt,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {docFile ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{docFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(docFile.size / (1024 * 1024)).toFixed(2)} MB • File selected</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Drag & drop your presentation slides here, or <span className="text-indigo-600 font-bold">browse</span></p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, PPTX, PPT, DOCX up to 15MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <Check className="w-4 h-4" /> Submit Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Shield, Users, Award, Calendar, RefreshCw, AlertCircle, Check, Trash, Power, Download, Edit, Save, Search, FolderGit, ArrowLeft, Play, BarChart2, Eye, FileDown, UserPlus, Sparkles } from "lucide-react";
import { User, HackathonEvent, ProjectSubmission, Certificate } from "../types";
import { CertificateModal } from "./CertificateModal.js";
import { downloadCertificatePdf, getSuggestedAwardForRank } from "../utils/certificateGenerator.js";

interface AdminDashboardProps {
  token: string;
  onOpenCertStudio?: () => void;
}

const safeExternalUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export function AdminDashboard({ token, onOpenCertStudio }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([]);
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Certificate viewer & export states
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyIssuedCert, setNewlyIssuedCert] = useState<Certificate | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<"overview" | "roles" | "teams" | "certs" | "events" | "export">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Deletion confirmation states
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState<string | null>(null);
  const [confirmDeleteHkId, setConfirmDeleteHkId] = useState<string | null>(null);
  const [confirmDeleteCertId, setConfirmDeleteCertId] = useState<string | null>(null);

  // Specific Project manual scoring states (0-100 scale, default 80)
  const [reviewingProjId, setReviewingProjId] = useState<string | null>(null);
  const [reviewIdea, setReviewIdea] = useState(80);
  const [reviewInnovation, setReviewInnovation] = useState(80);
  const [reviewCodeQuality, setReviewCodeQuality] = useState(80);
  const [reviewReadme, setReviewReadme] = useState(80);
  const [reviewUi, setReviewUi] = useState(80);
  const [reviewAiUsage, setReviewAiUsage] = useState(80);
  const [reviewTechnical, setReviewTechnical] = useState(80);
  const [reviewFeedback, setReviewFeedback] = useState("");

  // Specific Project single AI evaluation loading state
  const [singleEvalLoadingId, setSingleEvalLoadingId] = useState<string | null>(null);

  // Hackathon Event inline editing state
  const [isEditingHk, setIsEditingHk] = useState(false);
  const [editHkName, setEditHkName] = useState("");
  const [editHkDesc, setEditHkDesc] = useState("");
  const [editHkStart, setEditHkStart] = useState("");
  const [editHkEnd, setEditHkEnd] = useState("");

  // Hackathon detailed view
  const [selectedHk, setSelectedHk] = useState<HackathonEvent | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [hkLeaderboard, setHkLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const fetchHkLeaderboard = async () => {
    if (!selectedHk) return;
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?hackathonId=${selectedHk.id}`);
      if (res.ok) {
        const data = await res.json();
        setHkLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch hackathon leaderboard", err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchHkLeaderboard();
  }, [selectedHk, projects]);

  // Team management states
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState("");
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [editLiveUrl, setEditLiveUrl] = useState("");
  const [editTeamSearchTerm, setEditTeamSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkAIEvaluation = async (force = false) => {
    setError("");
    setSuccess("");
    setBulkLoading(true);
    try {
      const res = await fetch("/api/evaluate-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ force })
      });
      if (!res.ok) throw new Error("Failed to execute bulk AI evaluation.");
      const data = await res.json();
      setSuccess(
        data.evaluatedCount > 0
          ? `Evaluated ${data.evaluatedCount} submission(s)${data.skippedEvaluatedCount ? ` and preserved ${data.skippedEvaluatedCount} already-ranked project(s)` : ""}. Official rankings synced.`
          : `All ${data.totalProjects ?? projects.length} projects already have AI evaluations; existing rankings remain locked.`
      );
      await fetchData(); // Refresh list to update scores instantly
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAnalyzeAndRank = async (hkId: string, force = false) => {
    setError("");
    setSuccess("");
    setRankLoading(true);
    try {
      const res = await fetch("/api/evaluate-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hackathonId: hkId, force })
      });
      if (!res.ok) throw new Error("Failed to execute hackathon AI evaluation and ranking.");
      const data = await res.json();
      setSuccess(
        data.evaluatedCount > 0
          ? `Evaluated ${data.evaluatedCount} new/pending submission(s)${data.skippedEvaluatedCount ? ` while keeping ${data.skippedEvaluatedCount} previously graded project(s) unchanged` : ""}. Official rankings locked.`
          : `All submissions in this event are already evaluated; official rankings verified and locked.`
      );
      await fetchData(); // Refresh data to pull updated scores and statuses
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRankLoading(false);
    }
  };

  // Certificate form states
  const [selectedCertHackathonId, setSelectedCertHackathonId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [certName, setCertName] = useState("");
  const [certEmail, setCertEmail] = useState("");
  const [certRole, setCertRole] = useState("auto");
  const [issuingCert, setIssuingCert] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState<Array<{ name: string; email: string }>>([]);

  // Hackathon form states
  const [hkName, setHkName] = useState("");
  const [hkDesc, setHkDesc] = useState("");
  const [hkStart, setHkStart] = useState("");
  const [hkEnd, setHkEnd] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Fetch Users
      const uRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!uRes.ok) throw new Error("Failed to load user directories.");
      const uData = await uRes.json();
      setUsers(uData);

      // Fetch Hackathons
      const hRes = await fetch("/api/hackathons", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHackathons(hData);
      }

      // Fetch Projects
      const pRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData);
        if (pData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(pData[0].id);
        }
      }

      // Fetch Certificates
      const cRes = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCertificates(cData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) throw new Error("Failed to change user access role.");
      setSuccess("User role updated successfully.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Sync batch recipients list & rank-aware award suggestion whenever selected project changes
  useEffect(() => {
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) {
      setBatchRecipients([]);
      return;
    }
    const members = (proj.teamMembers || "")
      .split(",")
      .map(m => m.trim())
      .filter(Boolean);
    setBatchRecipients(
      members.map(mName => {
        const matchedUser = users.find(u => u.name.trim().toLowerCase() === mName.toLowerCase());
        const slug = mName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "member";
        return {
          name: mName,
          email: matchedUser?.email || `${slug}.${proj.id}@participant.hackeval.edu`
        };
      })
    );
    setCertRole(
      getSuggestedAwardForRank(
        proj.officialRank ?? null,
        proj.status === "evaluated" || typeof proj.combinedScore === "number"
      )
    );
  }, [selectedProjectId, projects, users]);

  const handleOpenCertsForProject = (proj: ProjectSubmission) => {
    setSelectedCertHackathonId(proj.hackathonId || "all");
    setSelectedProjectId(proj.id);
    setSubTab("certs");
    setError("");
    setSuccess("");
  };

  const handleGenerateProjectTeamCertificates = async () => {
    if (!selectedProjectId) return;
    setError("");
    setSuccess("");
    setNewlyIssuedCert(null);
    setIssuingCert(true);
    try {
      const res = await fetch("/api/admin/certificates/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          role: certRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate project certificates.");
      }
      await fetchData();
      if (data.certificates?.[0]) {
        setNewlyIssuedCert(data.certificates[0]);
      }
      setSuccess(
        `Generated ${data.issuedCount} project-linked A4 certificate(s) with designation "${data.role}".`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNewlyIssuedCert(null);

    if (!selectedProjectId || !certName.trim() || !certEmail.trim() || !certRole.trim()) {
      setError("Please fill in all certificate configuration details.");
      return;
    }

    setIssuingCert(true);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          recipientEmail: certEmail.trim(),
          recipientName: certName.trim(),
          role: certRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue certificate.");
      }

      setCertName("");
      setCertEmail("");
      await fetchData();
      setNewlyIssuedCert(data);
      setSuccess(`Certificate issued to ${data.recipientName} (${data.certificateCode}).`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleBatchIssueCertificates = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNewlyIssuedCert(null);

    const validRecipients = batchRecipients.filter(r => r.name.trim() && r.email.trim());
    if (!selectedProjectId || validRecipients.length === 0 || !certRole) {
      setError("Provide both name and email for at least one team member to batch issue certificates.");
      return;
    }

    setIssuingCert(true);
    try {
      const res = await fetch("/api/admin/certificates/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          recipients: validRecipients,
          role: certRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to batch issue certificates.");
      }

      await fetchData();
      if (data.certificates?.[0]) {
        setNewlyIssuedCert(data.certificates[0]);
      }
      setSuccess(`Batch issuance complete: ${data.issuedCount} verifiable certificates issued.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIssuingCert(false);
    }
  };

  const handleDirectCertPdf = async (cert: Certificate) => {
    setDownloadingCertId(cert.id);
    setError("");
    try {
      await downloadCertificatePdf(cert);
    } catch (err: any) {
      setError(err?.message || "Failed to export A4 PDF.");
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hkName,
          description: hkDesc,
          startDate: hkStart,
          endDate: hkEnd,
          active: false
        })
      });

      if (!res.ok) throw new Error("Failed to create hackathon event.");
      setSuccess(`Hackathon Event "${hkName}" added successfully.`);
      setHkName("");
      setHkDesc("");
      setHkStart("");
      setHkEnd("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleHackathonActive = async (hkId: string, currentActive: boolean) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/hackathons/${hkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (!res.ok) throw new Error("Failed to modify event active status.");
      setSuccess("Hackathon active status toggled. All other active events deactivated.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateHackathon = async (hkId: string, updatedFields: Partial<HackathonEvent>) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/hackathons/${hkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });

      if (!res.ok) throw new Error("Failed to update hackathon details.");
      setSuccess("Hackathon details updated successfully.");
      if (selectedHk && selectedHk.id === hkId) {
        setSelectedHk({ ...selectedHk, ...updatedFields });
      }
      setIsEditingHk(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleScoreProject = async (projectId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          scores: {
            idea: Number(reviewIdea),
            innovation: Number(reviewInnovation),
            codeQuality: Number(reviewCodeQuality),
            readme: Number(reviewReadme),
            ui: Number(reviewUi),
            aiUsage: Number(reviewAiUsage),
            technical: Number(reviewTechnical)
          },
          feedback: reviewFeedback
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit organizer review.");
      }

      setSuccess("Organizer review and scores submitted successfully!");
      setReviewingProjId(null);
      setReviewFeedback("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSingleAIEvaluation = async (projectId: string) => {
    setError("");
    setSuccess("");
    setSingleEvalLoadingId(projectId);
    try {
      const res = await fetch(`/api/evaluate/${projectId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to evaluate project using AI.");
      const data = await res.json();
      setSuccess(`AI Evaluation completed successfully! Overall score: ${data.overallScore}/100.`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSingleEvalLoadingId(null);
    }
  };

  const handleStartEdit = (p: ProjectSubmission) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.projectName);
    setEditTeamName(p.teamName);
    setEditTeamMembers(p.teamMembers || "");
    setEditGithubUrl(p.githubUrl || "");
    setEditLiveUrl(p.liveUrl || "");
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
  };

  const handleSaveTeamEdit = async (projectId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: editProjectName,
          teamName: editTeamName,
          teamMembers: editTeamMembers,
          githubUrl: editGithubUrl,
          liveUrl: editLiveUrl
        })
      });

      if (!res.ok) throw new Error("Failed to update team details.");
      setSuccess("Team details updated successfully.");
      setEditingProjectId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete project submission.");
      setSuccess("Project submission deleted successfully.");
      setConfirmDeleteProjId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteHackathon = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/hackathons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete hackathon event.");
      setSuccess("Hackathon event and all associated projects deleted successfully.");
      setConfirmDeleteHkId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to revoke certificate.");
      setSuccess("Certificate/award revoked successfully.");
      setConfirmDeleteCertId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportCSV = async () => {
    setError("");
    setSuccess("");
    setExportLoading(true);
    try {
      const res = await fetch("/api/leaderboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch current leaderboard rankings for export.");
      const leaderboardData = await res.json();

      if (leaderboardData.length === 0) {
        throw new Error("No evaluated teams are available to export yet.");
      }

      const headers = [
        "Rank",
        "Project Name",
        "Team Name",
        "AI Evaluation Score",
        "Organizer Average Score",
        "Combined Score (40/60)",
        "Evaluation Status"
      ];

      const rows = leaderboardData.map((item: any) => [
        item.rank,
        `"${String(item.projectName || "").replace(/"/g, '""')}"`,
        `"${String(item.teamName || "").replace(/"/g, '""')}"`,
        item.aiOverallScore !== null ? item.aiOverallScore : "Pending",
        item.judgeAverageScore !== null ? item.judgeAverageScore : "Pending",
        item.combinedScore > 0 ? item.combinedScore : "Unranked",
        item.aiOverallScore !== null || item.judgeAverageScore !== null ? "Evaluated" : "Pending"
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `hackathon_leaderboard_results_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess("Leaderboard results exported successfully to CSV!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Admin Console
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Platform operations: role access, submission management, verifiable A4 certificates, and hackathon events.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload Panel
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 text-rose-700 text-sm rounded-xl font-medium flex gap-2 items-center">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm rounded-xl font-medium flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          {newlyIssuedCert && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDirectCertPdf(newlyIssuedCert)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download A4 PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCertificate(newlyIssuedCert);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview A4 & QR
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <button
          onClick={() => setSubTab("overview")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            subTab === "overview" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Platform Overview
        </button>
        <button
          onClick={() => setSubTab("roles")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "roles" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          User Permissions ({users.length})
        </button>
        <button
          onClick={() => setSubTab("teams")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "teams" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FolderGit className="w-4 h-4 inline mr-1" />
          Manage Teams ({projects.length})
        </button>
        <button
          onClick={() => setSubTab("certs")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "certs" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 inline mr-1" />
          Issue Awards / Certs
        </button>
        <button
          onClick={() => setSubTab("events")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "events" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          Hackathon Events ({hackathons.length})
        </button>
        <button
          onClick={() => setSubTab("export")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "export" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Download className="w-4 h-4 inline mr-1" />
          Export Results
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {subTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              {/* KPIs Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-5 space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Active Hackathons</span>
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {hackathons.filter(h => h.active).length}
                    </span>
                    <span className="text-xs text-slate-400">/ {hackathons.length} total</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium">Published and receiving projects</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-5 space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Registered Teams</span>
                    <FolderGit className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {projects.length}
                    </span>
                    <span className="text-xs text-slate-400">registered</span>
                  </div>
                  <p className="text-[11px] text-indigo-600 font-medium">Submissions synced across all events</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-5 space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">AI Scored Rate</span>
                    <Power className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {projects.length > 0 ? Math.round((projects.filter(p => p.status === "evaluated").length / projects.length) * 100) : 0}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({projects.filter(p => p.status === "evaluated").length}/{projects.length})
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${projects.length > 0 ? (projects.filter(p => p.status === "evaluated").length / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 rounded-xl p-5 space-y-2 text-left">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Awards Issued</span>
                    <Award className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {certificates.length}
                    </span>
                    <span className="text-xs text-slate-400">certificates</span>
                  </div>
                  <p className="text-[11px] text-purple-600 font-medium">Cryptographic credentials issued</p>
                </div>
              </div>

              {/* Playbook / Guidance */}
              <div className="bg-white border border-indigo-50 rounded-2xl p-6 sm:p-8 space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 shrink-0">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-slate-900 text-lg">Hackathon Operational Playbook</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Welcome to the administrator panel. Follow this standardized step-by-step guidance to initialize, manage, and close hackathons on the HackEval platform.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Define Hackathon Events</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Go to the **Hackathon Events** tab to create a new event. Provide the timeline, description, and toggle its active state to publish it on the main catalog.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Manage Teams & Submissions</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          As participants register and push code, you can inspect their team names, project bios, and live/GitHub repository links in **Manage Teams**.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Trigger Autonomous AI Grading</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Trigger the bulk evaluator or click specific projects inside the Hackathon details page to analyze syntax trees, readme structures, and design aesthetics using Gemini.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        4
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Input Manual Jury Overrides</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Review details of specific events and input manual organizer ratings across criteria (Idea, UI, Code) to complement the automated AI scoring.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        5
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Establish and Export Standings</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          STANDARDIZED composite scores (40% AI, 60% manual) are generated in real-time. Head to the **Export Results** tab to download official standings to CSV.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-extrabold text-indigo-600 shrink-0 mt-0.5">
                        6
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Issue Academic Credentials</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Once rankings are locked, go to **Issue Awards / Certs** to create durable certificates with automated verification codes for participants to share on Vercel or LinkedIn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                  <button
                    onClick={() => setSubTab("events")}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Go to Events Setup
                  </button>
                  <button
                    onClick={() => setSubTab("teams")}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Inspect Project Submissions
                  </button>
                  <button
                    onClick={() => setSubTab("certs")}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Issue Verification Badge
                  </button>
                </div>
              </div>
            </div>
          )}

          {subTab === "roles" && (
            <div className="space-y-6">
              <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">User Accounts Directory</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role Access</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                            u.role === "Admin"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : u.role === "Judge"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {u.role !== "Participant" && (
                              <button
                                onClick={() => handleUpdateRole(u.id, "Participant")}
                                className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 font-semibold cursor-pointer"
                              >
                                Set Participant
                              </button>
                            )}
                            {u.role !== "Judge" && (
                              <button
                                onClick={() => handleUpdateRole(u.id, "Judge")}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 font-semibold cursor-pointer"
                              >
                                Make Judge
                              </button>
                            )}
                            {u.role !== "Admin" && (
                              <button
                                onClick={() => handleUpdateRole(u.id, "Admin")}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-200 font-semibold cursor-pointer"
                              >
                                Make Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === "teams" && (
            <div className="space-y-6">
              {/* Bulk AI Evaluation Banner Panel */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white p-6 sm:p-8 rounded-2xl shadow-sm border border-indigo-500 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h4 className="font-sans font-bold text-white text-xl tracking-tight flex items-center gap-2">
                      <Power className="w-5 h-5 text-indigo-200" />
                      Autonomous AI Hackathon Evaluator
                    </h4>
                    <p className="text-indigo-100 text-sm max-w-xl leading-relaxed">
                      Command the AI evaluation engine to inspect GitHub repositories, parse source files, review documentation, and compute criteria scorecards for all registered submissions.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleBulkAIEvaluation(false)}
                      disabled={bulkLoading || projects.length === 0}
                      className="px-5 py-3 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl shadow transition-colors cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {bulkLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          Running Evaluation Engine...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Grade Pending & Sync Ranks
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAIEvaluation(true)}
                      disabled={bulkLoading || projects.length === 0}
                      className="px-4 py-3 bg-indigo-800/70 hover:bg-indigo-800 text-white font-semibold text-xs rounded-xl border border-indigo-400/40 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                      title="Force Gemini re-evaluation on every project"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${bulkLoading ? "animate-spin" : ""}`} />
                      Re-evaluate All
                    </button>
                  </div>
                </div>
                {bulkLoading && (
                  <div className="bg-indigo-800/40 p-4 rounded-xl border border-indigo-400/30">
                    <p className="text-xs text-indigo-100 font-medium flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      Analyzing codebases, parsing documents, and locking deterministic rankings...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-lg">Manage Registered Teams</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Edit project details, modify team name / members, and monitor tech stacks across all event registrations.
                  </p>
                </div>
                <div className="w-full sm:w-72 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search teams or projects..."
                    value={editTeamSearchTerm}
                    onChange={(e) => setEditTeamSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {projects.filter(p => 
                p.projectName.toLowerCase().includes(editTeamSearchTerm.toLowerCase()) ||
                p.teamName.toLowerCase().includes(editTeamSearchTerm.toLowerCase()) ||
                (p.teamMembers || "").toLowerCase().includes(editTeamSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No registered teams match your search keyword.
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.filter(p => 
                    p.projectName.toLowerCase().includes(editTeamSearchTerm.toLowerCase()) ||
                    p.teamName.toLowerCase().includes(editTeamSearchTerm.toLowerCase()) ||
                    (p.teamMembers || "").toLowerCase().includes(editTeamSearchTerm.toLowerCase())
                  ).map((proj) => {
                    const isEditing = editingProjectId === proj.id;
                    return (
                      <div key={proj.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-all bg-slate-50/20">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Project Title</label>
                                <input
                                  type="text"
                                  value={editProjectName}
                                  onChange={(e) => setEditProjectName(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Team Name</label>
                                <input
                                  type="text"
                                  value={editTeamName}
                                  onChange={(e) => setEditTeamName(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Team Members (comma separated)</label>
                              <input
                                type="text"
                                value={editTeamMembers}
                                onChange={(e) => setEditTeamMembers(e.target.value)}
                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">GitHub URL</label>
                                <input
                                  type="url"
                                  value={editGithubUrl}
                                  onChange={(e) => setEditGithubUrl(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Live Demo URL</label>
                                <input
                                  type="url"
                                  value={editLiveUrl}
                                  onChange={(e) => setEditLiveUrl(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveTeamEdit(proj.id)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-semibold text-white cursor-pointer inline-flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" /> Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {typeof proj.officialRank === "number" && proj.officialRank > 0 && (
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Rank #{proj.officialRank}{typeof proj.combinedScore === "number" && proj.combinedScore > 0 ? ` · ${proj.combinedScore}/100` : ""}
                                  </span>
                                )}
                                <h4 className="font-bold text-slate-900 text-sm">{proj.projectName}</h4>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  proj.status === "evaluated" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                }`}>
                                  {proj.status === "evaluated" ? "Scored" : "Pending AI"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium">
                                Team: <span className="font-bold text-slate-800">{proj.teamName}</span>
                                {proj.hackathonName && (
                                  <span className="text-slate-400"> · {proj.hackathonName}</span>
                                )}
                              </p>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(proj.teamMembers || "").split(",").map(m => m.trim()).filter(Boolean).map((m: string, idx: number) => (
                                  <span key={idx} className="bg-slate-100 text-slate-700 rounded text-[10px] px-2 py-0.5 font-medium border border-slate-200">
                                    {m}
                                  </span>
                                ))}
                              </div>

                              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1.5 font-mono">
                                {safeExternalUrl(proj.githubUrl) && <div className="truncate">GitHub: <a href={safeExternalUrl(proj.githubUrl)!} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{proj.githubUrl}</a></div>}
                                {safeExternalUrl(proj.liveUrl) && <div className="truncate">Live Demo: <a href={safeExternalUrl(proj.liveUrl)!} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{proj.liveUrl}</a></div>}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 self-start md:self-center">
                              <button
                                type="button"
                                onClick={() => handleOpenCertsForProject(proj)}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Award className="w-3.5 h-3.5" /> Issue Cert
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(proj)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit details
                              </button>

                              {confirmDeleteProjId === proj.id ? (
                                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1">
                                  <span className="text-[10px] text-rose-700 font-bold px-1">Are you sure?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProject(proj.id)}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProjId(null)}
                                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProjId(proj.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Trash className="w-3.5 h-3.5" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {subTab === "export" && (
            <div className="space-y-6 max-w-xl mx-auto text-center py-6">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-slate-900 text-lg">Export Hackathon Results</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Generate and download a comprehensive CSV report containing official ranks, final scores, and participant details. Perfect for spreadsheet analysis, post-hackathon wrap-ups, or custom award rosters.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left text-slate-600 max-w-md mx-auto space-y-2 font-sans leading-relaxed">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">What is included in the export?</div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Composite placement ranking (Rank 1 to N)</li>
                  <li>Team and project titles</li>
                  <li>Real-time AI evaluator scores</li>
                  <li>Weighted averages of Organizer scoring card submissions</li>
                  <li>Composite combined weighted score (40% AI, 60% Organizer)</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-sm font-bold rounded-xl text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {exportLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Compiling Report...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download CSV Results Report
                  </>
                )}
              </button>
            </div>
          )}

          {subTab === "certs" && (() => {
            const certProjectsList = (
              selectedCertHackathonId === "all"
                ? projects
                : projects.filter(p => p.hackathonId === selectedCertHackathonId)
            ).slice().sort((a, b) => (a.officialRank || 999) - (b.officialRank || 999));

            const selectedCertProj =
              projects.find(p => p.id === selectedProjectId) || certProjectsList[0] || null;
            const selectedCertHk = selectedCertProj
              ? hackathons.find(h => h.id === selectedCertProj.hackathonId)
              : null;
            const totalInHk = selectedCertProj
              ? projects.filter(p => p.hackathonId === selectedCertProj.hackathonId).length
              : 0;
            const parsedTeamRoster = (selectedCertProj?.teamMembers || "")
              .split(",")
              .map(m => m.trim())
              .filter(Boolean);
            const suggestedAward = selectedCertProj
              ? getSuggestedAwardForRank(
                  selectedCertProj.officialRank ?? null,
                  selectedCertProj.status === "evaluated" ||
                    typeof selectedCertProj.combinedScore === "number"
                )
              : "Grand Prize Winner (1st Place)";

            return (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 className="font-sans font-bold text-slate-900 text-lg">Issue Project-Linked Certificate</h3>
                    <div className="flex items-center gap-2">
                      {onOpenCertStudio && (
                        <button
                          type="button"
                          onClick={onOpenCertStudio}
                          className="px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Open Full Cert Studio
                        </button>
                      )}
                      <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setBatchMode(false)}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${!batchMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}
                        >
                          Single
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchMode(true)}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${batchMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"}`}
                        >
                          Team Batch
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Optional Hackathon Filter */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Filter by Hackathon Event</label>
                    <select
                      value={selectedCertHackathonId}
                      onChange={(e) => {
                        const nextHkId = e.target.value;
                        setSelectedCertHackathonId(nextHkId);
                        const matching = (nextHkId === "all" ? projects : projects.filter(p => p.hackathonId === nextHkId))
                          .slice()
                          .sort((a, b) => (a.officialRank || 999) - (b.officialRank || 999));
                        if (matching[0]) {
                          setSelectedProjectId(matching[0].id);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="all">All Hackathons ({projects.length} projects)</option>
                      {hackathons.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({projects.filter(p => p.hackathonId === h.id).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Project Submission</label>
                    <select
                      value={selectedCertProj?.id || selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {certProjectsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {typeof p.officialRank === "number" && p.officialRank > 0 ? `#${p.officialRank} · ` : ""}
                          {p.projectName} ({p.teamName})
                          {typeof p.combinedScore === "number" && p.combinedScore > 0 ? ` — ${p.combinedScore}/100` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick auto-fill from project teamMembers */}
                  {!batchMode && parsedTeamRoster.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 block">Quick-fill from project team roster:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedTeamRoster.map(m => {
                          const matchedUser = users.find(u => u.name.trim().toLowerCase() === m.toLowerCase());
                          const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "member";
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setCertName(m);
                                setCertEmail(
                                  matchedUser?.email ||
                                  `${slug}.${selectedCertProj?.id || "team"}@participant.hackeval.edu`
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {batchMode ? (
                    <form onSubmit={handleBatchIssueCertificates} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Award Designation / Role</label>
                        <select
                          value={certRole}
                          onChange={(e) => setCertRole(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="auto">Auto from Locked Rank ({suggestedAward})</option>
                          <option value="Grand Prize Winner (1st Place)">Grand Prize Winner (1st Place)</option>
                          <option value="First Runner-Up (2nd Place)">First Runner-Up (2nd Place)</option>
                          <option value="Second Runner-Up (3rd Place)">Second Runner-Up (3rd Place)</option>
                          <option value="Finalist & Merit Award">Finalist & Merit Award</option>
                          <option value="Best Technical Hack">Best Technical Hack</option>
                          <option value="Most Innovative AI Project">Most Innovative AI Project</option>
                          <option value="Honorable Mention">Honorable Mention</option>
                          <option value="Official Hackathon Participant">Official Hackathon Participant</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Team Recipients ({batchRecipients.length})</label>
                          <button
                            type="button"
                            onClick={() => setBatchRecipients(prev => [...prev, { name: "", email: "" }])}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            + Add Row
                          </button>
                        </div>
                        {batchRecipients.map((r, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Member Full Name"
                              value={r.name}
                              onChange={(e) => setBatchRecipients(prev => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                            />
                            <input
                              type="email"
                              placeholder="Member Email"
                              value={r.email}
                              onChange={(e) => setBatchRecipients(prev => prev.map((item, i) => i === idx ? { ...item, email: e.target.value } : item))}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={issuingCert}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-sm font-semibold rounded-lg text-white shadow transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {issuingCert ? "Issuing Batch Certificates..." : "Batch Issue A4 Certificates"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleIssueCertificate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recipient Student Name</label>
                        <input
                          type="text"
                          required
                          value={certName}
                          onChange={(e) => setCertName(e.target.value)}
                          placeholder="e.g. Alice Johnson"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recipient Email</label>
                        <input
                          type="email"
                          required
                          value={certEmail}
                          onChange={(e) => setCertEmail(e.target.value)}
                          placeholder="alice@university.edu"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Award Designation / Role</label>
                        <select
                          value={certRole}
                          onChange={(e) => setCertRole(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="auto">Auto from Locked Rank ({suggestedAward})</option>
                          <option value="Grand Prize Winner (1st Place)">Grand Prize Winner (1st Place)</option>
                          <option value="First Runner-Up (2nd Place)">First Runner-Up (2nd Place)</option>
                          <option value="Second Runner-Up (3rd Place)">Second Runner-Up (3rd Place)</option>
                          <option value="Finalist & Merit Award">Finalist & Merit Award</option>
                          <option value="Best Technical Hack">Best Technical Hack</option>
                          <option value="Most Innovative AI Project">Most Innovative AI Project</option>
                          <option value="Honorable Mention">Honorable Mention</option>
                          <option value="Official Hackathon Participant">Official Hackathon Participant</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={issuingCert}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-sm font-semibold rounded-lg text-white shadow transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {issuingCert ? "Issuing Certificate..." : "Issue Verifiable Certificate"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Column: Live Project Snapshot + 1-Click Auto-Generate for Full Team */}
                <div className="space-y-4 self-start">
                  {selectedCertProj && (
                    <div className="bg-white border border-indigo-200 rounded-xl p-6 space-y-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
                            Selected Project Context
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                            {selectedCertProj.projectName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {selectedCertHk?.name || selectedCertProj.hackathonName || "Hackathon Event"} · Team{" "}
                            <strong className="text-slate-700">{selectedCertProj.teamName}</strong>
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 font-mono text-xs font-extrabold text-indigo-700 shrink-0">
                          {typeof selectedCertProj.officialRank === "number" && selectedCertProj.officialRank > 0
                            ? `Rank #${selectedCertProj.officialRank}/${totalInHk}`
                            : "Unranked"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-center bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Combined</div>
                          <div className="text-sm font-mono font-extrabold text-slate-900">
                            {typeof selectedCertProj.combinedScore === "number" && selectedCertProj.combinedScore > 0
                              ? `${selectedCertProj.combinedScore}/100`
                              : "Pending"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">AI Score</div>
                          <div className="text-sm font-mono font-bold text-indigo-700">
                            {selectedCertProj.aiOverallScore ?? "Pending"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Judge Avg</div>
                          <div className="text-sm font-mono font-bold text-emerald-700">
                            {selectedCertProj.judgeAverageScore ?? "Pending"}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-bold text-slate-700">Suggested Award:</span>{" "}
                          <span className="text-indigo-700 font-semibold">{suggestedAward}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Team Roster:</span>{" "}
                          {parsedTeamRoster.length > 0 ? parsedTeamRoster.join(", ") : selectedCertProj.teamName}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateProjectTeamCertificates}
                        disabled={issuingCert}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-xs font-bold rounded-lg text-white shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        {issuingCert
                          ? "Generating Project Certificates..."
                          : `Auto-Issue A4 Certificates for Team (${Math.max(1, parsedTeamRoster.length)})`}
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-600 text-xs space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider">Landscape A4 Certification Spec</h4>
                    <p className="leading-relaxed">
                      Every issued certificate binds permanently to the selected project's hackathon event, locked ranking (<span className="font-mono font-bold text-slate-800">Rank #X</span>), composite score, and unique verification code (<span className="font-mono font-bold text-slate-800">CERT-XXXXXX</span>).
                    </p>
                    <p className="leading-relaxed">
                      Export print-ready <strong>Landscape A4 (297mm × 210mm) PDF</strong> or PNG files with embedded QR verification links.
                    </p>
                  </div>
                </div>
              </div>

              {/* Previously Issued Certificates List */}
              <div className="mt-8 border-t border-slate-100 pt-8 space-y-4">
                <h3 className="font-sans font-bold text-slate-900 text-lg">Issued Certificates Registry ({certificates.length})</h3>
                {certificates.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No awards or badges have been issued yet. Use the form above to grant the first verifiable certificate.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
                          <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Project / Event</th>
                          <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Designation & Standing</th>
                          <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Code</th>
                          <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200 font-medium text-slate-700">
                        {certificates.map((cert) => (
                          <tr key={cert.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{cert.recipientName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{cert.recipientEmail}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-slate-900 font-semibold">{cert.projectName}</div>
                              <div className="text-[11px] text-slate-500">
                                {cert.hackathonName || "HackEval Hackathon"} · Team: {cert.teamName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                                  {cert.role}
                                </span>
                                {typeof cert.projectRank === "number" && cert.projectRank > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold">
                                    #{cert.projectRank}{typeof cert.combinedScore === "number" && cert.combinedScore > 0 ? ` · ${cert.combinedScore}` : ""}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] font-semibold text-indigo-700">{cert.certificateCode}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDirectCertPdf(cert)}
                                  disabled={downloadingCertId === cert.id}
                                  className="text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-2.5 py-1 rounded font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                  {downloadingCertId === cert.id ? "PDF..." : "A4 PDF"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCertificate(cert);
                                    setIsModalOpen(true);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview A4 & QR
                                </button>
                                {confirmDeleteCertId === cert.id ? (
                                  <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-md p-1">
                                    <span className="text-[10px] text-rose-700 font-bold px-1">Revoke?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCertificate(cert.id)}
                                      className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteCertId(null)}
                                      className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCertId(cert.id)}
                                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash className="w-3.5 h-3.5" /> Revoke
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {subTab === "events" && (
            selectedHk ? (
              <div className="space-y-6 animate-fade-in">
                {/* Back button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    onClick={() => {
                      setSelectedHk(null);
                      setIsEditingHk(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hackathon Events
                  </button>
                  <div className="flex items-center gap-2">
                    {!isEditingHk && (
                      <button
                        onClick={() => {
                          setIsEditingHk(true);
                          setEditHkName(selectedHk.name);
                          setEditHkDesc(selectedHk.description);
                          setEditHkStart(selectedHk.startDate);
                          setEditHkEnd(selectedHk.endDate);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-sm cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Event details
                      </button>
                    )}
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      selectedHk.active ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {selectedHk.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Event Details Card or Inline Editor */}
                {isEditingHk ? (
                  <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-6 space-y-4 animate-fade-in">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Edit className="w-4 h-4 text-indigo-600" />
                      Update Event Configuration
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Event Name</label>
                        <input
                          type="text"
                          value={editHkName}
                          onChange={(e) => setEditHkName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs shadow-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editHkDesc}
                          onChange={(e) => setEditHkDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs shadow-sm bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={editHkStart}
                            onChange={(e) => setEditHkStart(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs shadow-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={editHkEnd}
                            onChange={(e) => setEditHkEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs shadow-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateHackathon(selectedHk.id, {
                          name: editHkName,
                          description: editHkDesc,
                          startDate: editHkStart,
                          endDate: editHkEnd
                        })}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Save Configuration
                      </button>
                      <button
                        onClick={() => setIsEditingHk(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                      <h3 className="text-xl font-sans font-bold text-slate-900">{selectedHk.name}</h3>
                      <p className="text-sm text-slate-600 max-w-xl">{selectedHk.description}</p>
                      <p className="text-xs text-slate-400 font-mono">Timeline: {selectedHk.startDate} to {selectedHk.endDate}</p>
                    </div>

                    {/* Mass AI Evaluation & Ranking for this event */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                      <button
                        onClick={() => handleAnalyzeAndRank(selectedHk.id, false)}
                        disabled={rankLoading}
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                      >
                        {rankLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Grading Pending...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            Grade Pending & Lock Ranks
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAnalyzeAndRank(selectedHk.id, true)}
                        disabled={rankLoading}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
                        title="Re-evaluate all projects in this event"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${rankLoading ? "animate-spin" : ""}`} />
                        Re-grade All
                      </button>
                    </div>
                  </div>
                )}

                {/* Event Performance Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submissions</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {projects.filter(p => p.hackathonId === selectedHk.id).length}
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Graded</div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                      {projects.filter(p => p.hackathonId === selectedHk.id && p.status === "evaluated").length}
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Score</div>
                    <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                      {(() => {
                        const graded = hkLeaderboard.filter(item => item.aiOverallScore !== null);
                        if (graded.length === 0) return "Pending";
                        const sum = graded.reduce((acc, curr) => acc + curr.aiOverallScore, 0);
                        return (sum / graded.length).toFixed(1) + " /100";
                      })()}
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Standing</div>
                    <div className="text-xs font-bold text-indigo-700 mt-1 line-clamp-1">
                      {hkLeaderboard.length > 0 && hkLeaderboard[0].aiOverallScore !== null 
                        ? `${hkLeaderboard[0].projectName} (${hkLeaderboard[0].combinedScore})` 
                        : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-sans font-bold text-slate-900 text-md">
                      Registrations & Submissions ({projects.filter(p => p.hackathonId === selectedHk.id).length})
                    </h4>
                  </div>

                  {(() => {
                    const filteredProjects = projects.filter(p => p.hackathonId === selectedHk.id);
                    if (filteredProjects.length === 0) {
                      return (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                          <p className="text-sm text-slate-500 font-medium">No project submissions have been established for this hackathon event yet.</p>
                        </div>
                      );
                    }

                    if (leaderboardLoading && hkLeaderboard.length === 0) {
                      return (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {hkLeaderboard.map((item, idx) => {
                          const fullProj = projects.find(p => p.id === item.projectId);
                          const isEvaluated = item.aiOverallScore !== null;
                          return (
                            <div key={item.projectId} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-sm transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-bold text-slate-900 text-sm">{item.projectName}</h5>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                      isEvaluated ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}>
                                      {isEvaluated ? "Scored & Ranked" : "Pending Evaluation"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-medium">Team Name: <span className="font-bold text-slate-800">{item.teamName}</span></p>
                                  {fullProj?.description && (
                                    <p className="text-xs text-slate-500 line-clamp-1">{fullProj.description}</p>
                                  )}
                                  {fullProj?.githubUrl && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      GitHub: <a href={fullProj.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{fullProj.githubUrl}</a>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end">
                                  {isEvaluated ? (
                                    <div className="text-left sm:text-right">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Composite Standing</div>
                                      <div className="text-lg font-sans font-extrabold text-indigo-600">Rank #{item.rank}</div>
                                      <div className="text-[10px] text-slate-500 font-medium">Combined Score: {item.combinedScore}/100</div>
                                      {item.judgeAverageScore !== null && (
                                        <div className="text-[9px] text-slate-400 font-semibold">Jury average: {item.judgeAverageScore}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-left sm:text-right">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Composite Standing</div>
                                      <div className="text-lg font-sans font-extrabold text-slate-400">-</div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Administration Shortcuts for each project */}
                              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => handleSingleAIEvaluation(item.projectId)}
                                    disabled={singleEvalLoadingId === item.projectId}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${singleEvalLoadingId === item.projectId ? "animate-spin" : ""}`} />
                                    Run AI Grade
                                  </button>
                                  
                                    <button
                                      onClick={() => {
                                        if (reviewingProjId === item.projectId) {
                                          setReviewingProjId(null);
                                        } else {
                                          setReviewingProjId(item.projectId);
                                          setReviewIdea(80);
                                          setReviewInnovation(80);
                                          setReviewCodeQuality(80);
                                          setReviewReadme(80);
                                          setReviewUi(80);
                                          setReviewAiUsage(80);
                                          setReviewTechnical(80);
                                          setReviewFeedback("");
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      {reviewingProjId === item.projectId ? "Cancel Review" : "Submit Jury Scorecard"}
                                    </button>

                                    {fullProj && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenCertsForProject(fullProj)}
                                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <Award className="w-3.5 h-3.5" />
                                        Issue Cert
                                      </button>
                                    )}
                                  </div>

                                <div>
                                  {confirmDeleteProjId === item.projectId ? (
                                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-1.5 py-1">
                                      <span className="text-[10px] text-rose-700 font-bold">Remove team?</span>
                                      <button
                                        onClick={() => handleDeleteProject(item.projectId)}
                                        className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteProjId(null)}
                                        className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteProjId(item.projectId)}
                                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      Remove Submission
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Manual scoring card expandable block */}
                              {reviewingProjId === item.projectId && (
                                <div className="bg-slate-50 border border-emerald-100 rounded-xl p-4 sm:p-5 space-y-4 animate-fade-in mt-2">
                                  <h6 className="text-xs font-bold text-slate-900 flex items-center gap-1 uppercase tracking-wider">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    Manual Jury Evaluation - {item.projectName}
                                  </h6>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-3">
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Idea / Concept alignment</span>
                                          <span className="font-bold text-slate-950">{reviewIdea}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewIdea}
                                          onChange={(e) => setReviewIdea(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Innovation & Uniqueness</span>
                                          <span className="font-bold text-slate-950">{reviewInnovation}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewInnovation}
                                          onChange={(e) => setReviewInnovation(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Source Code Quality</span>
                                          <span className="font-bold text-slate-950">{reviewCodeQuality}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewCodeQuality}
                                          onChange={(e) => setReviewCodeQuality(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Documentation & README readability</span>
                                          <span className="font-bold text-slate-950">{reviewReadme}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewReadme}
                                          onChange={(e) => setReviewReadme(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Design Aesthetic & UI/UX flow</span>
                                          <span className="font-bold text-slate-950">{reviewUi}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewUi}
                                          onChange={(e) => setReviewUi(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">AI Tooling implementation</span>
                                          <span className="font-bold text-slate-950">{reviewAiUsage}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewAiUsage}
                                          onChange={(e) => setReviewAiUsage(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="font-semibold text-slate-700">Technical Depth & Complexity</span>
                                          <span className="font-bold text-slate-950">{reviewTechnical}/100</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="100" step="5"
                                          value={reviewTechnical}
                                          onChange={(e) => setReviewTechnical(Number(e.target.value))}
                                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 pt-1 text-xs">
                                    <label className="block font-bold text-slate-700">Manual Feedback / Recommendations</label>
                                    <textarea
                                      required rows={2}
                                      value={reviewFeedback}
                                      onChange={(e) => setReviewFeedback(e.target.value)}
                                      placeholder="Write specific critiques or jury notes..."
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none bg-white text-xs"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      onClick={() => handleScoreProject(item.projectId)}
                                      disabled={!reviewFeedback.trim()}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                    >
                                      Submit Grade
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event Creator Form */}
                <form onSubmit={handleCreateHackathon} className="space-y-4">
                  <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Create Hackathon Event</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Name</label>
                    <input
                      type="text"
                      required
                      value={hkName}
                      onChange={(e) => setHkName(e.target.value)}
                      placeholder="e.g. PennApps Fall 2026"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={hkDesc}
                      onChange={(e) => setHkDesc(e.target.value)}
                      placeholder="Provide overview details..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={hkStart}
                        onChange={(e) => setHkStart(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={hkEnd}
                        onChange={(e) => setHkEnd(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg text-white cursor-pointer"
                  >
                    Create Event
                  </button>
                </form>

                {/* Event Listings */}
                <div className="space-y-4">
                  <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Active Events Manager</h3>
                  
                  <div className="space-y-3.5">
                    {hackathons.map((hk) => (
                      <div 
                        key={hk.id}
                        className={`border p-4 rounded-xl flex items-center justify-between ${
                          hk.active ? "border-indigo-400 bg-indigo-50/10" : "border-slate-200"
                        }`}
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-900 text-sm">{hk.name}</h4>
                            {hk.active && (
                              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{hk.description}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Dates: {hk.startDate} to {hk.endDate}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedHk(hk)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <FolderGit className="w-3.5 h-3.5" />
                              Open
                            </button>
                            <button
                              onClick={() => handleToggleHackathonActive(hk.id, hk.active)}
                              className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                hk.active 
                                  ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" 
                                  : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {hk.active ? "Deactivate" : "Activate"}
                            </button>
                          </div>

                          {confirmDeleteHkId === hk.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1 mt-1">
                              <span className="text-[10px] text-rose-700 font-bold px-1">Confirm delete?</span>
                              <button
                                onClick={() => handleDeleteHackathon(hk.id)}
                                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteHkId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteHkId(hk.id)}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash className="w-3 h-3" /> Delete Event
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Dynamic landscape A4 certificate generator & print utility */}
      <CertificateModal
        certificate={selectedCertificate}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCertificate(null);
        }}
      />
    </div>
  );
}

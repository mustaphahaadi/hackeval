import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Plus,
  Trash2,
  FileDown,
  Image as ImageIcon,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  FolderPlus,
  Sliders,
  Layers,
  UserPlus,
  ShieldCheck,
  Loader2,
  X
} from "lucide-react";
import { Certificate, HackathonEvent, ProjectSubmission, UserRole } from "../types";
import {
  getSuggestedAwardForRank,
  downloadCertificatePdf,
  downloadCertificatePng
} from "../utils/certificateGenerator.js";
import { CertificateModal } from "./CertificateModal.js";
import { CertificateSheet } from "./CertificateSheet.js";
import { CredentialCard } from "./CredentialCard.js";

type GeneratorMode = "existing_project" | "create_project" | "custom";

interface RecipientDraft {
  name: string;
  email: string;
}

interface CertificateGeneratorStudioProps {
  token?: string | null;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: UserRole;
  } | null;
  initialHackathonId?: string | null;
  initialProject?: any | null;
  compactModal?: boolean;
  onCertificatesIssued?: (certs: Certificate[], createdProject?: any) => void;
  onClose?: () => void;
}

const PRESET_AWARD_ROLES = [
  "auto",
  "Grand Prize Winner (1st Place)",
  "First Runner-Up (2nd Place)",
  "Second Runner-Up (3rd Place)",
  "Best AI Integration",
  "Most Innovative Technical Architecture",
  "Finalist & Merit Award",
  "Official Hackathon Participant"
];

export function CertificateGeneratorStudio({
  token,
  currentUser,
  initialHackathonId = null,
  initialProject = null,
  compactModal = false,
  onCertificatesIssued,
  onClose
}: CertificateGeneratorStudioProps) {
  const isAdmin = currentUser?.role === "Admin";

  const [mode, setMode] = useState<GeneratorMode>(
    initialProject ? "existing_project" : "existing_project"
  );
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([]);
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Mode 1: Existing Project selection
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>(
    initialProject?.hackathonId || initialHackathonId || ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProject?.id || initialProject?.projectId || ""
  );

  // Mode 2: Set up Hackathon & Project inline
  const [createNewHackathon, setCreateNewHackathon] = useState<boolean>(false);
  const [newHkName, setNewHkName] = useState("");
  const [newHkDescription, setNewHkDescription] = useState("");
  const [newHkStartDate, setNewHkStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newHkEndDate, setNewHkEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [setupHackathonId, setSetupHackathonId] = useState<string>(
    initialHackathonId || ""
  );
  const [newProjName, setNewProjName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState("");
  const [newGithubUrl, setNewGithubUrl] = useState("");
  const [newProblemStatement, setNewProblemStatement] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Mode 3: Custom Certificate overrides
  const [customHackathonName, setCustomHackathonName] = useState("HackEval Innovation Hackathon");
  const [customProjectName, setCustomProjectName] = useState("");
  const [customTeamName, setCustomTeamName] = useState("");
  const [customRank, setCustomRank] = useState<string>("");
  const [customEntries, setCustomEntries] = useState<string>("");
  const [customScore, setCustomScore] = useState<string>("");

  // Shared Recipient & Award controls
  const [recipients, setRecipients] = useState<RecipientDraft[]>([
    {
      name: currentUser?.name || "",
      email: currentUser?.email || ""
    }
  ]);
  const [rolePreset, setRolePreset] = useState<string>("auto");
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [issuedDate, setIssuedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Actions & Results State
  const [submitting, setSubmitting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [issuedCerts, setIssuedCerts] = useState<Certificate[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [modalCert, setModalCert] = useState<Certificate | null>(null);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const [hkRes, projRes] = await Promise.all([
        fetch("/api/hackathons"),
        fetch("/api/projects", { headers })
      ]);
      if (hkRes.ok) {
        const hkData: HackathonEvent[] = await hkRes.json();
        setHackathons(hkData);
        if (!setupHackathonId && hkData.length > 0) {
          const activeHk = hkData.find((h) => h.active) || hkData[0];
          setSetupHackathonId(activeHk.id);
        }
      }
      if (projRes.ok) {
        const projData: ProjectSubmission[] = await projRes.json();
        setProjects(projData);
        if (!initialProject && !selectedProjectId && projData.length > 0) {
          const filtered = selectedHackathonId
            ? projData.filter((p) => p.hackathonId === selectedHackathonId)
            : projData;
          if (filtered.length > 0) {
            setSelectedProjectId(filtered[0].id);
          } else {
            setSelectedProjectId(projData[0].id);
          }
        }
      }
    } catch {
      // Non-fatal catalog fetch issue
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [token]);

  // Sync if initialProject changes (e.g. opened from a hackathon table row)
  useEffect(() => {
    if (initialProject) {
      const pId = initialProject.id || initialProject.projectId || "";
      setMode("existing_project");
      if (initialProject.hackathonId) {
        setSelectedHackathonId(initialProject.hackathonId);
      }
      if (pId) {
        setSelectedProjectId(pId);
      }
      // Pre-fill team members if roster is present
      const memberStr: string = initialProject.teamMembers || "";
      const parsedNames = memberStr
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      if (parsedNames.length > 0) {
        setRecipients(
          parsedNames.map((name) => {
            const slug =
              name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ".")
                .replace(/^\.|\.$/g, "") || "member";
            return {
              name,
              email: `${slug}@participant.hackeval.edu`
            };
          })
        );
      } else if (initialProject.teamName) {
        setRecipients([{ name: initialProject.teamName, email: "" }]);
      }
      setIssuedCerts([]);
      setSuccessMsg("");
      setErrorMsg("");
    }
  }, [initialProject?.id, initialProject?.projectId]);

  const filteredProjects = useMemo(() => {
    if (!selectedHackathonId) return projects;
    return projects.filter((p) => p.hackathonId === selectedHackathonId);
  }, [projects, selectedHackathonId]);

  const activeSelectedProject = useMemo(() => {
    if (
      initialProject &&
      (initialProject.id === selectedProjectId ||
        initialProject.projectId === selectedProjectId)
    ) {
      return initialProject;
    }
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId, initialProject]);

  // Ensure selectedProjectId stays valid when hackathon filter changes
  useEffect(() => {
    if (mode !== "existing_project") return;
    if (filteredProjects.length === 0) return;
    if (!filteredProjects.some((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId, mode]);

  const activeProjectMembers = useMemo(() => {
    const raw = activeSelectedProject?.teamMembers || "";
    return raw
      .split(",")
      .map((m: string) => m.trim())
      .filter(Boolean);
  }, [activeSelectedProject]);

  const resolvedAwardRole = useMemo(() => {
    if (rolePreset === "__custom__") {
      return customRoleInput.trim() || "Certificate of Recognition";
    }
    if (rolePreset !== "auto") {
      return rolePreset;
    }
    if (mode === "existing_project" && activeSelectedProject) {
      const rank =
        activeSelectedProject.officialRank ?? activeSelectedProject.rank ?? null;
      const isEval =
        activeSelectedProject.status === "evaluated" ||
        activeSelectedProject.aiOverallScore !== null ||
        activeSelectedProject.judgeAverageScore !== null;
      return getSuggestedAwardForRank(rank, isEval);
    }
    if (mode === "custom") {
      const r = Number(customRank);
      if (Number.isFinite(r) && r > 0) {
        return getSuggestedAwardForRank(r, true);
      }
    }
    return "Official Hackathon Participant";
  }, [rolePreset, customRoleInput, mode, activeSelectedProject, customRank]);

  // Live preview Certificate object built directly from current form inputs
  const previewCertificate: Certificate = useMemo(() => {
    const activeRecipient =
      recipients[activePreviewIdx] ||
      recipients[0] || {
        name: "Recipient Name",
        email: "recipient@hackeval.edu"
      };

    const existingIssued = issuedCerts[activePreviewIdx];
    if (existingIssued) {
      return existingIssued;
    }

    let projName = "Hackathon Project Submission";
    let teamName = "Development Team";
    let hkName = "HackEval Academic Hackathon";
    let rank: number | null = null;
    let score: number | null = null;
    let entries: number | null = null;
    let projId = "preview_draft";

    if (mode === "existing_project" && activeSelectedProject) {
      projId = activeSelectedProject.id || activeSelectedProject.projectId || "proj_preview";
      projName = activeSelectedProject.projectName || projName;
      teamName = activeSelectedProject.teamName || teamName;
      const hk = hackathons.find(
        (h) => h.id === activeSelectedProject.hackathonId
      );
      hkName =
        activeSelectedProject.hackathonName ||
        activeSelectedProject.hackathon?.name ||
        hk?.name ||
        hkName;
      rank =
        activeSelectedProject.officialRank ?? activeSelectedProject.rank ?? null;
      score =
        activeSelectedProject.combinedScore !== undefined
          ? activeSelectedProject.combinedScore
          : null;
      entries =
        activeSelectedProject.totalHackathonEntries ||
        projects.filter((p) => p.hackathonId === activeSelectedProject.hackathonId)
          .length ||
        null;
    } else if (mode === "create_project") {
      projName = newProjName.trim() || "New Project Submission";
      teamName = newTeamName.trim() || "New Team";
      if (createNewHackathon) {
        hkName = newHkName.trim() || "New Hackathon Track";
      } else {
        const hk = hackathons.find((h) => h.id === setupHackathonId);
        hkName = hk?.name || hkName;
      }
    } else {
      projName = customProjectName.trim() || "Custom Project";
      teamName = customTeamName.trim() || "Custom Team";
      hkName = customHackathonName.trim() || hkName;
      const parsedRank = Number(customRank);
      const parsedScore = Number(customScore);
      const parsedEntries = Number(customEntries);
      rank = Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : null;
      score =
        customScore.trim() !== "" && Number.isFinite(parsedScore) && parsedScore >= 0
          ? parsedScore
          : null;
      entries =
        Number.isFinite(parsedEntries) && parsedEntries > 0 ? parsedEntries : null;
    }

    return {
      id: "draft_" + (activePreviewIdx + 1),
      projectId: projId,
      projectName: projName,
      teamName,
      hackathonName: hkName,
      projectRank: rank,
      combinedScore: score,
      totalHackathonEntries: entries,
      recipientName: activeRecipient.name.trim() || "Recipient Name",
      recipientEmail: activeRecipient.email.trim() || "recipient@hackeval.edu",
      role: resolvedAwardRole,
      issuedAt: issuedDate ? new Date(issuedDate + "T12:00:00Z").toISOString() : new Date().toISOString(),
      certificateCode: "CERT-PREVIEW"
    };
  }, [
    recipients,
    activePreviewIdx,
    issuedCerts,
    mode,
    activeSelectedProject,
    hackathons,
    projects,
    newProjName,
    newTeamName,
    createNewHackathon,
    newHkName,
    setupHackathonId,
    customProjectName,
    customTeamName,
    customHackathonName,
    customRank,
    customScore,
    customEntries,
    resolvedAwardRole,
    issuedDate
  ]);

  const handleUpdateRecipient = (
    idx: number,
    field: keyof RecipientDraft,
    value: string
  ) => {
    setIssuedCerts([]);
    setRecipients((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleAddRecipient = () => {
    setIssuedCerts([]);
    setRecipients((prev) => [...prev, { name: "", email: "" }]);
    setActivePreviewIdx(recipients.length);
  };

  const handleRemoveRecipient = (idx: number) => {
    if (recipients.length <= 1) return;
    setIssuedCerts([]);
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
    setActivePreviewIdx((prev) => Math.max(0, prev >= idx ? prev - 1 : prev));
  };

  const handlePopulateMembersFromInput = () => {
    const raw =
      mode === "existing_project"
        ? activeSelectedProject?.teamMembers || ""
        : newTeamMembers;
    const names = raw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setIssuedCerts([]);
    setRecipients(
      names.map((name: string) => {
        const slug =
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ".")
            .replace(/^\.|\.$/g, "") || "member";
        return { name, email: `${slug}@participant.hackeval.edu` };
      })
    );
    setActivePreviewIdx(0);
  };

  const handleClickTeamChip = (memberName: string) => {
    const slug =
      memberName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.|\.$/g, "") || "member";
    const suggestedEmail = `${slug}@participant.hackeval.edu`;
    setIssuedCerts([]);
    // Fill active empty row or append if already populated
    setRecipients((prev) => {
      const alreadyExistsIdx = prev.findIndex(
        (r) => r.name.trim().toLowerCase() === memberName.toLowerCase()
      );
      if (alreadyExistsIdx !== -1) {
        setActivePreviewIdx(alreadyExistsIdx);
        return prev;
      }
      const emptyIdx = prev.findIndex((r) => !r.name.trim());
      if (emptyIdx !== -1) {
        setActivePreviewIdx(emptyIdx);
        return prev.map((r, i) =>
          i === emptyIdx ? { name: memberName, email: r.email.trim() || suggestedEmail } : r
        );
      }
      setActivePreviewIdx(prev.length);
      return [...prev, { name: memberName, email: suggestedEmail }];
    });
  };

  const validateRecipients = (): RecipientDraft[] | null => {
    const cleaned = recipients
      .map((r) => ({ name: r.name.trim(), email: r.email.trim().toLowerCase() }))
      .filter((r) => r.name.length > 0 || r.email.length > 0);

    if (cleaned.length === 0) {
      setErrorMsg("Enter at least one recipient name and email address.");
      return null;
    }
    for (const r of cleaned) {
      if (!r.name) {
        setErrorMsg("Every recipient row must include a full name.");
        return null;
      }
      if (!r.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
        setErrorMsg(`Please provide a valid email address for ${r.name}.`);
        return null;
      }
    }
    return cleaned;
  };

  const handleIssueToRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validRecipients = validateRecipients();
    if (!validRecipients) return;

    const finalRoleToSend =
      rolePreset === "auto"
        ? "auto"
        : rolePreset === "__custom__"
        ? customRoleInput.trim() || "Certificate of Recognition"
        : rolePreset;

    const isoIssuedAt = issuedDate
      ? new Date(issuedDate + "T12:00:00Z").toISOString()
      : undefined;

    // If user is NOT Admin, handle project registration (if create_project) + local A4 PDF generation cleanly
    if (!isAdmin || !token) {
      setSubmitting(true);
      try {
        let createdProj: any = null;
        if (mode === "create_project") {
          if (!newProjName.trim() || !newTeamName.trim()) {
            throw new Error("Project title and team name are required.");
          }
          if (!newGithubUrl.trim()) {
            throw new Error(
              "GitHub repository URL is required to register a public project submission."
            );
          }
          const headers: Record<string, string> = {
            "Content-Type": "application/json"
          };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch("/api/projects", {
            method: "POST",
            headers,
            body: JSON.stringify({
              projectName: newProjName.trim(),
              teamName: newTeamName.trim(),
              teamMembers:
                newTeamMembers.trim() ||
                validRecipients.map((r) => r.name).join(", "),
              description:
                newDescription.trim() ||
                `${newProjName.trim()} submitted by ${newTeamName.trim()}.`,
              problemStatement:
                newProblemStatement.trim() ||
                `Hackathon solution developed by ${newTeamName.trim()}.`,
              githubUrl: newGithubUrl.trim(),
              hackathonId: setupHackathonId
            })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to create project submission.");
          }
          createdProj = data;
          await loadCatalog();
        }

        // Generate local A4 certificate objects & trigger PDF downloads
        const localCerts: Certificate[] = validRecipients.map((r, i) => ({
          ...previewCertificate,
          id: `local_${Date.now()}_${i}`,
          projectId: createdProj?.id || previewCertificate.projectId,
          projectName: createdProj?.projectName || previewCertificate.projectName,
          teamName: createdProj?.teamName || previewCertificate.teamName,
          recipientName: r.name,
          recipientEmail: r.email,
          role: resolvedAwardRole,
          issuedAt: isoIssuedAt || new Date().toISOString(),
          certificateCode: "LOCAL-A4"
        }));

        setIssuedCerts(localCerts);
        setActivePreviewIdx(0);
        await downloadCertificatePdf(localCerts[0]);
        setSuccessMsg(
          createdProj
            ? `Project "${createdProj.projectName}" saved and Landscape A4 PDF generated! (Sign in as Admin to register official CERT-XXXXXX codes in the public ledger.)`
            : `Generated and downloaded Landscape A4 PDF for ${localCerts[0].recipientName}. (Sign in as Admin to register an official CERT-XXXXXX code in the public ledger.)`
        );
        onCertificatesIssued?.(localCerts, createdProj);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to generate certificate.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Admin verifiable issuance flow (persists CERT-XXXXXX in DB & Firestore)
    setSubmitting(true);
    try {
      let payloadBase: Record<string, any> = {
        role: finalRoleToSend,
        issuedAt: isoIssuedAt
      };

      if (mode === "existing_project") {
        if (!selectedProjectId) {
          throw new Error("Please select a submitted project first.");
        }
        payloadBase.projectId = selectedProjectId;
      } else if (mode === "create_project") {
        if (!newProjName.trim() || !newTeamName.trim()) {
          throw new Error("Project title and team name are required.");
        }
        if (createNewHackathon && !newHkName.trim()) {
          throw new Error("Enter a name for the new hackathon event.");
        }
        payloadBase.mode = "create_project";
        payloadBase.hackathonId = createNewHackathon ? undefined : setupHackathonId;
        if (createNewHackathon) {
          payloadBase.newHackathon = {
            name: newHkName.trim(),
            description:
              newHkDescription.trim() ||
              `${newHkName.trim()} official hackathon event.`,
            startDate: newHkStartDate,
            endDate: newHkEndDate,
            active: true
          };
        }
        payloadBase.projectDetails = {
          projectName: newProjName.trim(),
          teamName: newTeamName.trim(),
          teamMembers:
            newTeamMembers.trim() ||
            validRecipients.map((r) => r.name).join(", "),
          githubUrl: newGithubUrl.trim(),
          problemStatement:
            newProblemStatement.trim() ||
            `Hackathon solution developed by ${newTeamName.trim()}.`,
          description:
            newDescription.trim() ||
            `${newProjName.trim()} built by team ${newTeamName.trim()}.`
        };
      } else {
        if (!customProjectName.trim() || !customTeamName.trim()) {
          throw new Error("Project name and team name are required.");
        }
        payloadBase.mode = "custom";
        payloadBase.projectName = customProjectName.trim();
        payloadBase.teamName = customTeamName.trim();
        payloadBase.hackathonName =
          customHackathonName.trim() || "HackEval Academic Hackathon";
        if (customRank.trim()) payloadBase.projectRank = Number(customRank);
        if (customScore.trim()) payloadBase.combinedScore = Number(customScore);
        if (customEntries.trim()) {
          payloadBase.totalHackathonEntries = Number(customEntries);
        }
      }

      const isBatch = validRecipients.length > 1;
      const endpoint = isBatch
        ? "/api/admin/certificates/batch"
        : "/api/admin/certificates";
      const bodyPayload = isBatch
        ? { ...payloadBase, recipients: validRecipients }
        : {
            ...payloadBase,
            recipientName: validRecipients[0].name,
            recipientEmail: validRecipients[0].email
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue verifiable certificate(s).");
      }

      const certs: Certificate[] = isBatch ? data.certificates : [data];
      setIssuedCerts(certs);
      setActivePreviewIdx(0);

      if (data.createdHackathon || data.createdProject) {
        await loadCatalog();
        if (data.createdProject?.id) {
          setSelectedHackathonId(data.createdProject.hackathonId || "");
          setSelectedProjectId(data.createdProject.id);
        }
      }

      const createdSummary = [
        data.createdHackathon ? `Hackathon "${data.createdHackathon.name}"` : null,
        data.createdProject ? `Project "${data.createdProject.projectName}"` : null
      ]
        .filter(Boolean)
        .join(" & ");

      setSuccessMsg(
        createdSummary
          ? `Created ${createdSummary} and issued ${certs.length} verifiable Landscape A4 certificate(s)!`
          : `Issued ${certs.length} verifiable Landscape A4 certificate(s) (${certs.map((c) => c.certificateCode).join(", ")}).`
      );
      onCertificatesIssued?.(certs, data.createdProject);
    } catch (err: any) {
      setErrorMsg(err.message || "Certificate generation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPreviewPdf = async () => {
    setErrorMsg("");
    setExportingPdf(true);
    try {
      await downloadCertificatePdf(previewCertificate);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to export Landscape A4 PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadPreviewPng = async () => {
    setErrorMsg("");
    setExportingPng(true);
    try {
      await downloadCertificatePng(previewCertificate);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to export A4 PNG.");
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className={compactModal ? "space-y-5" : "space-y-6 animate-fade-in"}>
      {/* Header */}
      {!compactModal && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Award className="w-7 h-7 text-indigo-600" />
              Flexible Certificate Generator Studio
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Issue Landscape A4 (297mm × 210mm) certificates from submitted hackathon projects, set up new hackathons & projects inline, or customize every credential field.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer self-start"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => {
            setMode("existing_project");
            setIssuedCerts([]);
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            mode === "existing_project"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          From Submitted Project
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("create_project");
            setIssuedCerts([]);
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            mode === "create_project"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <FolderPlus className="w-4 h-4 shrink-0" />
          Set Up Hackathon & Project
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("custom");
            setIssuedCerts([]);
            setErrorMsg("");
          }}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            mode === "custom"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          Custom Certificate Fields
        </button>
      </div>

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Form */}
        <form
          onSubmit={handleIssueToRegistry}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5"
        >
          {/* MODE 1: EXISTING SUBMITTED PROJECT */}
          {mode === "existing_project" && (
            <div className="space-y-3.5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  1. Target Project Submission
                </span>
                {catalogLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Hackathon Event Filter
                </label>
                <select
                  value={selectedHackathonId}
                  onChange={(e) => {
                    setSelectedHackathonId(e.target.value);
                    setIssuedCerts([]);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Hackathons ({projects.length} projects)</option>
                  {hackathons.map((hk) => (
                    <option key={hk.id} value={hk.id}>
                      {hk.name} ({projects.filter((p) => p.hackathonId === hk.id).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Submitted Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setIssuedCerts([]);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  required
                >
                  {filteredProjects.length === 0 ? (
                    <option value="">No submitted projects in this hackathon</option>
                  ) : (
                    filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {typeof p.officialRank === "number" && p.officialRank > 0
                          ? `#${p.officialRank} — `
                          : ""}
                        {p.projectName} ({p.teamName})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {activeSelectedProject && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-bold text-indigo-700">
                      {typeof activeSelectedProject.officialRank === "number" &&
                      activeSelectedProject.officialRank > 0
                        ? `Locked Rank #${activeSelectedProject.officialRank}`
                        : "Pending Evaluation"}
                      {typeof activeSelectedProject.combinedScore === "number" &&
                      activeSelectedProject.combinedScore > 0
                        ? ` · ${activeSelectedProject.combinedScore}/100`
                        : ""}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Team: {activeSelectedProject.teamName}
                    </span>
                  </div>

                  {activeProjectMembers.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          Quick-fill from Team Roster:
                        </span>
                        <button
                          type="button"
                          onClick={handlePopulateMembersFromInput}
                          className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Load All ({activeProjectMembers.length})
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProjectMembers.map((member: string) => (
                          <button
                            key={member}
                            type="button"
                            onClick={() => handleClickTeamChip(member)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-md text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3 text-indigo-500" />
                            {member}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: SET UP HACKATHON & PROJECT INLINE */}
          {mode === "create_project" && (
            <div className="space-y-3.5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  1. Hackathon & Project Setup
                </span>
                {isAdmin && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createNewHackathon}
                      onChange={(e) => setCreateNewHackathon(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    + New Hackathon
                  </label>
                )}
              </div>

              {createNewHackathon && isAdmin ? (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-indigo-900">
                      New Hackathon Name *
                    </label>
                    <input
                      type="text"
                      value={newHkName}
                      onChange={(e) => setNewHkName(e.target.value)}
                      placeholder="e.g. Global AI Builders Sprint 2026"
                      className="w-full px-3 py-1.5 text-xs border border-indigo-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-indigo-900 uppercase">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newHkStartDate}
                        onChange={(e) => setNewHkStartDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 bg-white rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-indigo-900 uppercase">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newHkEndDate}
                        onChange={(e) => setNewHkEndDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 bg-white rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase">
                      Hackathon Description
                    </label>
                    <input
                      type="text"
                      value={newHkDescription}
                      onChange={(e) => setNewHkDescription(e.target.value)}
                      placeholder="Short track overview or theme..."
                      className="w-full px-3 py-1.5 text-xs border border-indigo-200 bg-white rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Target Hackathon
                  </label>
                  <select
                    value={setupHackathonId}
                    onChange={(e) => setSetupHackathonId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {hackathons.map((hk) => (
                      <option key={hk.id} value={hk.id}>
                        {hk.name} ({hk.active ? "Active" : "Ended"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="e.g. EcoPulse AI"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Quantum Coders"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600">
                    Team Members (comma-separated)
                  </label>
                  {newTeamMembers.trim() && (
                    <button
                      type="button"
                      onClick={handlePopulateMembersFromInput}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Sync to Recipients
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={newTeamMembers}
                  onChange={(e) => setNewTeamMembers(e.target.value)}
                  placeholder="Alice Johnson, Bob Smith"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  GitHub Repo URL {isAdmin ? "(Optional)" : "*"}
                </label>
                <input
                  type="url"
                  value={newGithubUrl}
                  onChange={(e) => setNewGithubUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required={!isAdmin}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Problem Statement
                </label>
                <input
                  type="text"
                  value={newProblemStatement}
                  onChange={(e) => setNewProblemStatement(e.target.value)}
                  placeholder="Challenge addressed by this project..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Solution Summary
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Architecture and key features..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* MODE 3: CUSTOM CERTIFICATE */}
          {mode === "custom" && (
            <div className="space-y-3.5 pb-4 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                1. Custom Event & Project Details
              </span>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Hackathon / Event Name *
                </label>
                <input
                  type="text"
                  value={customHackathonName}
                  onChange={(e) => setCustomHackathonName(e.target.value)}
                  placeholder="e.g. Spring Innovation Hackathon 2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={customProjectName}
                    onChange={(e) => setCustomProjectName(e.target.value)}
                    placeholder="e.g. MedBridge Copilot"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="e.g. Neural Builders"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Rank # (Opt)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customRank}
                    onChange={(e) => setCustomRank(e.target.value)}
                    placeholder="1"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Entries (Opt)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customEntries}
                    onChange={(e) => setCustomEntries(e.target.value)}
                    placeholder="12"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Score (Opt)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={customScore}
                    onChange={(e) => setCustomScore(e.target.value)}
                    placeholder="94.5"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RECIPIENT INPUTS (FLEXIBLE SINGLE OR MULTI-RECIPIENT) */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                2. Recipient Name(s) & Email(s)
              </span>
              <button
                type="button"
                onClick={handleAddRecipient}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add Recipient
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-0.5">
              {recipients.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePreviewIdx(idx)}
                  className={`p-3 rounded-xl border transition-colors space-y-2 ${
                    activePreviewIdx === idx
                      ? "bg-indigo-50/40 border-indigo-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                      Recipient #{idx + 1}
                      {activePreviewIdx === idx ? " · Previewing" : ""}
                    </span>
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecipient(idx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Remove recipient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={rec.name}
                      onChange={(e) =>
                        handleUpdateRecipient(idx, "name", e.target.value)
                      }
                      placeholder="Full Name (e.g. Jane Doe)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="email"
                      value={rec.email}
                      onChange={(e) =>
                        handleUpdateRecipient(idx, "email", e.target.value)
                      }
                      placeholder="Email (e.g. jane@uni.edu)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AWARD DESIGNATION & DATE */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              3. Award Designation & Date
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Award Role / Honor
                </label>
                <select
                  value={rolePreset}
                  onChange={(e) => {
                    setRolePreset(e.target.value);
                    setIssuedCerts([]);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRESET_AWARD_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "auto"
                        ? mode === "existing_project"
                          ? `Auto from Standing (${resolvedAwardRole})`
                          : "Auto (Suggested Award)"
                        : r}
                    </option>
                  ))}
                  <option value="__custom__">Custom Award Title...</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Date of Issuance
                </label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => {
                    setIssuedDate(e.target.value);
                    setIssuedCerts([]);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {rolePreset === "__custom__" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Custom Award Designation *
                </label>
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => {
                    setCustomRoleInput(e.target.value);
                    setIssuedCerts([]);
                  }}
                  placeholder="e.g. Best Social Impact Prototype"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
          </div>

          {/* SUBMIT / EXPORT ACTIONS */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Certificate(s)...
                </>
              ) : isAdmin ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === "create_project"
                    ? `Create & Issue ${recipients.length} Verifiable A4 Cert(s)`
                    : `Issue ${recipients.length} Verifiable A4 Cert(s)`}
                </>
              ) : mode === "create_project" ? (
                <>
                  <FileDown className="w-4 h-4" />
                  Save Project & Download Landscape A4 PDF
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Generate & Download Landscape A4 PDF
                </>
              )}
            </button>

            {!isAdmin && (
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                Generates high-resolution 297mm × 210mm Landscape A4 PDFs immediately. Sign in as an <strong>Admin</strong> to publish official <code className="font-mono text-indigo-700">CERT-XXXXXX</code> codes to the public Credentials Ledger.
              </p>
            )}
          </div>
        </form>

        {/* Right: Live Landscape A4 Preview & Issued Credentials */}
        <div className="lg:col-span-7 space-y-4">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Live Landscape A4 Preview
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                297mm × 210mm
              </span>
              {recipients.length > 1 && (
                <select
                  value={activePreviewIdx}
                  onChange={(e) => setActivePreviewIdx(Number(e.target.value))}
                  className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50"
                >
                  {recipients.map((r, i) => (
                    <option key={i} value={i}>
                      #{i + 1}: {r.name.trim() || "Unnamed"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPreviewPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {exportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                A4 PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadPreviewPng}
                disabled={exportingPng}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {exportingPng ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                PNG
              </button>
              <button
                type="button"
                onClick={() => setModalCert(previewCertificate)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                Full View
              </button>
            </div>
          </div>

          {/* Live A4 Aspect Canvas (Canonical CertificateSheet) */}
          <div className="bg-slate-900 p-3 sm:p-5 rounded-2xl shadow-inner">
            <CertificateSheet certificate={previewCertificate} size="preview" />
          </div>

          {/* Issued Verifiable Certificates Tray */}
          {issuedCerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Generated Certificates ({issuedCerts.length})
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Ready for verification &amp; download
                </span>
              </div>

              <div className="space-y-3">
                {issuedCerts.map((cert, idx) => (
                  <div key={cert.id}>
                    <CredentialCard
                      certificate={cert}
                      isSelected={activePreviewIdx === idx}
                      onSelect={() => setActivePreviewIdx(idx)}
                      onPreview={(c) => setModalCert(c)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CertificateModal
        certificate={modalCert}
        isOpen={Boolean(modalCert)}
        onClose={() => setModalCert(null)}
      />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Search, Award, ShieldCheck, Copy, Check, ExternalLink,
  Folder, Users, AlertCircle, RefreshCw, Eye, FileDown, Loader2
} from "lucide-react";
import { Certificate } from "../types";
import { CertificateModal } from "./CertificateModal.js";
import { downloadCertificatePdf, getCertificateVerificationUrl } from "../utils/certificateGenerator.js";

interface CredentialsLedgerProps {
  token?: string | null;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export function CredentialsLedger({ token, currentUser }: CredentialsLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch ?? searchQuery).trim();
    if (!q) {
      setError("Please enter an email address or a unique verification code (e.g. CERT-123456).");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setCertificates([]);

    try {
      let url = "/api/certificates";
      if (q.includes("@")) {
        url += `?email=${encodeURIComponent(q)}`;
      } else {
        url += `?code=${encodeURIComponent(q)}`;
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error("Failed to search credentials database.");
      }
      const data = await res.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "An error occurred while retrieving certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code") || params.get("cert");
    if (codeParam) {
      setSearchQuery(codeParam);
      handleSearch(codeParam);
      return;
    }
    if (currentUser?.email) {
      setSearchQuery(currentUser.email);
      handleSearch(currentUser.email);
    }
  }, [currentUser?.email]);

  const handleCopyLink = (code: string) => {
    const shareUrl = getCertificateVerificationUrl(code);
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDirectDownloadPdf = async (cert: Certificate) => {
    setError("");
    setDownloadingId(cert.id);
    try {
      await downloadCertificatePdf(cert);
    } catch (err: any) {
      setError(err?.message || "Failed to generate A4 PDF certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getBadgeStyle = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("first") || r.includes("grand prize") || r.includes("winner")) {
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        label: "Grand Distinction",
        iconColor: "text-amber-600",
      };
    } else if (r.includes("second") || r.includes("runner-up")) {
      return {
        bg: "bg-slate-100 border-slate-300 text-slate-800",
        label: "Silver Distinction",
        iconColor: "text-slate-500",
      };
    } else if (r.includes("third")) {
      return {
        bg: "bg-amber-50 border-amber-300 text-amber-900",
        label: "Bronze Distinction",
        iconColor: "text-amber-700",
      };
    } else if (r.includes("ai") || r.includes("technical") || r.includes("innovative") || r.includes("integration")) {
      return {
        bg: "bg-indigo-50 border-indigo-200 text-indigo-800",
        label: "Technical Excellence",
        iconColor: "text-indigo-600",
      };
    } else if (r.includes("finalist") || r.includes("honorable") || r.includes("outstanding")) {
      return {
        bg: "bg-sky-50 border-sky-200 text-sky-800",
        label: "Finalist Merit",
        iconColor: "text-sky-600",
      };
    } else {
      return {
        bg: "bg-slate-50 border-slate-200 text-slate-700",
        label: "Official Award",
        iconColor: "text-slate-600",
      };
    }
  };

  return (
    <div id="credentials_ledger_root" className="space-y-8 max-w-4xl mx-auto">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative space-y-5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Academic Credential Verification Engine
          </div>

          <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight leading-tight text-white">
            Verifiable Credentials Ledger
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Verify achievement awards issued by the evaluation committee or download your official Landscape A4 (297mm × 210mm) PDF certificate with embedded QR verification.
          </p>

          {/* Integrated Search Input Form */}
          <div className="pt-1">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="ledger_search_input"
                type="text"
                placeholder="Enter recipient email or verification code (e.g. CERT-123456)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-32 py-3.5 bg-white/10 text-white border border-white/15 rounded-xl placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
              />
              <button
                id="ledger_search_button"
                type="submit"
                disabled={loading}
                className="absolute right-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Verify Award"
                )}
              </button>
            </form>
            {error && (
              <p className="text-rose-300 text-xs mt-3 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Query Results Display */}
      <div id="ledger_results_panel" className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-xs font-mono">Querying verified credentials registry...</p>
          </div>
        ) : searched ? (
          certificates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-3">
              <Award className="w-11 h-11 text-slate-300 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-900">No Matching Credentials Found</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                We could not locate any active credentials matching{" "}
                <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  "{searchQuery}"
                </span>. Confirm the recipient email or double check the <span className="font-mono">CERT-XXXXXX</span> code.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono">
                  Verified Credentials ({certificates.length})
                </h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Registry Verified
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {certificates.map((cert) => {
                  const style = getBadgeStyle(cert.role);
                  return (
                    <div
                      key={cert.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Credential Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`p-2.5 bg-slate-50 border border-slate-200 rounded-xl ${style.iconColor}`}>
                              <Award className="w-6 h-6 stroke-[1.75]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                                <span className="uppercase font-bold tracking-wider">Verifiable Credential</span>
                                <span>·</span>
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Active
                                </span>
                              </div>
                              <h3 className="text-lg font-sans font-bold text-slate-900 mt-0.5">
                                {cert.hackathonName || "HackEval Academic Hackathon"}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Issued on {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                          </div>

                          <span className={`self-start inline-flex items-center px-3 py-1 rounded-md border font-bold text-xs uppercase tracking-wide ${style.bg}`}>
                            {cert.role}
                          </span>
                        </div>

                        {/* Recipient & Project Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Recipient</p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{cert.recipientName}</p>
                            <p className="text-xs text-slate-500 font-mono truncate">{cert.recipientEmail}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                              <Folder className="w-3 h-3 text-indigo-500" /> Project
                            </p>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{cert.projectName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
                              <Users className="w-3 h-3 text-emerald-600" /> Team
                            </p>
                            <p className="text-sm font-semibold text-slate-800 mt-0.5">{cert.teamName}</p>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Code:</span>
                            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                              {cert.certificateCode}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDirectDownloadPdf(cert)}
                              disabled={downloadingId === cert.id}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-xs font-bold text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                              {downloadingId === cert.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FileDown className="w-3.5 h-3.5" />
                              )}
                              {downloadingId === cert.id ? "Building A4..." : "Download A4 PDF"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCertificate(cert);
                                setIsModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview & QR
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(cert.certificateCode)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer"
                            >
                              {copiedId === cert.certificateCode ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Share Link
                                </>
                              )}
                            </button>

                            <a
                              href={`/api/certificates/verify/${encodeURIComponent(cert.certificateCode)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              JSON Verify
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Default State prior to Search */
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-6">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto text-indigo-600">
              <Award className="w-7 h-7 stroke-[1.75]" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-sans font-bold text-slate-900">
                Lookup or Verify a Certificate
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Search by recipient email address or <span className="font-mono">CERT-XXXXXX</span> code above to inspect verified records and download Landscape A4 PDF certificates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-left font-sans">
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/60 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Landscape A4 Export</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Download print-ready 297mm × 210mm PDF and high-resolution PNG certificates directly.</p>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/60 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Scannable QR Proof</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Each certificate embeds a live QR code pointing to its verification record in this ledger.</p>
              </div>
              <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/60 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Public Verification API</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Verify any credential programmatically via shareable verification URL or JSON endpoint.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* High Fidelity Certificate Viewer Modal Overlay */}
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

import React, { useState, useEffect } from "react";
import { 
  Search, Award, ShieldCheck, Copy, Check, ExternalLink, 
  Sparkles, Calendar, Mail, User, Folder, Users, AlertCircle, RefreshCw, Eye
} from "lucide-react";
import { motion } from "motion/react";
import { CertificateModal } from "./CertificateModal.js";

interface CredentialsLedgerProps {
  token?: string | null;
}

export function CredentialsLedger({ token }: CredentialsLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // High fidelity certificate modal integration state
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Automatically check URL parameters or localStorage or state if needed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code") || params.get("cert");
    if (codeParam) {
      setSearchQuery(codeParam);
      handleSearch(codeParam);
    }
  }, []);

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      setError("Please enter an email address or a unique verification code to search.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setCertificates([]);

    try {
      let url = "/api/certificates";
      // Determine if it is a certificate code or email
      if (q.toUpperCase().startsWith("CERT-") || q.length === 11) {
        url += `?code=${encodeURIComponent(q)}`;
      } else {
        url += `?email=${encodeURIComponent(q)}`;
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
      setCertificates(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while retrieving certificates.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const shareUrl = `${window.location.origin}?tab=ledger&code=${code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render beautiful visual awards based on role
  const getBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("first")) {
      return {
        bg: "bg-amber-50 border-amber-200 text-amber-800",
        badge: "👑 First Place",
        iconColor: "text-amber-500",
        gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
        glow: "shadow-amber-100"
      };
    } else if (r.includes("second")) {
      return {
        bg: "bg-slate-100 border-slate-300 text-slate-800",
        badge: "🥈 Second Place",
        iconColor: "text-slate-400",
        gradient: "from-slate-400/10 via-zinc-400/5 to-transparent",
        glow: "shadow-slate-100"
      };
    } else if (r.includes("third")) {
      return {
        bg: "bg-amber-100/60 border-amber-300/60 text-amber-900",
        badge: "🥉 Third Place",
        iconColor: "text-amber-700",
        gradient: "from-amber-700/10 via-amber-600/5 to-transparent",
        glow: "shadow-amber-50"
      };
    } else if (r.includes("best ai") || r.includes("integration")) {
      return {
        bg: "bg-indigo-50 border-indigo-200 text-indigo-800",
        badge: "✨ Best AI Integration",
        iconColor: "text-indigo-500",
        gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
        glow: "shadow-indigo-100"
      };
    } else if (r.includes("finalist") || r.includes("outstanding")) {
      return {
        bg: "bg-cyan-50 border-cyan-200 text-cyan-800",
        badge: "⭐ Outstanding Finalist",
        iconColor: "text-cyan-500",
        gradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
        glow: "shadow-cyan-50"
      };
    } else {
      return {
        bg: "bg-slate-50 border-slate-200 text-slate-700",
        badge: "🎓 Completion Award",
        iconColor: "text-slate-500",
        gradient: "from-slate-500/10 via-slate-400/5 to-transparent",
        glow: "shadow-slate-50"
      };
    }
  };

  return (
    <div id="credentials_ledger_root" className="space-y-8 max-w-4xl mx-auto">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4" /> Academic Credential Engine
          </div>
          
          <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight leading-none text-white">
            Verifiable Credentials Ledger
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Verify the authenticity of digital achievement awards issued by the hackathon evaluation committee. Search by participant email address or unique certificate verification code.
          </p>

          {/* Integrated Search Input Form */}
          <div className="pt-2">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="ledger_search_input"
                type="text"
                placeholder="Enter email address (e.g., student@school.edu) or code (e.g., CERT-123456)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-4 bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-2xl placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
              <button
                id="ledger_search_button"
                type="submit"
                disabled={loading}
                className="absolute right-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
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
              <p className="text-rose-400 text-xs mt-3 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Query Results Display */}
      <div id="ledger_results_panel" className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-xs font-mono">Quering secure distributed database ledger...</p>
          </div>
        ) : searched ? (
          certificates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-bold text-slate-800">No Verifiable Credentials Found</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                We could not locate any active credentials matching <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">"{searchQuery}"</span>. Please confirm the spelling or double check the verification code.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-500 tracking-wider uppercase font-mono">
                  Matching Verified Records ({certificates.length})
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Validated
                </span>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {certificates.map((cert) => {
                  const style = getBadgeStyle(cert.role);
                  return (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative ${style.glow}`}
                    >
                      {/* Decorative Ribbon/Background */}
                      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${style.gradient} rounded-bl-full pointer-events-none -z-0 opacity-80`} />
                      
                      {/* Dynamic Award Sticker */}
                      <div className="absolute top-6 right-6 z-10 hidden sm:block">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs uppercase tracking-wider ${style.bg}`}>
                          {style.badge}
                        </span>
                      </div>

                      <div className="p-6 sm:p-10 relative z-10 flex flex-col justify-between h-full space-y-8">
                        {/* Credential Header */}
                        <div className="flex items-start gap-4">
                          <div className={`p-3 bg-slate-50 border border-slate-100 rounded-2xl ${style.iconColor}`}>
                            <Award className="w-8 h-8 stroke-[1.75]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">Verifiable Credential</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] font-mono text-emerald-600 font-extrabold flex items-center gap-0.5">
                                <ShieldCheck className="w-3 h-3" /> Secure Record
                              </span>
                            </div>
                            <h3 className="text-lg font-sans font-black text-slate-900 mt-1">
                              Certificate of Achievement
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Issued on {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Certificate Body text */}
                        <div className="border-y border-slate-100 py-6 my-2 space-y-4">
                          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider text-center">
                            This officially certifies that
                          </p>
                          <div className="text-center space-y-1">
                            <h4 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">
                              {cert.recipientName}
                            </h4>
                            <p className="text-slate-400 text-xs font-mono">
                              ({cert.recipientEmail})
                            </p>
                          </div>
                          
                          <p className="text-slate-600 text-sm leading-relaxed text-center max-w-xl mx-auto pt-1">
                            has demonstrated exceptional academic innovation and software development skills, earning the honor of <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{cert.role}</span> for the project submission:
                          </p>

                          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3 max-w-lg mx-auto">
                            <div className="flex items-start gap-3">
                              <Folder className="w-4.5 h-4.5 text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Project Submission</p>
                                <p className="text-slate-900 font-extrabold text-sm">{cert.projectName}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 border-t border-slate-200/50 pt-2">
                              <Users className="w-4.5 h-4.5 text-emerald-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Team Name</p>
                                <p className="text-slate-700 font-bold text-xs">{cert.teamName}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Metadata & Actions Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div className="space-y-1">
                            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Verification ID Code</p>
                            <p className="text-xs font-mono font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block">
                              {cert.certificateCode}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCertificate(cert);
                                setIsModalOpen(true);
                              }}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-extrabold text-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View & Print
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(cert.certificateCode)}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold text-slate-700 hover:text-slate-900 shadow-sm transition-all cursor-pointer"
                            >
                              {copiedId === cert.certificateCode ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  Link Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Share Link
                                </>
                              )}
                            </button>
                            <a
                              href={`/api/certificates?code=${cert.certificateCode}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-extrabold text-slate-700 shadow-sm transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              JSON Verify
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Default State prior to Search */
          <div className="bg-white border border-slate-200 rounded-3xl p-10 md:p-16 text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <Award className="w-8 h-8 stroke-[1.75]" />
            </div>
            
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-sans font-black text-slate-900">
                Lookup Your Digital Certificate
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Academic certificates issued for top performing teams and successful completions can be searched above. Once found, they can be verifiably cited on resumes and LinkedIn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left font-sans">
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
                <span className="text-lg">🛡️</span>
                <h4 className="font-extrabold text-slate-900 text-xs">Tamper Proof</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Every record has a unique ledger verification ID that points back to database records.</p>
              </div>
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
                <span className="text-lg">✨</span>
                <h4 className="font-extrabold text-slate-900 text-xs">Verifiably Public</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Anyone can use the verification code or JSON Verify link to check a credential's active status.</p>
              </div>
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-1">
                <span className="text-lg">👑</span>
                <h4 className="font-extrabold text-slate-900 text-xs">Achievement Roles</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed">Special gold, silver, bronze, and AI laurels correspond directly to finalized jury ranks.</p>
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

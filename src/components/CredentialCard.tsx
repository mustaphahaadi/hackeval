import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  FileDown,
  Eye,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Folder,
  Users
} from "lucide-react";
import { Certificate } from "../types";
import {
  getAwardTheme,
  getCertificateVerificationUrl,
  downloadCertificatePdf
} from "../utils/certificateGenerator.js";

interface CredentialCardProps {
  certificate: Certificate;
  onPreview: (cert: Certificate) => void;
  showVerificationLinks?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function CredentialCard({
  certificate,
  onPreview,
  showVerificationLinks = true,
  isSelected = false,
  onSelect
}: CredentialCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const theme = getAwardTheme(certificate.role);
  const isOfficial = String(certificate.certificateCode || "").startsWith("CERT-") &&
    certificate.certificateCode !== "CERT-PREVIEW";

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadCertificatePdf(certificate);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShareLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = getCertificateVerificationUrl(certificate.certificateCode);
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-white border rounded-2xl overflow-hidden transition-shadow ${
        onSelect ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-indigo-400 shadow-md ring-1 ring-indigo-200"
          : "border-slate-200 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Top hairline accent band matching award theme */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: theme.secondaryHex }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border border-slate-200 shrink-0 ${theme.iconColorClass}`}
              style={{ backgroundColor: theme.accentLightHex }}
            >
              <Award className="w-5 h-5 stroke-[1.75]" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500">
                <span className="uppercase font-bold tracking-wider">
                  {isOfficial ? "Verifiable Credential" : "Local A4 Credential"}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isOfficial ? "Verified" : "Generated"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{formattedDate}</span>
              </div>

              <h3 className="text-base font-sans font-bold text-slate-900 mt-0.5 truncate">
                {certificate.hackathonName || "HackEval Academic Hackathon"}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
            {((typeof certificate.projectRank === "number" &&
              certificate.projectRank > 0) ||
              (typeof certificate.combinedScore === "number" &&
                certificate.combinedScore > 0)) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs tabular-nums whitespace-nowrap">
                {typeof certificate.projectRank === "number" &&
                certificate.projectRank > 0
                  ? `Rank #${certificate.projectRank}${
                      certificate.totalHackathonEntries
                        ? `/${certificate.totalHackathonEntries}`
                        : ""
                    }`
                  : "Ranked"}
                {typeof certificate.combinedScore === "number" &&
                certificate.combinedScore > 0
                  ? ` · ${certificate.combinedScore}/100`
                  : ""}
              </span>
            )}

            <span
              className={`inline-flex items-center px-3 py-1 rounded-md border font-bold text-xs uppercase tracking-wide whitespace-nowrap ${theme.badgeClass}`}
            >
              {certificate.role}
            </span>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">
              Recipient
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {certificate.recipientName}
            </p>
            <p className="text-xs text-slate-500 font-mono truncate">
              {certificate.recipientEmail}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
              <Folder className="w-3 h-3 text-indigo-500" /> Project
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
              {certificate.projectName}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-600" /> Team
            </p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
              {certificate.teamName}
            </p>
          </div>
        </div>

        {/* Unified Action Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="uppercase font-bold text-[10px]">Code</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
              {certificate.certificateCode}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-xs font-bold text-white rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {downloading ? "Building A4..." : "Download A4 PDF"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(certificate);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview A4 & QR
            </button>

            {showVerificationLinks && isOfficial && (
              <>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Share Link
                    </>
                  )}
                </button>

                <a
                  href={`/api/certificates/verify/${encodeURIComponent(
                    certificate.certificateCode
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Verify Record
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

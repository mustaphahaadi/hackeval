import React, { useState, useEffect } from "react";
import {
  X, Printer, ShieldCheck, Download, Award, CheckCircle2,
  Copy, Check, FileDown, Image as ImageIcon, Loader2
} from "lucide-react";
import { Certificate } from "../types";
import {
  getAwardTheme,
  generateCertificateQrDataUrl,
  getCertificateVerificationUrl,
  downloadCertificatePdf,
  downloadCertificatePng
} from "../utils/certificateGenerator.js";

interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let active = true;
    if (isOpen && certificate?.certificateCode) {
      setExportError("");
      generateCertificateQrDataUrl(certificate.certificateCode)
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, certificate?.certificateCode]);

  if (!isOpen || !certificate) return null;

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const theme = getAwardTheme(certificate.role);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setExportError("");
    setDownloadingPdf(true);
    try {
      await downloadCertificatePdf(certificate);
    } catch (err: any) {
      setExportError(err?.message || "Failed to generate A4 PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    setExportError("");
    setDownloadingPng(true);
    try {
      await downloadCertificatePng(certificate);
    } catch (err: any) {
      setExportError(err?.message || "Failed to export certificate PNG.");
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleCopyVerifyLink = () => {
    const url = getCertificateVerificationUrl(certificate.certificateCode);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {/* Dynamic style tag for clean A4 landscape printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
            background: none !important;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible !important;
          }
          #print-area-wrapper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 28px !important;
            z-index: 9999999 !important;
            background-color: white !important;
            display: flex !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}} />

      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-6 max-h-[95vh]">
        {/* Modal Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                A4 Landscape Certificate Viewer
              </h2>
              <p className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                297mm × 210mm · Verified Record · {certificate.certificateCode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-xs font-bold text-white rounded-lg shadow transition-colors cursor-pointer"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {downloadingPdf ? "Generating A4..." : "Download A4 PDF"}
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloadingPng}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {downloadingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              Download PNG
            </button>

            <button
              type="button"
              onClick={handleCopyVerifyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Verify Link
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Print A4 Landscape"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {exportError && (
          <div className="px-6 py-2.5 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs font-medium">
            {exportError}
          </div>
        )}

        {/* Modal Scrollable Workspace */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-950 flex justify-center items-center">
          {/* Certificate Container with exact A4 Landscape proportion ratio (297:210 = 1.4142) */}
          <div
            id="print-area-wrapper"
            className="w-full max-w-4xl aspect-[297/210] bg-white text-slate-900 p-6 sm:p-10 md:p-12 rounded-xl relative shadow-xl flex flex-col justify-between overflow-hidden border border-slate-200"
          >
            {/* Subtle watermark gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.03),transparent_70%)] pointer-events-none" />
            {/* Corner ornaments */}
            <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-slate-300 pointer-events-none" />
            <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-slate-300 pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-slate-300 pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-slate-300 pointer-events-none" />

            {/* Inner Double-Ornate Framing */}
            <div className={`absolute inset-4 border-2 ${theme.borderClass} border-double pointer-events-none rounded-lg`} />
            <div className="absolute inset-5 border border-slate-200 pointer-events-none rounded" />

            <div className="relative z-10 flex flex-col justify-between h-full text-center py-2 px-4 sm:px-6">
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex justify-center">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-full text-slate-800">
                    <Award className="w-6 h-6 stroke-[1.5]" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">
                    HackEval Academic Evaluation Committee
                  </p>
                  <h3 className="text-xs sm:text-sm font-sans font-extrabold text-slate-900 uppercase tracking-wider mt-0.5">
                    Certificate of Achievement
                  </h3>
                  {certificate.hackathonName && (
                    <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                      {certificate.hackathonName}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient & Citation */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  This credential is proudly presented to
                </p>
                <div className="space-y-0.5">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-950 leading-none">
                    {certificate.recipientName}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {certificate.recipientEmail}
                  </p>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
                  for demonstrating exceptional software engineering, architectural clarity, and prototype execution, earning the distinguished recognition of
                </p>
                <div>
                  <span className={`inline-flex px-4 py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold tracking-wide uppercase ${theme.borderClass} bg-slate-50 text-slate-900`}>
                    {certificate.role}
                  </span>
                </div>
              </div>

              {/* Project and Team metadata block */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3.5 max-w-xl mx-auto w-full grid grid-cols-2 gap-4 text-left">
                <div className="border-r border-slate-200 pr-4">
                  <p className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Project Submission</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{certificate.projectName}</p>
                </div>
                <div className="pl-1">
                  <p className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">Development Team</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{certificate.teamName}</p>
                </div>
              </div>

              {/* Footer: Date, Seal, Authority & QR Code */}
              <div className="grid grid-cols-4 items-end gap-3 pt-2">
                {/* Date */}
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-300 mx-auto w-full pb-1">
                    <p className="text-slate-800 font-bold text-[11px] font-sans">
                      {formattedDate}
                    </p>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 uppercase font-bold">
                    Date of Issuance
                  </p>
                </div>

                {/* Central Foil Seal (static, crisp) */}
                <div className="flex justify-center pb-1">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute -bottom-3.5 flex gap-3">
                      <div className={`w-2.5 h-6 ${theme.ribbonClass} rotate-12 opacity-85 rounded-b`} />
                      <div className={`w-2.5 h-6 ${theme.ribbonClass} -rotate-12 opacity-85 rounded-b`} />
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.sealGradientClass} flex items-center justify-center text-white border-2 border-white shadow-sm relative z-10`}>
                      <div className="absolute inset-1 border border-white/45 border-dashed rounded-full" />
                      <span className="text-[7px] font-extrabold tracking-tight text-center leading-tight px-1">
                        {theme.sealLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-300 mx-auto w-full pb-1">
                    <p className="text-slate-800 font-serif italic font-semibold text-sm leading-none">
                      HackEval Board
                    </p>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 uppercase font-bold">
                    Evaluation Authority
                  </p>
                </div>

                {/* Scannable Verification QR + Code */}
                <div className="flex flex-col items-center justify-end space-y-1">
                  {qrDataUrl && (
                    <div className="p-1 bg-white border border-slate-200 rounded-md">
                      <img src={qrDataUrl} alt={`Verify ${certificate.certificateCode}`} className="w-11 h-11 sm:w-12 sm:h-12" />
                    </div>
                  )}
                  <p className="text-[9px] font-mono font-bold text-indigo-700 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    {certificate.certificateCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Status Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            Landscape A4 (297mm × 210mm) credential with live QR verification.
          </span>
          <span className="font-mono text-[10px]">
            ID: {certificate.id}
          </span>
        </div>
      </div>
    </div>
  );
}

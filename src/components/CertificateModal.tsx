import React, { useState } from "react";
import {
  X, Printer, Award, CheckCircle2,
  Copy, Check, FileDown, Image as ImageIcon, Loader2
} from "lucide-react";
import { Certificate } from "../types";
import {
  getCertificateVerificationUrl,
  downloadCertificatePdf,
  downloadCertificatePng
} from "../utils/certificateGenerator.js";
import { CertificateSheet } from "./CertificateSheet.js";

interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportError, setExportError] = useState("");

  if (!isOpen || !certificate) return null;

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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-xs font-bold text-white rounded-lg shadow transition-colors cursor-pointer whitespace-nowrap"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
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
          <div className="w-full max-w-4xl">
            <CertificateSheet
              id="print-area-wrapper"
              certificate={certificate}
              size="full"
            />
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

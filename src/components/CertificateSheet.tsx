import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Certificate } from "../types";
import {
  generateCertificateQrDataUrl,
  getAwardTheme
} from "../utils/certificateGenerator.js";

interface CertificateSheetProps {
  certificate: Certificate;
  id?: string;
  size?: "full" | "preview";
}

export function CertificateSheet({
  certificate,
  id,
  size = "full"
}: CertificateSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (certificate?.certificateCode) {
      generateCertificateQrDataUrl(certificate.certificateCode)
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
    } else {
      setQrDataUrl("");
    }
    return () => {
      active = false;
    };
  }, [certificate?.certificateCode]);

  const theme = getAwardTheme(certificate.role);
  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const cleanRole =
    certificate.role
      .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*/u, "")
      .trim() || certificate.role;

  const hasStanding =
    (typeof certificate.projectRank === "number" && certificate.projectRank > 0) ||
    (typeof certificate.combinedScore === "number" && certificate.combinedScore > 0);

  const isPreview = size === "preview";

  return (
    <div
      id={id}
      className={`w-full aspect-[297/210] bg-white text-slate-900 rounded-xl relative shadow-xl flex flex-col justify-between overflow-hidden border border-slate-200 ${
        isPreview ? "p-4 sm:p-6" : "p-6 sm:p-10 md:p-11"
      }`}
    >
      {/* Subtle radial archival wash matching A4 PDF export */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.035),transparent_70%)] pointer-events-none" />

      {/* Outer slate rule & double archival frames */}
      <div
        className={`absolute ${
          isPreview ? "inset-2" : "inset-3"
        } border border-slate-200 pointer-events-none rounded-sm`}
      />
      <div
        className={`absolute ${
          isPreview ? "inset-3" : "inset-4"
        } border-2 pointer-events-none rounded-sm`}
        style={{ borderColor: theme.secondaryHex }}
      />
      <div
        className={`absolute ${
          isPreview ? "inset-4" : "inset-5"
        } border border-slate-300 pointer-events-none rounded-sm`}
      />

      {/* Corner L-Brackets in theme primaryHex */}
      <div
        className={`absolute ${
          isPreview ? "top-2 left-2 w-6 h-6" : "top-3 left-3 w-10 h-10"
        } border-t-2 border-l-2 pointer-events-none`}
        style={{ borderColor: theme.primaryHex }}
      />
      <div
        className={`absolute ${
          isPreview ? "top-2 right-2 w-6 h-6" : "top-3 right-3 w-10 h-10"
        } border-t-2 border-r-2 pointer-events-none`}
        style={{ borderColor: theme.primaryHex }}
      />
      <div
        className={`absolute ${
          isPreview ? "bottom-2 left-2 w-6 h-6" : "bottom-3 left-3 w-10 h-10"
        } border-b-2 border-l-2 pointer-events-none`}
        style={{ borderColor: theme.primaryHex }}
      />
      <div
        className={`absolute ${
          isPreview ? "bottom-2 right-2 w-6 h-6" : "bottom-3 right-3 w-10 h-10"
        } border-b-2 border-r-2 pointer-events-none`}
        style={{ borderColor: theme.primaryHex }}
      />

      {/* Inner Certificate Content */}
      <div
        className={`relative z-10 flex flex-col justify-between h-full text-center ${
          isPreview ? "py-1 px-3 sm:px-5" : "py-2 px-4 sm:px-8"
        }`}
      >
        {/* Top Crest & Header */}
        <div className={isPreview ? "space-y-0.5" : "space-y-1.5"}>
          <div className="flex justify-center">
            <div
              className={`rounded-full flex items-center justify-center border ${
                isPreview ? "w-6 h-6 text-xs" : "w-9 h-9 text-base"
              } font-bold`}
              style={{
                backgroundColor: theme.accentLightHex,
                borderColor: theme.secondaryHex,
                color: theme.primaryHex
              }}
            >
              ★
            </div>
          </div>

          <p
            className={`font-mono tracking-widest text-slate-500 font-bold uppercase ${
              isPreview ? "text-[7px] sm:text-[8px]" : "text-[9px] sm:text-[10px]"
            }`}
          >
            HackEval Academic Evaluation Committee
          </p>

          <h3
            className={`font-sans font-extrabold text-slate-900 uppercase tracking-wider ${
              isPreview ? "text-[10px] sm:text-xs" : "text-xs sm:text-base"
            }`}
          >
            Certificate of Achievement
          </h3>

          {certificate.hackathonName && (
            <p
              className={`font-sans font-semibold uppercase tracking-wide truncate ${
                isPreview ? "text-[8px] sm:text-[10px]" : "text-[10px] sm:text-xs"
              }`}
              style={{ color: theme.primaryHex }}
            >
              {certificate.hackathonName}
            </p>
          )}

          <div className="mx-auto w-1/3 border-b border-slate-200 pt-0.5" />
        </div>

        {/* Recipient & Citation */}
        <div className={isPreview ? "space-y-1" : "space-y-2"}>
          <p
            className={`font-mono tracking-widest text-slate-500 uppercase font-semibold ${
              isPreview ? "text-[7px] sm:text-[8px]" : "text-[9px] sm:text-[10px]"
            }`}
          >
            This credential is proudly presented to
          </p>

          <div className="space-y-0.5">
            <h1
              className={`font-serif font-bold tracking-tight text-slate-950 leading-none truncate px-4 ${
                isPreview
                  ? "text-xl sm:text-3xl"
                  : "text-3xl sm:text-4xl md:text-5xl"
              }`}
            >
              {certificate.recipientName}
            </h1>
            <div
              className="mx-auto w-2/5 border-b pt-0.5"
              style={{ borderColor: theme.secondaryHex }}
            />
            <p
              className={`text-slate-500 font-mono truncate pt-0.5 ${
                isPreview ? "text-[8px] sm:text-[9px]" : "text-[10px] sm:text-xs"
              }`}
            >
              {certificate.recipientEmail}
            </p>
          </div>

          <p
            className={`text-slate-600 leading-snug max-w-2xl mx-auto font-medium ${
              isPreview ? "text-[8px] sm:text-[10px] hidden sm:block" : "text-xs sm:text-[13px]"
            }`}
          >
            for demonstrating outstanding software architecture, engineering rigor, and prototype execution, earning official recognition as
          </p>

          <div>
            <span
              className={`inline-flex rounded-md border font-extrabold tracking-wide uppercase ${
                isPreview
                  ? "px-3 py-0.5 text-[9px] sm:text-[11px]"
                  : "px-4 py-1 text-[11px] sm:text-sm"
              }`}
              style={{
                backgroundColor: theme.accentLightHex,
                borderColor: theme.secondaryHex,
                color: theme.primaryHex
              }}
            >
              {cleanRole}
            </span>
          </div>
        </div>

        {/* Project, Team & Official Standing Metadata Block */}
        <div
          className={`bg-slate-50/90 border border-slate-200/90 rounded-lg mx-auto w-full grid text-left ${
            hasStanding
              ? isPreview
                ? "max-w-lg grid-cols-3 p-1.5 sm:p-2 gap-2"
                : "max-w-2xl grid-cols-3 p-2.5 sm:p-3 gap-3 sm:gap-4"
              : isPreview
              ? "max-w-md grid-cols-2 p-1.5 sm:p-2 gap-2"
              : "max-w-xl grid-cols-2 p-2.5 sm:p-3 gap-3 sm:gap-4"
          }`}
        >
          <div className="border-r border-slate-200 pr-2 min-w-0">
            <p
              className={`font-mono text-slate-500 uppercase font-bold tracking-wider ${
                isPreview ? "text-[6px] sm:text-[7px]" : "text-[8px] sm:text-[9px]"
              }`}
            >
              Project Submission
            </p>
            <p
              className={`font-bold text-slate-900 mt-0.5 truncate ${
                isPreview ? "text-[9px] sm:text-[11px]" : "text-xs sm:text-[13px]"
              }`}
            >
              {certificate.projectName}
            </p>
          </div>

          <div
            className={`${
              hasStanding ? "border-r border-slate-200 pr-2" : ""
            } pl-1 min-w-0`}
          >
            <p
              className={`font-mono text-slate-500 uppercase font-bold tracking-wider ${
                isPreview ? "text-[6px] sm:text-[7px]" : "text-[8px] sm:text-[9px]"
              }`}
            >
              Development Team
            </p>
            <p
              className={`font-bold text-slate-800 mt-0.5 truncate ${
                isPreview ? "text-[9px] sm:text-[11px]" : "text-xs sm:text-[13px]"
              }`}
            >
              {certificate.teamName}
            </p>
          </div>

          {hasStanding && (
            <div className="pl-1 min-w-0">
              <p
                className={`font-mono text-slate-500 uppercase font-bold tracking-wider ${
                  isPreview ? "text-[6px] sm:text-[7px]" : "text-[8px] sm:text-[9px]"
                }`}
              >
                Official Standing
              </p>
              <p
                className={`font-mono font-extrabold mt-0.5 truncate tabular-nums ${
                  isPreview ? "text-[9px] sm:text-[11px]" : "text-xs sm:text-[13px]"
                }`}
                style={{ color: theme.primaryHex }}
              >
                {typeof certificate.projectRank === "number" && certificate.projectRank > 0
                  ? `Rank #${certificate.projectRank}${
                      certificate.totalHackathonEntries
                        ? `/${certificate.totalHackathonEntries}`
                        : ""
                    }`
                  : "Evaluated"}
                {typeof certificate.combinedScore === "number" && certificate.combinedScore > 0
                  ? ` · ${certificate.combinedScore}/100`
                  : ""}
              </p>
            </div>
          )}
        </div>

        {/* Footer: Date, Seal, Authority & Verification QR */}
        <div className="space-y-1">
          <div className="grid grid-cols-4 items-end gap-2 sm:gap-3">
            {/* Date */}
            <div className="text-center space-y-0.5">
              <div className="border-b border-slate-300 mx-auto w-full pb-0.5">
                <p
                  className={`text-slate-900 font-bold font-sans truncate ${
                    isPreview ? "text-[8px] sm:text-[10px]" : "text-[10px] sm:text-xs"
                  }`}
                >
                  {formattedDate}
                </p>
              </div>
              <p
                className={`font-mono text-slate-500 uppercase font-bold ${
                  isPreview ? "text-[6px] sm:text-[7px]" : "text-[7px] sm:text-[8px]"
                }`}
              >
                Date of Issuance
              </p>
            </div>

            {/* Central Foil Seal + Ribbons */}
            <div className="flex justify-center pb-0.5">
              <div className="relative flex flex-col items-center">
                <div
                  className={`absolute flex ${
                    isPreview ? "-bottom-2 gap-1.5" : "-bottom-3 gap-2.5"
                  }`}
                >
                  <div
                    className={`${
                      isPreview ? "w-1.5 h-3.5" : "w-2.5 h-5"
                    } rotate-12 opacity-90 rounded-b`}
                    style={{ backgroundColor: theme.primaryHex }}
                  />
                  <div
                    className={`${
                      isPreview ? "w-1.5 h-3.5" : "w-2.5 h-5"
                    } -rotate-12 opacity-90 rounded-b`}
                    style={{ backgroundColor: theme.primaryHex }}
                  />
                </div>
                <div
                  className={`rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm relative z-10 ${
                    isPreview ? "w-8 h-8 sm:w-9 sm:h-9" : "w-11 h-11 sm:w-12 sm:h-12"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.sealTopHex}, ${theme.sealBottomHex})`
                  }}
                >
                  <div className="absolute inset-0.5 border border-white/55 border-dashed rounded-full" />
                  <span
                    className={`font-extrabold tracking-tight text-center leading-tight px-0.5 ${
                      isPreview ? "text-[5px] sm:text-[6px]" : "text-[7px]"
                    }`}
                  >
                    {theme.sealLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="text-center space-y-0.5">
              <div className="border-b border-slate-300 mx-auto w-full pb-0.5">
                <p
                  className={`text-slate-800 font-serif italic font-semibold leading-none truncate ${
                    isPreview ? "text-[10px] sm:text-xs" : "text-xs sm:text-base"
                  }`}
                >
                  HackEval Committee
                </p>
              </div>
              <p
                className={`font-mono text-slate-500 uppercase font-bold ${
                  isPreview ? "text-[6px] sm:text-[7px]" : "text-[7px] sm:text-[8px]"
                }`}
              >
                Evaluation Board
              </p>
            </div>

            {/* Scannable Verification QR + Code */}
            <div className="flex flex-col items-center justify-end space-y-0.5">
              {qrDataUrl && (
                <div className="p-0.5 bg-white border border-slate-200 rounded">
                  <img
                    src={qrDataUrl}
                    alt={`Verify ${certificate.certificateCode}`}
                    className={
                      isPreview
                        ? "w-7 h-7 sm:w-9 sm:h-9"
                        : "w-10 h-10 sm:w-12 sm:h-12"
                    }
                  />
                </div>
              )}
              <p
                className={`font-mono font-bold text-indigo-700 flex items-center gap-0.5 ${
                  isPreview ? "text-[7px] sm:text-[8px]" : "text-[8px] sm:text-[9px]"
                }`}
              >
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                {certificate.certificateCode}
              </p>
              <span
                className={`font-mono text-slate-400 uppercase ${
                  isPreview ? "text-[5px] hidden sm:block" : "text-[6px] sm:text-[7px]"
                }`}
              >
                Scan to Verify
              </span>
            </div>
          </div>

          <p
            className={`font-mono text-slate-400 uppercase tracking-wider truncate ${
              isPreview ? "text-[6px]" : "text-[7px] sm:text-[8px]"
            }`}
          >
            Credential ID: {certificate.id} · Verify at HackEval Credentials Ledger
          </p>
        </div>
      </div>
    </div>
  );
}

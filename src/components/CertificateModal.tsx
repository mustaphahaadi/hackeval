import React from "react";
import { X, Printer, ShieldCheck, Download, Award, Calendar, CheckCircle2 } from "lucide-react";

interface Certificate {
  id: string;
  projectId: string;
  projectName: string;
  teamName: string;
  recipientEmail: string;
  recipientName: string;
  role: string;
  issuedAt: string;
  certificateCode: string;
}

interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  if (!isOpen || !certificate) return null;

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  // Helper to get styling attributes based on the award rank/role
  const getAwardDecoration = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("first")) {
      return {
        borderColor: "border-amber-400",
        sealBg: "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600",
        ribbonColor: "bg-amber-600",
        badgeText: "🥇 First Place Champion",
        sealText: "1ST PLACE",
        sub: "Grand Prize Winner",
      };
    } else if (r.includes("second")) {
      return {
        borderColor: "border-slate-400",
        sealBg: "bg-gradient-to-br from-slate-300 via-slate-400 to-zinc-500",
        ribbonColor: "bg-slate-500",
        badgeText: "🥈 Second Place Silver Medalist",
        sealText: "2ND PLACE",
        sub: "First Runner-Up",
      };
    } else if (r.includes("third")) {
      return {
        borderColor: "border-amber-700/60",
        sealBg: "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800",
        ribbonColor: "bg-amber-800",
        badgeText: "🥉 Third Place Bronze Medalist",
        sealText: "3RD PLACE",
        sub: "Second Runner-Up",
      };
    } else if (r.includes("best ai") || r.includes("integration")) {
      return {
        borderColor: "border-indigo-400",
        sealBg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700",
        ribbonColor: "bg-indigo-600",
        badgeText: "✨ Best Artificial Intelligence Integration",
        sealText: "AI SPECIAL",
        sub: "Technical Excellence",
      };
    } else if (r.includes("finalist") || r.includes("outstanding")) {
      return {
        borderColor: "border-cyan-400",
        sealBg: "bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600",
        ribbonColor: "bg-cyan-600",
        badgeText: "⭐ Outstanding Finalist Award",
        sealText: "FINALIST",
        sub: "Outstanding Innovator",
      };
    } else {
      return {
        borderColor: "border-slate-300",
        sealBg: "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600",
        ribbonColor: "bg-slate-600",
        badgeText: "🎓 Official Completion Certificate",
        sealText: "COMPLETED",
        sub: "Successful Submission",
      };
    }
  };

  const decor = getAwardDecoration(certificate.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {/* Dynamic style tag for high-fidelity print layout configuration */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all application chrome, scrollbars, and buttons */
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
            padding: 0 !important;
            z-index: 9999999 !important;
            background-color: white !important;
            display: block !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Setup page attributes to default to landscape and zero margin */
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}} />

      <div className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[95vh]">
        {/* Modal Toolbar Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">
                Academic Certificate Viewer
              </h2>
              <p className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                VERIFIABLE CREDENTIAL LEDGER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white rounded-xl shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF (A4 Landscape)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace */}
        <div className="p-6 md:p-8 overflow-y-auto bg-slate-950 flex justify-center items-center">
          {/* Certificate Container with landscape A4 proportion ratio */}
          <div 
            id="print-area-wrapper" 
            className="w-full max-w-4xl aspect-[1.414/1] bg-white text-slate-900 p-8 md:p-14 rounded-2xl relative shadow-lg flex flex-col justify-between overflow-hidden border border-slate-200"
          >
            {/* Watermark Graphic & Guilloche styling */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.02),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-slate-200 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-slate-200 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-slate-200 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-slate-200 pointer-events-none" />

            {/* Inner Double-Ornate Framing */}
            <div className={`absolute inset-4 border-2 ${decor.borderColor} border-double pointer-events-none rounded-lg`} />
            <div className="absolute inset-5 border border-slate-200 pointer-events-none rounded" />

            <div className="relative z-10 flex flex-col justify-between h-full text-center py-4 px-6">
              {/* Header: Insignia & Event Title */}
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-indigo-500/10 rounded-full blur-sm" />
                    <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-full text-slate-800">
                      <Award className="w-7 h-7 stroke-[1.5]" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono tracking-widest text-slate-400 font-extrabold uppercase">
                    Autonomous AI Hackathon Committee
                  </p>
                  <h3 className="text-xs font-sans font-black text-slate-800 uppercase tracking-wider mt-0.5">
                    Academic Certificate of Honor
                  </h3>
                </div>
              </div>

              {/* Title & Certification Core Statement */}
              <div className="space-y-4">
                <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  This academic credential is proud to declare that
                </p>
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight text-slate-900 leading-none">
                    {certificate.recipientName}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono">
                    ({certificate.recipientEmail})
                  </p>
                </div>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
                  is officially recognized for demonstrating exceptional software engineering practices, outstanding prototype execution, and high-fidelity project development, earning the distinguished role of
                </p>
                <div>
                  <span className={`inline-flex px-4 py-1.5 rounded-full border text-xs md:text-sm font-black tracking-wide uppercase ${decor.borderColor} bg-slate-50 text-slate-900 shadow-sm`}>
                    {certificate.role}
                  </span>
                </div>
              </div>

              {/* Project and Team metadata block */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 md:p-4 max-w-xl mx-auto w-full grid grid-cols-2 gap-4 text-left">
                <div className="border-r border-slate-200/60 pr-4">
                  <p className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">PROJECT ENTRY</p>
                  <p className="text-xs font-black text-slate-900 mt-0.5 truncate">{certificate.projectName}</p>
                </div>
                <div className="pl-2">
                  <p className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">DEVELOPMENT TEAM</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{certificate.teamName}</p>
                </div>
              </div>

              {/* Footer: Date, Gold Foil Seal, Verification Code & Dynamic Signatures */}
              <div className="grid grid-cols-3 items-center gap-2 pt-4">
                {/* Issue Date Signature Column */}
                <div className="text-center space-y-1.5">
                  <div className="border-b border-slate-300 mx-auto w-4/5 pb-1">
                    <p className="text-slate-700 font-bold text-xs font-sans tracking-wide">
                      {formattedDate}
                    </p>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                    DATE OF ISSUANCE
                  </p>
                </div>

                {/* Central Gold Foil Seal Column */}
                <div className="flex justify-center">
                  <div className="relative flex flex-col items-center">
                    {/* Ribbon tails */}
                    <div className="absolute -bottom-6 flex gap-4">
                      <div className={`w-3.5 h-10 ${decor.ribbonColor} rotate-12 opacity-80 rounded-b`} />
                      <div className={`w-3.5 h-10 ${decor.ribbonColor} -rotate-12 opacity-80 rounded-b`} />
                    </div>
                    {/* Ornate seal base */}
                    <div className={`w-14 h-14 rounded-full ${decor.sealBg} flex items-center justify-center text-white border-2 border-white shadow-md relative z-10 animate-pulse`}>
                      <div className="absolute inset-1 border border-white/40 border-dashed rounded-full" />
                      <span className="text-[8px] font-black tracking-tighter text-center leading-none px-1">
                        {decor.sealText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure Cryptographic Authentication Column */}
                <div className="text-center space-y-1.5">
                  <div className="border-b border-slate-300 mx-auto w-4/5 pb-1">
                    <p className="text-[10px] font-mono font-bold text-indigo-600 flex items-center justify-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {certificate.certificateCode}
                    </p>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                    VERIFICATION CODE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Status Bar */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Verifiable Academic Record locked & synchronized securely in Cloud Firestore.
          </span>
          <span className="font-mono text-[10px]">
            ID: {certificate.id}
          </span>
        </div>
      </div>
    </div>
  );
}

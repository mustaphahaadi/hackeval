import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Certificate } from "../types";

export interface AwardTheme {
  primaryHex: string;
  secondaryHex: string;
  accentLightHex: string;
  sealTopHex: string;
  sealBottomHex: string;
  sealLabel: string;
  subtitle: string;
  borderClass: string;
  sealGradientClass: string;
  ribbonClass: string;
}

export function getAwardTheme(role: string): AwardTheme {
  const r = (role || "").toLowerCase();
  if (r.includes("first") || r.includes("grand prize") || r.includes("winner") || r.includes("champion")) {
    return {
      primaryHex: "#b45309",
      secondaryHex: "#f59e0b",
      accentLightHex: "#fffbeb",
      sealTopHex: "#fbbf24",
      sealBottomHex: "#b45309",
      sealLabel: "1ST HONOR",
      subtitle: "Grand Distinction Award",
      borderClass: "border-amber-400",
      sealGradientClass: "from-amber-400 via-yellow-500 to-amber-600",
      ribbonClass: "bg-amber-600",
    };
  }
  if (r.includes("second") || r.includes("runner-up")) {
    return {
      primaryHex: "#475569",
      secondaryHex: "#94a3b8",
      accentLightHex: "#f8fafc",
      sealTopHex: "#cbd5e1",
      sealBottomHex: "#475569",
      sealLabel: "2ND HONOR",
      subtitle: "Silver Distinction",
      borderClass: "border-slate-400",
      sealGradientClass: "from-slate-300 via-slate-400 to-zinc-600",
      ribbonClass: "bg-slate-600",
    };
  }
  if (r.includes("third") || r.includes("bronze")) {
    return {
      primaryHex: "#92400e",
      secondaryHex: "#d97706",
      accentLightHex: "#fef3c7",
      sealTopHex: "#d97706",
      sealBottomHex: "#78350f",
      sealLabel: "3RD HONOR",
      subtitle: "Bronze Distinction",
      borderClass: "border-amber-700/70",
      sealGradientClass: "from-amber-600 via-amber-700 to-amber-900",
      ribbonClass: "bg-amber-800",
    };
  }
  if (r.includes("ai") || r.includes("technical") || r.includes("innovative") || r.includes("integration")) {
    return {
      primaryHex: "#4338ca",
      secondaryHex: "#6366f1",
      accentLightHex: "#eef2ff",
      sealTopHex: "#818cf8",
      sealBottomHex: "#3730a3",
      sealLabel: "EXCELLENCE",
      subtitle: "Technical Merit Distinction",
      borderClass: "border-indigo-400",
      sealGradientClass: "from-indigo-500 via-violet-500 to-indigo-700",
      ribbonClass: "bg-indigo-600",
    };
  }
  if (r.includes("finalist") || r.includes("honorable") || r.includes("outstanding")) {
    return {
      primaryHex: "#0369a1",
      secondaryHex: "#0ea5e9",
      accentLightHex: "#f0f9ff",
      sealTopHex: "#38bdf8",
      sealBottomHex: "#0369a1",
      sealLabel: "FINALIST",
      subtitle: "Merit Recognition",
      borderClass: "border-sky-400",
      sealGradientClass: "from-sky-400 via-cyan-500 to-indigo-600",
      ribbonClass: "bg-sky-600",
    };
  }
  return {
    primaryHex: "#334155",
    secondaryHex: "#64748b",
    accentLightHex: "#f8fafc",
    sealTopHex: "#64748b",
    sealBottomHex: "#334155",
    sealLabel: "CERTIFIED",
    subtitle: "Official Achievement",
    borderClass: "border-slate-300",
    sealGradientClass: "from-slate-500 via-slate-600 to-slate-700",
    ribbonClass: "bg-slate-600",
  };
}

export function getCertificateVerificationUrl(code: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/?tab=ledger&code=${encodeURIComponent(code)}`;
  }
  return `/?tab=ledger&code=${encodeURIComponent(code)}`;
}

export async function generateCertificateQrDataUrl(code: string): Promise<string> {
  const verifyUrl = getCertificateVerificationUrl(code);
  return QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + (line ? " " : "") + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, centerX, y);
  }
  return y;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderCertificateA4Canvas(cert: Certificate): Promise<HTMLCanvasElement> {
  // Ensure web fonts are ready if running in browser
  if (typeof document !== "undefined" && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch {
      // Ignore font loading errors
    }
  }

  // Exact A4 Landscape aspect ratio (297mm x 210mm) at ~254 DPI -> 2970 x 2100 px
  const W = 2970;
  const H = 2100;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to initialize 2D rendering context for certificate export.");

  const theme = getAwardTheme(cert.role);
  const formattedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 1. Clean ivory/white archival paper background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial watermark wash
  const radial = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 1400);
  radial.addColorStop(0, "rgba(99, 102, 241, 0.035)");
  radial.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);

  // 2. Crisp double archival frames + corner ornaments
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 6;
  ctx.strokeRect(72, 72, W - 144, H - 144);

  ctx.strokeStyle = theme.secondaryHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(102, 102, W - 204, H - 204);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(122, 122, W - 244, H - 244);

  // Corner L-brackets
  const cornerLen = 110;
  const cornerOffset = 72;
  ctx.strokeStyle = theme.primaryHex;
  ctx.lineWidth = 10;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(cornerOffset, cornerOffset + cornerLen);
  ctx.lineTo(cornerOffset, cornerOffset);
  ctx.lineTo(cornerOffset + cornerLen, cornerOffset);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(W - cornerOffset - cornerLen, cornerOffset);
  ctx.lineTo(W - cornerOffset, cornerOffset);
  ctx.lineTo(W - cornerOffset, cornerOffset + cornerLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cornerOffset, H - cornerOffset - cornerLen);
  ctx.lineTo(cornerOffset, H - cornerOffset);
  ctx.lineTo(cornerOffset + cornerLen, H - cornerOffset);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(W - cornerOffset - cornerLen, H - cornerOffset);
  ctx.lineTo(W - cornerOffset, H - cornerOffset);
  ctx.lineTo(W - cornerOffset, H - cornerOffset - cornerLen);
  ctx.stroke();

  // 3. Top Header Crest & Institution Title
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Emblem circle at top
  ctx.fillStyle = theme.accentLightHex;
  ctx.strokeStyle = theme.secondaryHex;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W / 2, 235, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Simple crisp star/crest inside top emblem
  ctx.fillStyle = theme.primaryHex;
  ctx.font = "700 44px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("★", W / 2, 238);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 28px 'JetBrains Mono', monospace";
  ctx.fillText("HACKEVAL ACADEMIC EVALUATION COMMITTEE", W / 2, 330);

  ctx.fillStyle = "#0f172a";
  ctx.font = "800 44px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText("CERTIFICATE OF ACHIEVEMENT", W / 2, 396);

  if (cert.hackathonName) {
    ctx.fillStyle = theme.primaryHex;
    ctx.font = "600 30px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(cert.hackathonName.toUpperCase(), W / 2, 456);
  }

  // Divider line under title
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 360, 505);
  ctx.lineTo(W / 2 + 360, 505);
  ctx.stroke();

  // 4. Presentation Statement & Recipient Name
  ctx.fillStyle = "#475569";
  ctx.font = "600 28px 'JetBrains Mono', monospace";
  ctx.fillText("THIS CREDENTIAL IS PROUDLY PRESENTED TO", W / 2, 585);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 112px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(cert.recipientName, W / 2, 710);

  // Subtle underline under recipient name
  const nameMetrics = ctx.measureText(cert.recipientName);
  const nameLineHalf = Math.min(820, Math.max(360, nameMetrics.width / 2 + 70));
  ctx.strokeStyle = theme.secondaryHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameLineHalf, 785);
  ctx.lineTo(W / 2 + nameLineHalf, 785);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "500 26px 'JetBrains Mono', monospace";
  ctx.fillText(cert.recipientEmail, W / 2, 832);

  // 5. Citation Body Text
  ctx.fillStyle = "#334155";
  ctx.font = "500 34px 'Plus Jakarta Sans', system-ui, sans-serif";
  wrapCenteredText(
    ctx,
    "for demonstrating outstanding software architecture, engineering rigor, and prototype execution, earning official recognition as",
    W / 2,
    920,
    1850,
    48
  );

  // 6. Award Designation Banner Box
  const cleanRole = cert.role.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*/u, "").trim() || cert.role;
  ctx.font = "800 40px 'Plus Jakarta Sans', system-ui, sans-serif";
  const roleWidth = Math.min(1600, Math.max(660, ctx.measureText(cleanRole.toUpperCase()).width + 180));
  const boxX = W / 2 - roleWidth / 2;
  const boxY = 1045;
  const boxH = 104;

  drawRoundedRect(ctx, boxX, boxY, roleWidth, boxH, 16);
  ctx.fillStyle = theme.accentLightHex;
  ctx.fill();
  ctx.strokeStyle = theme.secondaryHex;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = theme.primaryHex;
  ctx.fillText(cleanRole.toUpperCase(), W / 2, boxY + boxH / 2 + 2);

  // 7. Project & Team Metadata Box
  const metaW = 1760;
  const metaH = 158;
  const metaX = W / 2 - metaW / 2;
  const metaY = 1210;

  drawRoundedRect(ctx, metaX, metaY, metaW, metaH, 20);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Vertical divider inside meta box
  ctx.beginPath();
  ctx.moveTo(W / 2, metaY + 28);
  ctx.lineTo(W / 2, metaY + metaH - 28);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("PROJECT SUBMISSION", metaX + 56, metaY + 52);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  const projDisplay = cert.projectName.length > 38 ? cert.projectName.slice(0, 35) + "..." : cert.projectName;
  ctx.fillText(projDisplay, metaX + 56, metaY + 104);

  ctx.fillStyle = "#64748b";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("DEVELOPMENT TEAM", W / 2 + 56, metaY + 52);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  const teamDisplay = cert.teamName.length > 34 ? cert.teamName.slice(0, 31) + "..." : cert.teamName;
  ctx.fillText(teamDisplay, W / 2 + 56, metaY + 104);

  // 8. Footer: Issuance Date, Central Seal, Committee Signature, and Scannable QR Verification
  const footerCenterY = 1660;

  // Left: Date of Issuance
  ctx.textAlign = "center";
  const leftColX = 540;
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 32px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(formattedDate, leftColX, footerCenterY - 22);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftColX - 210, footerCenterY + 20);
  ctx.lineTo(leftColX + 210, footerCenterY + 20);
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("DATE OF ISSUANCE", leftColX, footerCenterY + 58);

  // Center-Left: Official Foil Seal + Ribbons
  const sealX = 1190;
  const sealY = footerCenterY - 12;

  // Ribbon tails
  ctx.save();
  ctx.fillStyle = theme.primaryHex;
  ctx.translate(sealX - 36, sealY + 56);
  ctx.rotate(0.22);
  ctx.fillRect(-20, 0, 40, 120);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = theme.primaryHex;
  ctx.translate(sealX + 36, sealY + 56);
  ctx.rotate(-0.22);
  ctx.fillRect(-20, 0, 40, 120);
  ctx.restore();

  // Outer scalloped / gradient seal circle
  const sealGrad = ctx.createLinearGradient(sealX - 95, sealY - 95, sealX + 95, sealY + 95);
  sealGrad.addColorStop(0, theme.sealTopHex);
  sealGrad.addColorStop(1, theme.sealBottomHex);
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 23px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillText(theme.sealLabel, sealX, sealY);

  // Center-Right: Committee Authority Signature
  const sigX = 1790;
  ctx.fillStyle = "#1e293b";
  ctx.font = "italic 600 54px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("HackEval Committee", sigX, footerCenterY - 26);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sigX - 210, footerCenterY + 20);
  ctx.lineTo(sigX + 210, footerCenterY + 20);
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("EVALUATION BOARD", sigX, footerCenterY + 58);

  // Far Right: Verification QR Code & Code Stamp
  const qrSize = 210;
  const qrX = W - 470;
  const qrY = footerCenterY - 125;

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, getCertificateVerificationUrl(cert.certificateCode), {
    width: qrSize,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  drawRoundedRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  ctx.textAlign = "center";
  ctx.fillStyle = "#4338ca";
  ctx.font = "700 26px 'JetBrains Mono', monospace";
  ctx.fillText(cert.certificateCode, qrX + qrSize / 2, qrY + qrSize + 48);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 18px 'JetBrains Mono', monospace";
  ctx.fillText("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 82);

  // 9. Bottom Ledger Line
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 20px 'JetBrains Mono', monospace";
  ctx.fillText(`CREDENTIAL ID: ${cert.id}  |  VERIFY AT HACKEVAL CREDENTIALS LEDGER`, W / 2, H - 155);

  return canvas;
}

export async function downloadCertificatePdf(cert: Certificate): Promise<void> {
  const canvas = await renderCertificateA4Canvas(cert);
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  // Exact A4 landscape dimensions: 297mm x 210mm
  pdf.addImage(imgData, "PNG", 0, 0, 297, 210, undefined, "FAST");
  const safeName = cert.recipientName.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  pdf.save(`HackEval_Certificate_${safeName || "Award"}_${cert.certificateCode}.pdf`);
}

export async function downloadCertificatePng(cert: Certificate): Promise<void> {
  const canvas = await renderCertificateA4Canvas(cert);
  const imgData = canvas.toDataURL("image/png", 1.0);
  const link = document.createElement("a");
  const safeName = cert.recipientName.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  link.href = imgData;
  link.download = `HackEval_Certificate_A4_${safeName || "Award"}_${cert.certificateCode}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import React, { useState, useEffect } from "react";
import { FolderGit, Plus, Award, ShieldCheck, Sparkles, AlertCircle, FileText, Download } from "lucide-react";
import { ProjectSubmission, Certificate } from "../types";
import { ProjectSubmissionForm } from "./ProjectSubmissionForm";

interface ParticipantPortalProps {
  token: string;
  currentUser: {
    name: string;
    email: string;
  };
  onSelectProject: (projectId: string) => void;
}

export function ParticipantPortal({ token, currentUser, onSelectProject }: ParticipantPortalProps) {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch submissions
      const subRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!subRes.ok) throw new Error("Failed to load submissions.");
      const subData = await subRes.json();
      
      // Filter submissions where the teamMembers contain current user name
      const filtered = subData.filter((p: ProjectSubmission) => 
        p.teamMembers.toLowerCase().indexOf(currentUser.name.toLowerCase()) !== -1 ||
        p.teamName.toLowerCase().indexOf(currentUser.name.toLowerCase()) !== -1
      );
      setSubmissions(filtered);

      // Fetch certificates
      const certRes = await fetch("/api/certificates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificates(certData);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {showSubmitForm ? (
        <ProjectSubmissionForm
          token={token}
          onSuccess={() => {
            setShowSubmitForm(false);
            fetchData();
          }}
          onCancel={() => setShowSubmitForm(false)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
                <FolderGit className="w-7 h-7 text-indigo-600" />
                Participant Portal
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back, <span className="font-bold text-slate-800">{currentUser.name}</span>. Manage your project submissions and view certificates.
              </p>
            </div>
            
            <button
              onClick={() => setShowSubmitForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg text-white shadow-sm transition-all cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-4 h-4" /> Submit Hackathon Project
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium flex gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: My Submissions */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  My Team Submissions
                </h3>

                {submissions.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                    <FolderGit className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-3" />
                    <p className="font-semibold text-slate-700 text-sm">No submissions found</p>
                    <p className="text-xs mt-1">You haven't submitted a project under your name yet. Hit the submit button above to register!</p>
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div 
                      key={sub.id}
                      onClick={() => onSelectProject(sub.id)}
                      className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm p-6 rounded-2xl transition-all cursor-pointer group space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-sans font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                            {sub.projectName}
                          </h4>
                          <span className="text-xs font-semibold text-slate-400">
                            Team: {sub.teamName}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sub.status === "evaluated"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {sub.status === "evaluated" ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Scored
                            </>
                          ) : (
                            "AI Pending"
                          )}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                        {sub.description}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-3">
                        <span>Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                        <span className="text-indigo-600 font-bold group-hover:underline">Click to view Scorecard & Discussions →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Certificates */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  My Certifications & Awards
                </h3>

                {certificates.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                    <Award className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                    <p className="font-semibold text-slate-700 text-xs">No certificates issued yet</p>
                    <p className="text-[10px] mt-1">Certificates are issued by the Hackathon Admin after evaluations are finalized.</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <div 
                      key={cert.id}
                      className="bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-200 p-5 rounded-2xl relative overflow-hidden text-center space-y-4 shadow-sm"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-amber-100/40 rounded-bl-full flex items-center justify-center font-bold text-amber-800">
                        ⭐
                      </div>
                      <div className="flex justify-center">
                        <Award className="w-12 h-12 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-sans font-black text-slate-900 text-base leading-tight">
                          CERTIFICATE OF AWARD
                        </h4>
                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                          {cert.role}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400">Successfully Presented to</p>
                        <p className="text-sm font-bold text-slate-800">{cert.recipientName}</p>
                        <p className="text-[10px] text-slate-400 mt-1">For Hackathon Entry</p>
                        <p className="text-xs font-semibold text-slate-700 line-clamp-1">{cert.projectName}</p>
                      </div>

                      <div className="border-t border-dashed border-amber-200 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>Code: {cert.certificateCode}</span>
                        <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

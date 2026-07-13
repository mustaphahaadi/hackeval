import React, { useState, useEffect } from "react";
import { Shield, Users, Award, Calendar, RefreshCw, AlertCircle, Plus, Check, Trash, Power } from "lucide-react";
import { User, HackathonEvent, ProjectSubmission } from "../types";

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([]);
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  
  const [subTab, setSubTab] = useState<"roles" | "certs" | "events">("roles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Certificate form states
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [certName, setCertName] = useState("");
  const [certEmail, setCertEmail] = useState("");
  const [certRole, setCertRole] = useState("Grand Prize Winner");

  // Hackathon form states
  const [hkName, setHkName] = useState("");
  const [hkDesc, setHkDesc] = useState("");
  const [hkStart, setHkStart] = useState("");
  const [hkEnd, setHkEnd] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Fetch Users
      const uRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!uRes.ok) throw new Error("Failed to load user directories.");
      const uData = await uRes.json();
      setUsers(uData);

      // Fetch Hackathons
      const hRes = await fetch("/api/hackathons", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHackathons(hData);
      }

      // Fetch Projects
      const pRes = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData);
        if (pData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(pData[0].id);
        }
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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) throw new Error("Failed to change user access role.");
      setSuccess("User role updated successfully.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProjectId || !certName || !certEmail || !certRole) {
      setError("Please fill in all certificate configuration details.");
      return;
    }

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          recipientEmail: certEmail,
          recipientName: certName,
          role: certRole
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to issue certificate.");
      }

      setSuccess(`Certificate issued successfully to ${certName}! Code generated automatically.`);
      setCertName("");
      setCertEmail("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hkName,
          description: hkDesc,
          startDate: hkStart,
          endDate: hkEnd,
          active: false
        })
      });

      if (!res.ok) throw new Error("Failed to create hackathon event.");
      setSuccess(`Hackathon Event "${hkName}" added successfully.`);
      setHkName("");
      setHkDesc("");
      setHkStart("");
      setHkEnd("");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleHackathonActive = async (hkId: string, currentActive: boolean) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/hackathons/${hkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (!res.ok) throw new Error("Failed to modify event active status.");
      setSuccess("Hackathon active status toggled. All other active events deactivated.");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Admin Console
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Global configurations: user role elevation, custom cert creation, and hackathon events active toggle states.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Reload Panel
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-rose-700 text-sm rounded-r-lg font-medium flex gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-emerald-700 text-sm rounded-r-lg font-medium flex gap-2">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          {success}
        </div>
      )}

      {/* Sub tabs */}
      <div className="border-b border-slate-200 flex space-x-6 text-sm">
        <button
          onClick={() => setSubTab("roles")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "roles" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          User Permissions ({users.length})
        </button>
        <button
          onClick={() => setSubTab("certs")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "certs" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 inline mr-1" />
          Issue Awards / Certs
        </button>
        <button
          onClick={() => setSubTab("events")}
          className={`pb-3 font-semibold transition-all border-b-2 cursor-pointer ${
            subTab === "events" ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          Hackathon Events ({hackathons.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {subTab === "roles" && (
            <div className="space-y-6">
              <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">User Accounts Directory</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role Access</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === "Admin" ? "bg-rose-50 text-rose-700 border border-rose-200" : u.role === "Judge" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs space-x-2">
                          {u.role !== "Participant" && (
                            <button
                              onClick={() => handleUpdateRole(u.id, "Participant")}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 rounded border border-slate-200 font-semibold cursor-pointer"
                            >
                              Demote to Participant
                            </button>
                          )}
                          {u.role !== "Judge" && (
                            <button
                              onClick={() => handleUpdateRole(u.id, "Judge")}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100/80 text-amber-800 rounded border border-amber-200 font-semibold cursor-pointer"
                            >
                              Promote to Judge
                            </button>
                          )}
                          {u.role !== "Admin" && (
                            <button
                              onClick={() => handleUpdateRole(u.id, "Admin")}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100/80 text-rose-800 rounded border border-rose-200 font-semibold cursor-pointer"
                            >
                              Make Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === "certs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleIssueCertificate} className="space-y-5">
                <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Issue Certified Award</h3>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Project Submission</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} (Team: {p.teamName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recipient Student Name</label>
                  <input
                    type="text"
                    required
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g. Alice Johnson"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={certEmail}
                    onChange={(e) => setCertEmail(e.target.value)}
                    placeholder="alice@university.edu"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Award Designation / Role</label>
                  <select
                    value={certRole}
                    onChange={(e) => setCertRole(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Grand Prize Winner">🥇 Grand Prize Winner</option>
                    <option value="First Runner-up">🥈 First Runner-up</option>
                    <option value="Best Technical Hack">💻 Best Technical Hack</option>
                    <option value="Most Innovative AI Project">🤖 Most Innovative AI Project</option>
                    <option value="Honorable Mention">⭐ Honorable Mention</option>
                    <option value="Valued Hackathon Participant">🎖️ Valued Hackathon Participant</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg text-white shadow transition-all cursor-pointer flex justify-center items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Issue Certified Badge
                </button>
              </form>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-600 text-xs space-y-4">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider">Badge Guidelines</h4>
                <p>
                  Certificates and credentials generated on HackEval carry an automatically computed verification code (e.g. CERT-249582) which can be dynamically validated on the participant's portal dashboard.
                </p>
                <p>
                  Issuing an award immediately updates the recipient's personal certificates list. An email trigger can be integrated using external notification gateways.
                </p>
              </div>
            </div>
          )}

          {subTab === "events" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Creator Form */}
              <form onSubmit={handleCreateHackathon} className="space-y-4">
                <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Create Hackathon Event</h3>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    value={hkName}
                    onChange={(e) => setHkName(e.target.value)}
                    placeholder="e.g. PennApps Fall 2026"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={hkDesc}
                    onChange={(e) => setHkDesc(e.target.value)}
                    placeholder="Provide overview details..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={hkStart}
                      onChange={(e) => setHkStart(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={hkEnd}
                      onChange={(e) => setHkEnd(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold rounded-lg text-white cursor-pointer"
                >
                  Create Event
                </button>
              </form>

              {/* Event Listings */}
              <div className="space-y-4">
                <h3 className="font-sans font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">Active Events Manager</h3>
                
                <div className="space-y-3.5">
                  {hackathons.map((hk) => (
                    <div 
                      key={hk.id}
                      className={`border p-4 rounded-xl flex items-center justify-between ${
                        hk.active ? "border-indigo-400 bg-indigo-50/10" : "border-slate-200"
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{hk.name}</h4>
                          {hk.active && (
                            <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Active</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{hk.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Dates: {hk.startDate} to {hk.endDate}</p>
                      </div>

                      <button
                        onClick={() => handleToggleHackathonActive(hk.id, hk.active)}
                        className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          hk.active 
                            ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" 
                            : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {hk.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

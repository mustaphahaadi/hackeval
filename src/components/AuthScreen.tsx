import React, { useState } from "react";
import { LogIn, UserPlus, ShieldAlert, Award, Star, Laptop, Cpu } from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string; role: "Admin" | "Participant" }) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Participant" | "Admin">("Participant");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister 
      ? { email, password, name, role }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check your inputs.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick seed login for easy dev testing
  const handleQuickLogin = async (presetRole: "Admin" | "Judge" | "Participant") => {
    setError("");
    setLoading(true);
    let presetEmail = "admin@hackathon.edu";
    let presetPassword = "admin123";

    if (presetRole === "Judge") {
      presetEmail = "judge@hackathon.edu";
      presetPassword = "judge123";
    } else if (presetRole === "Participant") {
      presetEmail = "alice@hackathon.edu";
      presetPassword = "part123";
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: presetEmail, password: presetPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Preset login failed.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 text-indigo-600 mb-2">
          <Award className="w-10 h-10 stroke-[2]" />
          <span className="font-sans font-bold text-2xl tracking-tight text-slate-900">
            HackEval
          </span>
        </div>
        <h2 className="text-center text-3xl font-sans font-bold tracking-tight text-slate-900">
          {isRegister ? "Create a platform account" : "Sign in to HackEval"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          The Production-Ready Hackathon Evaluation & Judging Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Johnson"
                  className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Participant", "Admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        role === r
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" /> Sign Up
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isRegister ? "Already have an account? Sign in" : "New to the platform? Create account"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Testing Portal Panel */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
            <Cpu className="w-4 h-4" /> Rapid Dev Testing Presets
          </h4>
          <p className="text-xs text-amber-700 mb-3 leading-relaxed">
            Quick-fill preconfigured mock database roles to immediately test the participant portals, admin dashboards, and automated AI evaluation workflows.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("Participant")}
              className="px-2 py-1.5 text-xs font-medium bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg shadow-sm transition-colors text-center"
            >
              👩‍💻 Alice (Participant)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("Admin")}
              className="px-2 py-1.5 text-xs font-medium bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg shadow-sm transition-colors text-center"
            >
              👑 Angela (Admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

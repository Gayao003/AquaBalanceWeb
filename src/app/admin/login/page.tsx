"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signInAdmin } from "@/lib/firestore";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function normalizeEmail(input: string): string {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === "admin") return "admin@aquabalance.com";
    if (!trimmed.includes("@")) return `${trimmed}@aquabalance.com`;
    return trimmed;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailToUse = normalizeEmail(usernameOrEmail);

    try {
      await signInAdmin(emailToUse, password);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      console.error("Admin login error:", err);
      let message = "Login failed. Please verify credentials.";
      if (err instanceof Error) {
        if (err.message.includes("user-not-found") || err.message.includes("invalid-credential")) {
          message = "Invalid username or password.";
        } else if (err.message.includes("Access denied")) {
          message = err.message;
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-950 to-blue-950" />
      <div className="water-blob w-[500px] h-[500px] bg-sky-500/20 top-[-150px] left-[-100px]" />
      <div className="water-blob w-[350px] h-[350px] bg-blue-500/15 bottom-[-80px] right-[-60px]" />

      {/* Ripple rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ripple-circle absolute rounded-full border border-sky-500/20"
            style={{ width: 200 + i * 100, height: 200 + i * 100 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 flex flex-col gap-6 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-900/50">
              <Droplets className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white font-extrabold text-2xl mt-1">Admin Portal</h1>
            <p className="text-slate-400 text-sm">AquaBalance Clinical Administration</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Enter username or email"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-300 text-xs leading-snug">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-sky-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </motion.button>
          </form>

          {/* Footer note */}
          <p className="text-center text-slate-500 text-xs">
            Restricted access. Authorized healthcare personnel & administrators only.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

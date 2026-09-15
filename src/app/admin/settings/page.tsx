"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Settings, LogOut, Droplets, Save, AlertCircle, CheckCircle2,
  Loader2, Bell, ShieldAlert, RefreshCw
} from "lucide-react";
import { getSystemSettings, updateSystemSettings, signOut, SystemSettings } from "@/lib/firestore";
import { auth } from "@/lib/firebase";

type Toast = { type: "success" | "error"; msg: string };

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    defaultFluidLimitMl: 2000,
    warningThresholdPercent: 80,
    maintenanceMode: false,
    systemAnnouncement: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch {
      showToast({ type: "error", msg: "Failed to load system settings." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      showToast({ type: "success", msg: "System settings saved successfully." });
    } catch (err) {
      console.error(err);
      showToast({ type: "error", msg: "Failed to update settings." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/admin/login");
  }

  const currentUser = auth.currentUser;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
              toast.type === "success"
                ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-200"
                : "bg-red-900/90 border-red-500/40 text-red-200"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-slate-900 border-r border-white/5 flex flex-col p-5 gap-6 z-30">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span>AquaBalance</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition cursor-pointer"
          >
            <Users size={16} />
            Users & Roster
          </button>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-500/10 text-sky-300 text-sm font-medium">
            <Settings size={16} />
            System Settings
          </div>
        </nav>

        <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
          <div className="px-2">
            <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin Portal
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition px-2 cursor-pointer"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 p-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">System Settings & Controls</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage system announcements, client broadcast notifications, and maintenance mode status.
            </p>
          </div>
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-900 border border-white/10 rounded-xl px-4 py-2 transition cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-500">
            <Loader2 className="mx-auto animate-spin mb-3" size={24} />
            Loading system configurations…
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Global Broadcast Announcement */}
            <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">System Broadcast Announcement</h2>
                  <p className="text-xs text-slate-400">Broadcast banner message displayed across client mobile apps.</p>
                </div>
              </div>

              <textarea
                rows={3}
                value={settings.systemAnnouncement}
                onChange={(e) => setSettings({ ...settings, systemAnnouncement: e.target.value })}
                placeholder="e.g. Scheduled dialysis unit maintenance this Saturday from 1:00 AM to 4:00 AM."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Leave empty to remove announcement banner.</p>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Maintenance Mode</h2>
                    <p className="text-xs text-slate-400">
                      When enabled, non-admin mobile clients receive a maintenance notice.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-sky-900/30 transition cursor-pointer"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving Changes…" : "Save System Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

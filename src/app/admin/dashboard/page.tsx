"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, LogOut, Droplets, Search, X, ChevronDown, Save, AlertCircle, CheckCircle2,
  Loader2, UserCheck, Stethoscope, Download, ChevronLeft, ChevronRight,
  Archive, RotateCcw, Mail, Settings, Activity, UserPlus, Lock, Unlock
} from "lucide-react";
import {
  getAllUsers, updateUserRole, toggleArchiveUser, sendUserPasswordReset,
  assignNursesToPatient,
  getHealthProfilesForUser, getUserIntakeEntries,
  getUserOutputEntries, signOut, UserProfile, HealthProfile,
  IntakeRecord, OutputRecord,
} from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const ROLE_COLORS: Record<string, string> = {
  patient: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  nurse: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const ROLES = ["patient", "nurse", "admin"] as const;

type Toast = { type: "success" | "error"; msg: string };

export default function DashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // Active workspace view: "users" (user roster) or "assignments" (nurse-patient matching)
  const [activeView, setActiveView] = useState<"users" | "assignments">("users");

  // Roster Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Assignment View Filters & Search
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [assignmentPage, setAssignmentPage] = useState(1);

  // Edit User Role Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<"patient" | "nurse" | "admin">("patient");
  const [saving, setSaving] = useState(false);

  // Assign Nurses Modal
  const [assigningPatient, setAssigningPatient] = useState<UserProfile | null>(null);
  const [selectedNurseIds, setSelectedNurseIds] = useState<string[]>([]);
  const [nurseSearchInModal, setNurseSearchInModal] = useState("");
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Inspect User Modal (Logs & Health Info)
  const [inspectingUser, setInspectingUser] = useState<UserProfile | null>(null);
  const [inspectHealthProfile, setInspectHealthProfile] = useState<HealthProfile | null>(null);
  const [intakeLogs, setIntakeLogs] = useState<IntakeRecord[]>([]);
  const [outputLogs, setOutputLogs] = useState<OutputRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<"intake" | "output">("intake");

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      showToast({ type: "error", msg: "Failed to load users." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    setAssignmentPage(1);
  }, [assignmentSearch, assignmentFilter]);

  // All active nurses for assignments
  const activeNurses = users.filter((u) => u.role === "nurse" && !u.isArchived);

  // Nurse ID to Nurse User lookup
  const nurseMap = new Map<string, UserProfile>();
  activeNurses.forEach((n) => nurseMap.set(n.userId, n));

  // Filtered Roster
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "archived"
        ? u.isArchived === true
        : !u.isArchived;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Filtered Patients for Nurse Assignment View
  const allPatients = users.filter((u) => u.role === "patient");
  const filteredPatients = allPatients.filter((p) => {
    const assignedNurses = (p.assignedNurseIds || []).map((id) => nurseMap.get(id)?.name || "").join(" ");
    const matchesSearch =
      p.name.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      assignedNurses.toLowerCase().includes(assignmentSearch.toLowerCase());

    const hasNurses = (p.assignedNurseIds && p.assignedNurseIds.length > 0);
    const matchesFilter =
      assignmentFilter === "all"
        ? true
        : assignmentFilter === "assigned"
        ? hasNurses
        : !hasNurses;

    return matchesSearch && matchesFilter;
  });

  const totalAssignmentPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice(
    (assignmentPage - 1) * pageSize,
    assignmentPage * pageSize
  );

  const totalPatients = users.filter((u) => u.role === "patient" && !u.isArchived).length;
  const totalNurses = users.filter((u) => u.role === "nurse" && !u.isArchived).length;
  const totalAssignedPatients = users.filter((u) => u.role === "patient" && (u.assignedNurseIds?.length || 0) > 0).length;
  const totalUnassignedPatients = totalPatients - totalAssignedPatients;
  const totalArchived = users.filter((u) => u.isArchived).length;

  function openEdit(user: UserProfile) {
    setEditingUser(user);
    setNewRole(user.role);
  }

  function openAssignModal(patient: UserProfile) {
    setAssigningPatient(patient);
    setSelectedNurseIds(patient.assignedNurseIds || []);
    setNurseSearchInModal("");
  }

  async function handleSaveAssignments() {
    if (!assigningPatient) return;
    setSavingAssignments(true);
    try {
      await assignNursesToPatient(assigningPatient.userId, selectedNurseIds, activeNurses);
      showToast({
        type: "success",
        msg: `Updated assigned care team for ${assigningPatient.name}.`,
      });
      setAssigningPatient(null);
      await loadUsers();
    } catch {
      showToast({ type: "error", msg: "Failed to save nurse assignments." });
    } finally {
      setSavingAssignments(false);
    }
  }

  function toggleNurseInModal(nurseId: string) {
    setSelectedNurseIds((prev) =>
      prev.includes(nurseId) ? prev.filter((id) => id !== nurseId) : [...prev, nurseId]
    );
  }

  async function openInspect(user: UserProfile) {
    setInspectingUser(user);
    setLoadingLogs(true);
    setActiveLogTab("intake");
    try {
      const [hProfiles, intakes, outputs] = await Promise.all([
        getHealthProfilesForUser(user.userId),
        getUserIntakeEntries(user.userId),
        getUserOutputEntries(user.userId),
      ]);
      setInspectHealthProfile(hProfiles[0] || null);
      setIntakeLogs(intakes);
      setOutputLogs(outputs);
    } catch {
      showToast({ type: "error", msg: "Failed to retrieve user activity records." });
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleToggleArchive(user: UserProfile) {
    const willArchive = !user.isArchived;
    try {
      await toggleArchiveUser(user.userId, willArchive);
      showToast({
        type: "success",
        msg: `${user.name} has been ${willArchive ? "archived" : "restored"}.`,
      });
      if (editingUser?.userId === user.userId) {
        setEditingUser((prev) => (prev ? { ...prev, isArchived: willArchive } : null));
      }
      await loadUsers();
    } catch {
      showToast({ type: "error", msg: "Failed to update archive status." });
    }
  }

  async function handleSendResetPassword(user: UserProfile) {
    try {
      await sendUserPasswordReset(user.email);
      showToast({
        type: "success",
        msg: `Password recovery email dispatched to ${user.email}.`,
      });
    } catch {
      showToast({
        type: "error",
        msg: "Failed to dispatch password recovery email.",
      });
    }
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUserRole(editingUser.userId, newRole);
      showToast({ type: "success", msg: `Updated ${editingUser.name}'s role to ${newRole}.` });
      setEditingUser(null);
      await loadUsers();
    } catch {
      showToast({ type: "error", msg: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    if (filtered.length === 0) {
      showToast({ type: "error", msg: "No users to export." });
      return;
    }
    const headers = ["User ID", "Name", "Email", "Role", "Status", "Volume Unit", "Joined Date"];
    const rows = filtered.map((u) => [
      `"${u.userId}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.isArchived ? "Archived" : "Active"}"`,
      `"${u.volumeUnit || "ml"}"`,
      `"${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aquabalance_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={() => setActiveView("users")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeView === "users" ? "bg-sky-500/10 text-sky-300 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users size={16} />
            Users & Roles
          </button>
          <button
            onClick={() => setActiveView("assignments")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
              activeView === "assignments" ? "bg-sky-500/10 text-sky-300 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UserCheck size={16} />
            Nurse Assignments
          </button>
          <button
            onClick={() => router.push("/admin/settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition cursor-pointer"
          >
            <Settings size={16} />
            System Settings
          </button>
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
      <main className="ml-60 p-8">
        {/* Top Header with Switcher Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">
              {activeView === "users" ? "Clinical Roster & Role Access" : "Nurse-Patient Assignments"}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {activeView === "users"
                ? "Manage accounts, assign roles, inspect activity logs, or archive users."
                : "Match dedicated nurses to patients so nurses only monitor their assigned care roster."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveView("users")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeView === "users" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                User Roster
              </button>
              <button
                onClick={() => setActiveView("assignments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeView === "assignments" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Nurse Assignments
              </button>
            </div>
            {activeView === "users" && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-900 border border-white/10 hover:bg-white/5 rounded-xl px-4 py-2.5 transition cursor-pointer"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
            <button
              onClick={loadUsers}
              className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 transition cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ══════════════════ VIEW 1: USER ROSTER & ROLE ACCESS ══════════════════ */}
        {activeView === "users" && (
          <>
            {/* Analytics Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Users size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3">{users.length}</p>
                <p className="text-xs text-slate-500 mt-1">All database accounts</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Patients</span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <UserCheck size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-sky-300">{totalPatients}</p>
                <p className="text-xs text-slate-500 mt-1">Active fluid tracking</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Clinical Nurses</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Stethoscope size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-emerald-300">{totalNurses}</p>
                <p className="text-xs text-slate-500 mt-1">Bedside care staff</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Archived Users</span>
                  <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                    <Archive size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-red-300">{totalArchived}</p>
                <p className="text-xs text-slate-500 mt-1">Access suspended</p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Status filter */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
                  {(["all", "active", "archived"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        statusFilter === s ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Role filter */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
                  {["all", ...ROLES].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        roleFilter === r ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left font-semibold">User</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Role</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Joined</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-500">
                        <Loader2 className="mx-auto animate-spin mb-2" size={20} />
                        Loading user roster…
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-500">
                        No matching users found.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.userId}
                        className={`border-b border-white/5 hover:bg-white/2 transition ${
                          user.isArchived ? "opacity-60 bg-red-950/10" : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow">
                              {(user.name || user.email)?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.name || "—"}</p>
                              <p className="text-slate-500 text-xs">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              ROLE_COLORS[user.role] || "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.isArchived ? (
                            <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <button
                            onClick={() => openInspect(user)}
                            className="text-xs text-slate-300 hover:text-white font-medium border border-white/10 px-3 py-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                          >
                            Logs & Info
                          </button>
                          <button
                            onClick={() => openEdit(user)}
                            className="text-xs text-sky-400 hover:text-sky-300 font-semibold border border-sky-500/30 px-3 py-1 rounded-lg hover:bg-sky-500/10 transition cursor-pointer"
                          >
                            Manage Role
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/40 text-xs text-slate-400">
                <div>
                  Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                  {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-semibold text-white px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ VIEW 2: NURSE-PATIENT ASSIGNMENTS ══════════════════ */}
        {activeView === "assignments" && (
          <>
            {/* Assignment Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Patients</span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Users size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3">{totalPatients}</p>
                <p className="text-xs text-slate-500 mt-1">In clinical database</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Assigned to Care</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <UserCheck size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-emerald-300">{totalAssignedPatients}</p>
                <p className="text-xs text-slate-500 mt-1">Has 1 or more nurses</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Unassigned Patients</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <UserPlus size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-amber-300">{totalUnassignedPatients}</p>
                <p className="text-xs text-slate-500 mt-1">Pending care assignment</p>
              </div>

              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Available Nurses</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Stethoscope size={18} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold mt-3 text-purple-300">{totalNurses}</p>
                <p className="text-xs text-slate-500 mt-1">Active nursing roster</p>
              </div>
            </div>

            {/* Assignment Search & Filter Bar */}
            <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by patient or assigned nurse name…"
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {assignmentSearch && (
                  <button
                    onClick={() => setAssignmentSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
                {(["all", "assigned", "unassigned"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAssignmentFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      assignmentFilter === filter ? "bg-white/15 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {filter === "all" ? "All Patients" : filter === "assigned" ? "Assigned" : "Unassigned"}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignments Table */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left font-semibold">Patient</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Assigned Care Team (Nurses)</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Schedule Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-slate-500">
                        <Loader2 className="mx-auto animate-spin mb-2" size={20} />
                        Loading nurse assignments…
                      </td>
                    </tr>
                  ) : paginatedPatients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-slate-500">
                        No matching patients found.
                      </td>
                    </tr>
                  ) : (
                    paginatedPatients.map((patient) => {
                      const assignedIds = patient.assignedNurseIds || [];
                      const nurseNames = assignedIds
                        .map((id) => nurseMap.get(id)?.name || nurseMap.get(id)?.email || "Nurse")
                        .filter(Boolean);

                      return (
                        <tr
                          key={patient.userId}
                          className="border-b border-white/5 hover:bg-white/2 transition"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow">
                                {(patient.name || patient.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{patient.name || "—"}</p>
                                <p className="text-slate-500 text-xs">{patient.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {nurseNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {nurseNames.map((name, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  >
                                    <Stethoscope size={11} />
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                No nurses assigned
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {patient.isScheduleLocked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Lock size={11} /> Locked by Nurse
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                <Unlock size={11} /> Patient Editable
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => openAssignModal(patient)}
                              className="text-xs text-sky-400 hover:text-sky-300 font-semibold border border-sky-500/30 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <UserCheck size={13} />
                              Manage Nurses
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Assignment Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-900/40 text-xs text-slate-400">
                <div>
                  Showing {filteredPatients.length > 0 ? (assignmentPage - 1) * pageSize + 1 : 0} to{" "}
                  {Math.min(assignmentPage * pageSize, filteredPatients.length)} of {filteredPatients.length} patients
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAssignmentPage((p) => Math.max(p - 1, 1))}
                    disabled={assignmentPage === 1}
                    className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-semibold text-white px-2">
                    Page {assignmentPage} of {totalAssignmentPages}
                  </span>
                  <button
                    onClick={() => setAssignmentPage((p) => Math.min(p + 1, totalAssignmentPages))}
                    disabled={assignmentPage >= totalAssignmentPages}
                    className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ══════════════════ MODAL: ASSIGN NURSES TO PATIENT ══════════════════ */}
      <AnimatePresence>
        {assigningPatient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssigningPatient(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Assign Care Team</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select which nurses have access to monitor and log fluids for{" "}
                    <strong className="text-white">{assigningPatient.name}</strong> ({assigningPatient.email}).
                  </p>
                </div>
                <button
                  onClick={() => setAssigningPatient(null)}
                  className="text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nurse Search inside modal */}
              <div className="px-6 pt-4 pb-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search nurses by name or email…"
                    value={nurseSearchInModal}
                    onChange={(e) => setNurseSearchInModal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Nurses list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
                {activeNurses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No active nurses found in the clinical roster. Promote an account to "Nurse" first.
                  </div>
                ) : (
                  activeNurses
                    .filter((n) => {
                      if (!nurseSearchInModal) return true;
                      const q = nurseSearchInModal.toLowerCase();
                      return n.name.toLowerCase().includes(q) || n.email.toLowerCase().includes(q);
                    })
                    .map((nurse) => {
                      const isChecked = selectedNurseIds.includes(nurse.userId);
                      // Calculate current patient load for this nurse
                      const currentLoad = allPatients.filter((p) => p.assignedNurseIds?.includes(nurse.userId)).length;

                      return (
                        <div
                          key={nurse.userId}
                          onClick={() => toggleNurseInModal(nurse.userId)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isChecked
                              ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                              : "bg-white/2 border-white/5 text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div onClick
                              className="w-4 h-4 rounded text-sky-600 bg-white/10 border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <div>
                              <p className="text-sm font-semibold text-white">{nurse.name}</p>
                              <p className="text-xs text-slate-500">{nurse.email}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                              {currentLoad} patient{currentLoad === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
                <span className="text-xs text-slate-400">
                  <strong className="text-white">{selectedNurseIds.length}</strong> nurse{selectedNurseIds.length === 1 ? "" : "s"} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAssigningPatient(null)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAssignments}
                    disabled={savingAssignments}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg transition cursor-pointer"
                  >
                    {savingAssignments ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {savingAssignments ? "Saving…" : "Save Assignments"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════ MODAL: EDIT USER ROLE & CONTROLS ══════════════════ */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Manage User Account</h3>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-500 hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Role selector */}
                <div>
                  <label className="text-sm text-slate-300 font-medium mb-2 block">
                    Role Assignment
                  </label>
                  <div className="relative">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                      className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-slate-900">
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Account Security & Recovery Actions */}
                <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Account Recovery & Controls
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendResetPassword(editingUser)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition cursor-pointer"
                  >
                    <Mail size={14} /> Send Password Reset Email
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleArchive(editingUser)}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      editingUser.isArchived
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30"
                    }`}
                  >
                    {editingUser.isArchived ? (
                      <>
                        <RotateCcw size={14} /> Restore Account (Unarchive)
                      </>
                    ) : (
                      <>
                        <Archive size={14} /> Archive Account (Disable Access)
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white hover:border-white/20 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-semibold transition cursor-pointer"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════ MODAL: INSPECT USER LOGS & CLINICAL PROFILE ══════════════════ */}
      <AnimatePresence>
        {inspectingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingUser(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow">
                    {(inspectingUser.name || inspectingUser.email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{inspectingUser.name || "Unnamed User"}</h3>
                    <p className="text-xs text-slate-400">{inspectingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingUser(null)}
                  className="text-slate-500 hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Clinical Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/2 border border-white/5 rounded-xl p-4">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Account Role</span>
                    <p className="text-sm font-bold capitalize text-white mt-1">{inspectingUser.role}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Volume Unit</span>
                    <p className="text-sm font-bold uppercase text-white mt-1">{inspectingUser.volumeUnit || "ml"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Prescribed Limit</span>
                    <p className="text-sm font-bold text-sky-400 mt-1">
                      {inspectHealthProfile?.prescribedDailyFluidLimitMl
                        ? `${inspectHealthProfile.prescribedDailyFluidLimitMl} mL`
                        : "None"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Conditions</span>
                    <p className="text-sm font-bold text-slate-300 mt-1 truncate">
                      {inspectHealthProfile?.conditions?.length
                        ? inspectHealthProfile.conditions.join(", ")
                        : "None recorded"}
                    </p>
                  </div>
                </div>

                {/* Intake vs Output Records */}
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveLogTab("intake")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          activeLogTab === "intake"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Intake Records ({intakeLogs.length})
                      </button>
                      <button
                        onClick={() => setActiveLogTab("output")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          activeLogTab === "output"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Output Records ({outputLogs.length})
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">Showing last 50 entries</span>
                  </div>

                  {loadingLogs ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      <Loader2 className="mx-auto animate-spin mb-2" size={18} />
                      Retrieving database records…
                    </div>
                  ) : activeLogTab === "intake" ? (
                    intakeLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No intake records logged yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {intakeLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded bg-sky-500/10 text-sky-400 font-bold">💧</span>
                              <div>
                                <span className="font-semibold text-white capitalize">{log.fluidType}</span>
                                {log.notes && <span className="text-slate-500 ml-2">({log.notes})</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-sky-300 text-sm">{log.volume} mL</span>
                              <p className="text-[10px] text-slate-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : outputLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">No output records logged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {outputLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                              <Activity size={14} />
                            </span>
                            <div>
                              <span className="font-semibold text-white capitalize">{log.outputType}</span>
                              {log.notes && <span className="text-slate-500 ml-2">({log.notes})</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-300 text-sm">{log.volume} mL</span>
                            <p className="text-[10px] text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end bg-slate-900/50">
                <button
                  onClick={() => setInspectingUser(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
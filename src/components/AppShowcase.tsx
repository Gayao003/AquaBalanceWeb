"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { User, Stethoscope, ShieldCheck, CheckCircle2 } from "lucide-react";

interface ShowcaseItem {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  role: "patient" | "nurse" | "admin";
  badge: string;
  highlights: string[];
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  // Patient Screens
  {
    id: "patient-home",
    src: "/images/screenshots/patient-dashboard.png",
    title: "Daily Hydration Ring",
    subtitle: "Real-time intake tracking with progress ring, remaining volume, and daily targets.",
    role: "patient",
    badge: "Patient Experience",
    highlights: ["Interactive progress ring", "Automatic unit conversion", "Today's schedule status"],
  },
  {
    id: "patient-log",
    src: "/images/screenshots/patient-log-intake.png",
    title: "Quick-Add Beverage Logger",
    subtitle: "One-tap presets (Sip, Glass, Mug, Bottle) and beverage selection with instant sync.",
    role: "patient",
    badge: "Patient Experience",
    highlights: ["Custom fluid types", "100ml to 500ml presets", "Optional clinical notes"],
  },
  {
    id: "patient-schedule",
    src: "/images/screenshots/patient-schedule.png",
    title: "Hydration Schedules & Locking",
    subtitle: "Custom schedules with clinical lock banner when under care provider governance.",
    role: "patient",
    badge: "Patient Experience",
    highlights: ["Clinical lock mode", "Timed reminders", "Compliance tracking"],
  },

  // Nurse Screens
  {
    id: "nurse-roster",
    src: "/images/screenshots/nurse-dashboard.png",
    title: "Assigned Patient Roster",
    subtitle: "Bedside nurse dashboard displaying only the patients currently assigned to your shift.",
    role: "nurse",
    badge: "Clinical Nurse Care",
    highlights: ["Scoped patient roster", "Instant search & triage", "Quick fluid balance glance"],
  },
  {
    id: "nurse-patient-detail",
    src: "/images/screenshots/nurse-patient-detail.png",
    title: "Bedside Demographics & Limits",
    subtitle: "Prescribe daily fluid allowances, manage medical conditions, and lock patient schedules.",
    role: "nurse",
    badge: "Clinical Nurse Care",
    highlights: ["Demographics & biometrics", "Condition assignment", "Prescribed fluid limit"],
  },
  {
    id: "nurse-output-logging",
    src: "/images/screenshots/nurse-bedside-log.png",
    title: "Bedside Intake & Output",
    subtitle: "Direct fluid balance recording from bedside with shift summaries and clinical audit.",
    role: "nurse",
    badge: "Clinical Nurse Care",
    highlights: ["Output & urine tracking", "Net balance computation", "Caregiver attribution"],
  },

  // Admin Screens
  {
    id: "admin-roster",
    src: "/images/screenshots/admin-assignments.png",
    title: "Nurse-Patient Roster Matrix",
    subtitle: "Comprehensive hospital roster with search, pagination, and multi-nurse assignment.",
    role: "admin",
    badge: "Admin Governance",
    highlights: ["Multi-nurse assignment", "Caseload distribution", "Status filtering & search"],
  },
  {
    id: "admin-settings",
    src: "/images/screenshots/admin-settings.png",
    title: "System Maintenance & Alerts",
    subtitle: "Global hospital broadcast announcements, system maintenance mode, and security.",
    role: "admin",
    badge: "Admin Governance",
    highlights: ["Maintenance toggle", "Facility announcements", "Role-based security"],
  },
];

export default function AppShowcase() {
  const [activeRole, setActiveRole] = useState<"all" | "patient" | "nurse" | "admin">("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const filteredItems = SHOWCASE_ITEMS.filter(
    (item) => activeRole === "all" || item.role === activeRole
  );

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="showcase" className="py-24 relative overflow-hidden bg-slate-50/70 border-t border-slate-200/60">
      <div className="water-blob w-[450px] h-[450px] bg-sky-200/50 top-10 left-[-100px]" />
      <div className="water-blob w-[400px] h-[400px] bg-blue-200/40 bottom-10 right-[-100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 glass text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100 mb-4">
            ✨ Interactive App Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Every Clinical Role
            </span>
          </h2>
          <p className="text-slate-500 mt-3 text-base">
            Explore the dedicated interfaces built specifically for hemodialysis patients, bedside nurses, and clinical administrators.
          </p>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 p-1.5 bg-slate-200/60 backdrop-blur rounded-2xl w-fit mx-auto border border-slate-300/40">
            {[
              { id: "all", label: "All Experiences", icon: null },
              { id: "patient", label: "Patient", icon: User },
              { id: "nurse", label: "Nurse Staff", icon: Stethoscope },
              { id: "admin", label: "Admin Portal", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeRole === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRole(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-sky-700 shadow-sm shadow-slate-900/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Showcase Cards Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const hasError = imageErrors[item.id];

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-sky-100 transition-all flex flex-col justify-between"
                >
                  {/* Phone / Device Mockup Screen */}
                  <div className="relative w-full h-80 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-4 border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                    {/* Top Notch bar */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    </div>

                    {!hasError ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={item.src}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          onError={() => handleImageError(item.id)}
                        />
                      </div>
                    ) : (
                      // Modern Graceful Fallback Mockup UI when image is not yet in /public/images/screenshots/
                      <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-sky-950 text-white select-none">
                        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-sky-500/20">
                          {item.role === "patient" ? "💧" : item.role === "nurse" ? "🩺" : "🛡️"}
                        </div>
                        <h4 className="font-bold text-white text-base mb-1">{item.title}</h4>
                        <p className="text-xs text-sky-200/70 max-w-[200px] leading-relaxed mb-4">
                          Screenshot will render when placed at:
                        </p>
                        <code className="text-[10px] bg-slate-800/90 text-sky-300 px-2.5 py-1 rounded border border-slate-700 font-mono">
                          {item.src.replace("/images/screenshots/", "")}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Card Content & Details */}
                  <div className="pt-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Highlights pill tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.highlights.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md"
                        >
                          <CheckCircle2 className="w-3 h-3 text-sky-500" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Developer / Admin Instruction Banner for Screenshots */}
        <div className="mt-14 max-w-3xl mx-auto bg-sky-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-xs sm:text-sm text-sky-900">
          <span className="text-xl shrink-0">📸</span>
          <div>
            <p className="font-bold text-sky-950 mb-1">
              Adding Custom Screenshots to Your Deployment:
            </p>
            <p className="leading-relaxed text-sky-800/90">
              Save your mobile screenshots directly to{" "}
              <code className="bg-sky-100 text-sky-900 font-semibold px-1.5 py-0.5 rounded">
                admin_website/public/images/screenshots/
              </code>{" "}
              using the filenames shown above (e.g. <code className="font-semibold">patient-dashboard.png</code>, <code className="font-semibold">nurse-dashboard.png</code>). The website will automatically display your real screenshots upon build or reload!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

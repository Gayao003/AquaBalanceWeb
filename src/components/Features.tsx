"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap, BarChart2, Target, Bell, WifiOff, AlertTriangle, Eye, Users,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Quick-Add Logging",
    desc: "Preset buttons for common intake and output entries. Tap once to log — no repetitive typing.",
    color: "from-yellow-400 to-orange-400",
    large: true,
  },
  {
    icon: BarChart2,
    title: "Daily Fluid Summary",
    desc: "View total intake, estimated output, fluid balance, remaining allowance, and progress toward your target — all in one clear dashboard.",
    color: "from-sky-400 to-blue-500",
    large: true,
  },
  {
    icon: Target,
    title: "Personalized Fluid Target",
    desc: "Monitor progress toward a configured daily fluid intake allowance set by your care team.",
    color: "from-teal-400 to-cyan-500",
  },
  {
    icon: AlertTriangle,
    title: "Real-Time Feedback",
    desc: "Receive clear status when approaching, reaching, or exceeding your configured fluid limit.",
    color: "from-rose-400 to-red-500",
  },
  {
    icon: WifiOff,
    title: "Offline Access",
    desc: "Continue viewing records and logging entries even without an internet connection.",
    color: "from-slate-400 to-slate-600",
  },
  {
    icon: Bell,
    title: "Warning Notifications",
    desc: "Receive reminders and warnings related to your configured fluid intake limits.",
    color: "from-purple-400 to-indigo-500",
  },
  {
    icon: Eye,
    title: "Senior-Friendly Mode",
    desc: "Larger text, bigger touch targets, high contrast, and simplified interactions for improved accessibility.",
    color: "from-emerald-400 to-green-500",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Separate experiences for Patients, Nurses, and Administrators — each seeing only what they need.",
    color: "from-sky-500 to-indigo-500",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass rounded-2xl p-6 flex flex-col gap-4 ${
        feature.large ? "md:col-span-2" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 text-base mb-1">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="water-blob w-[500px] h-[400px] bg-sky-200 top-10 right-[-150px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex glass text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100 mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Stay Balanced
            </span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Purpose-built features for daily fluid self-monitoring, designed for
            patients undergoing hemodialysis.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

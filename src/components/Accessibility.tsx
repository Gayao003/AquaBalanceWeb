"use client";
import { motion } from "framer-motion";

const perks = [
  { emoji: "🔤", label: "Large, Readable Text" },
  { emoji: "👆", label: "Bigger Touch Targets" },
  { emoji: "🎨", label: "High-Contrast Interface" },
  { emoji: "🧭", label: "Simple Navigation" },
  { emoji: "📋", label: "Clear Daily Information" },
];

export default function Accessibility() {
  return (
    <section id="accessibility" className="py-24 relative overflow-hidden">
      <div className="water-blob w-[350px] h-[350px] bg-emerald-200 bottom-0 right-[-80px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass rounded-3xl p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <span className="inline-flex w-fit glass text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
              Accessibility
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Designed to Be{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                Easier to Use.
              </span>
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Senior Mode delivers a cleaner, clearer experience — designed with
              respect and dignity for all users, regardless of age or technical
              ability.
            </p>
            <ul className="flex flex-col gap-3">
              {perks.map((p) => (
                <li key={p.label} className="flex items-center gap-3 text-slate-700 font-medium">
                  <span className="text-xl">{p.emoji}</span>
                  {p.label}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right — visual comparison */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-4 justify-center items-start"
          >
            {/* Standard mode preview */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-56 rounded-2xl bg-gradient-to-b from-[#0A1628] to-[#0E3460] p-3 flex flex-col gap-2 border border-white/10">
                <div className="h-2 w-12 rounded bg-white/30" />
                <div className="h-1.5 w-8 rounded bg-white/20" />
                <div className="h-14 w-full rounded-xl bg-white/10 mt-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-400" />
                </div>
                <div className="h-1.5 w-full rounded bg-white/15" />
                <div className="h-1.5 w-10 rounded bg-white/15" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Standard</span>
            </div>

            <div className="text-slate-300 text-2xl self-center">→</div>

            {/* Senior mode preview — larger, higher contrast */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-36 h-64 rounded-2xl bg-black p-3 flex flex-col gap-3 border-2 border-white/40">
                <div className="h-3 w-16 rounded bg-white" />
                <div className="h-2.5 w-12 rounded bg-white/70" />
                <div className="h-16 w-full rounded-xl bg-white/10 mt-1 flex items-center justify-center border border-white/30">
                  <div className="w-10 h-10 rounded-full border-2 border-white" />
                </div>
                <div className="h-2.5 w-full rounded bg-white/60" />
                <div className="h-2.5 w-14 rounded bg-white/60" />
                <div className="mt-auto h-8 w-full rounded-xl bg-white/20 border border-white/30" />
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">Senior Mode</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

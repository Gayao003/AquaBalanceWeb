"use client";
import { motion } from "framer-motion";
import { APP_CONFIG } from "@/lib/config";

export default function About() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="water-blob w-[400px] h-[300px] bg-sky-200 top-10 left-[-80px]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <span className="inline-flex glass text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100">
            About
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            A Tool Built with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Purpose
            </span>
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg max-w-2xl">
            AquaBalance is a mobile fluid monitoring application developed to
            support individuals undergoing maintenance hemodialysis. It is
            designed to make daily fluid self-monitoring simpler, clearer, and
            more consistent — whether for patients at home or nurses in a
            clinical setting.
          </p>
          <p className="text-slate-500 text-sm max-w-2xl">
            The application supports personalized daily fluid targets, quick
            intake and output logging, real-time progress feedback, and
            accessible design for all users.
          </p>

          {/* Disclaimer */}
          <div id="disclaimer" className="mt-4 glass rounded-2xl border border-amber-200/60 bg-amber-50/40 p-5 max-w-2xl text-left">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">⚠️ Medical Disclaimer: </span>
              This application is intended to support personal fluid monitoring
              and does not replace professional medical advice, diagnosis,
              treatment, or clinical assessment. Always consult your healthcare
              provider regarding your fluid management plan.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

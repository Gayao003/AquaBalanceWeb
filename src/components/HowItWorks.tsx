"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: "01",
    emoji: "🎯",
    title: "Set Your Fluid Goal",
    desc: "Your care team configures a personalized daily fluid target or limit. The app reflects this from the moment you log in.",
  },
  {
    num: "02",
    emoji: "📝",
    title: "Log Intake & Output",
    desc: "Tap quick-add presets or enter a custom volume. Record every glass of water, cup of soup, or urine output in seconds.",
  },
  {
    num: "03",
    emoji: "📊",
    title: "Track Your Daily Balance",
    desc: "Watch your progress ring fill throughout the day. Clear colour cues show when you're within limits or approaching your threshold.",
  },
  {
    num: "04",
    emoji: "🔔",
    title: "Stay Informed",
    desc: "Receive timely warnings before you exceed your limit, and review your daily history to understand your fluid patterns over time.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="water-blob w-[450px] h-[350px] bg-blue-200 bottom-0 left-[-100px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex glass text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100 mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Simple Steps,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Powerful Clarity
            </span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">
            Get started and stay consistent with a workflow designed to be easy
            for everyone — including seniors and first-time users.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-sky-200 via-blue-300 to-sky-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4"
              >
                {/* Node */}
                <div className="relative z-10 w-20 h-20 rounded-full glass border-2 border-sky-200 flex items-center justify-center shadow-md">
                  <span className="text-3xl">{step.emoji}</span>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

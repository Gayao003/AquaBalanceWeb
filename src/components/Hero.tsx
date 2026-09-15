"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { APP_CONFIG } from "@/lib/config";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
    >
      {/* Ambient background blobs */}
      <div className="water-blob w-[600px] h-[600px] bg-sky-300 top-[-100px] left-[-200px]" />
      <div className="water-blob w-[400px] h-[400px] bg-blue-200 bottom-[-80px] right-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Left — copy */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Badge */}
          <span className="inline-flex w-fit items-center gap-1.5 glass text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sky-100">
            💧 Mobile Fluid Monitoring
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
            Track Every Drop.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Stay on Top
            </span>{" "}
            of Your Fluid Goals.
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg">
            AquaBalance helps patients and nurses record daily fluid intake and
            output, monitor personalized fluid targets, and understand their
            daily fluid balance — all in one simple, beautiful app.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <motion.a
              href={APP_CONFIG.ANDROID_DOWNLOAD_URL}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-sky-200 transition-colors"
            >
              <span>📲</span> Download the App
            </motion.a>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 glass border border-sky-200 text-sky-700 font-semibold px-6 py-3 rounded-2xl transition-colors hover:border-sky-300"
            >
              Explore Features →
            </motion.a>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Offline Access", "Senior-Friendly Mode", "Role-Based Access", "Real-Time Alerts"].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium bg-white/70 border border-sky-100 text-slate-600 rounded-full px-3 py-1"
                >
                  ✓ {tag}
                </span>
              )
            )}
          </div>
        </motion.div>

        {/* Right — phone mockup */}
        <motion.div
          className="relative flex justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
        >
          {/* Ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="ripple-circle absolute rounded-full border border-sky-200/60"
                style={{ width: 280 + i * 70, height: 280 + i * 70 }}
              />
            ))}
          </div>

          {/* Phone frame */}
          <div className="phone-float relative z-10">
            <div className="relative w-[260px] sm:w-[300px] h-[540px] sm:h-[620px] rounded-[48px] bg-gradient-to-b from-slate-900 to-slate-800 shadow-[0_32px_80px_rgba(14,165,233,0.25)] border-4 border-slate-700/80 overflow-hidden">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-full z-20" />
              {/* Screen glass reflection */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
              {/* App screenshot — replace /public/images/app-screenshot.png */}
              <div className="relative w-full h-full bg-gradient-to-b from-[#0A1628] to-[#0E3460]">
                <Image
                  src="/images/app-screenshot.png"
                  alt="AquaBalance app screenshot"
                  fill
                  className="object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Placeholder overlay shown when no screenshot */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <div className="text-5xl">💧</div>
                  <p className="text-white/60 text-xs text-center">
                    Replace with your app screenshot at{" "}
                    <code className="text-sky-300">
                      /public/images/app-screenshot.png
                    </code>
                  </p>
                </div>
              </div>
            </div>
            {/* Side button accents */}
            <div className="absolute top-20 -right-1 w-1 h-12 bg-slate-600 rounded-r-full" />
            <div className="absolute top-36 -left-1 w-1 h-8 bg-slate-600 rounded-l-full" />
            <div className="absolute top-48 -left-1 w-1 h-8 bg-slate-600 rounded-l-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

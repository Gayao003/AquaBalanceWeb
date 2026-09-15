"use client";
import { motion } from "framer-motion";
import { APP_CONFIG } from "@/lib/config";
import { Smartphone } from "lucide-react";

export default function Download() {
  return (
    <section id="download" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-600 to-blue-700" />
      <div className="water-blob w-[500px] h-[400px] bg-blue-400/40 top-[-100px] right-[-100px]" />
      <div className="water-blob w-[350px] h-[300px] bg-sky-300/40 bottom-[-80px] left-[-60px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Ready to Start Tracking Your Fluid Goals?
          </h2>
          <p className="text-sky-100 text-lg max-w-xl">
            Download the AquaBalance app for Android and start monitoring your
            fluid balance with confidence.
          </p>

          <div className="flex flex-col items-center gap-3">
            <motion.a
              href={APP_CONFIG.ANDROID_DOWNLOAD_URL}
              download="AquaBalance.apk"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 bg-white text-sky-700 font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-sky-900/40 hover:bg-sky-50 transition-all cursor-pointer"
            >
              <span className="text-2xl">📲</span>
              Download APK for Android
            </motion.a>
            <span className="text-xs text-sky-200 font-medium">
              Direct download • Verified APK file
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-sky-100 text-sm mt-1 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
            <span>Version {APP_CONFIG.APP_VERSION}</span>
            <span>•</span>
            <span>{APP_CONFIG.ANDROID_MIN_VERSION}</span>
            <span>•</span>
            <span>Free & Open</span>
          </div>

          <div className="max-w-md bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-xs text-sky-100 text-left mt-4 flex items-start gap-3">
            <span className="text-base">ℹ️</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Quick Installation Guide:</p>
              <p className="leading-relaxed opacity-90">
                1. Tap the button above to download <code className="bg-white/20 px-1 py-0.5 rounded text-white font-mono">AquaBalance.apk</code>.<br />
                2. Open your device’s <strong>Downloads</strong> and tap the APK file.<br />
                3. If asked, toggle <em>&quot;Allow from this source&quot;</em> to complete the installation.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

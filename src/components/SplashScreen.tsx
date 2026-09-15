"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 500);
    }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sky-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="ripple-circle absolute rounded-full border border-sky-300"
                style={{ width: 100 + i * 60, height: 100 + i * 60 }}
              />
            ))}
          </div>

          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-200">
              <span className="text-3xl">💧</span>
            </div>
            <p className="text-sky-600 font-semibold text-lg tracking-wide">AquaBalance</p>

            {/* Loading bar */}
            <motion.div
              className="h-0.5 bg-sky-200 rounded-full overflow-hidden"
              style={{ width: 120 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

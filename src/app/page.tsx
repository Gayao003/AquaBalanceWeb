"use client";
import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import AppShowcase from "@/components/AppShowcase";
import Accessibility from "@/components/Accessibility";
import About from "@/components/About";
import Download from "@/components/Download";
import Footer from "@/components/Footer";

const TRUST_ITEMS = [
  { emoji: "🎯", label: "Personalized Fluid Goals" },
  { emoji: "📱", label: "Simple Daily Monitoring" },
  { emoji: "♿", label: "Built with Accessibility in Mind" },
  { emoji: "🔁", label: "Consistent Self-Monitoring" },
];

export default function Home() {
  const [splashDone, setSplashDone] = useState(false);

  // Only show splash on first visit in this session
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => {
    const seen = sessionStorage.getItem("splash_seen");
    if (!seen) {
      setShowSplash(true);
      sessionStorage.setItem("splash_seen", "1");
    } else {
      setSplashDone(true);
    }
  }, []);

  return (
    <>
      {showSplash && !splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
      <div
        className={`transition-opacity duration-500 ${splashDone ? "opacity-100" : "opacity-0"}`}
      >
        <Header />
        <main>
          <Hero />

          {/* Trust strip */}
          <section className="py-10 border-y border-slate-100 bg-white/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
                {TRUST_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-slate-600 text-sm font-medium"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Features />
          <HowItWorks />
          <AppShowcase />
          <Accessibility />
          <About />
          <Download />
        </main>
        <Footer />
      </div>
    </>
  );
}

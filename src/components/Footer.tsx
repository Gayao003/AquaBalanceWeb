import Link from "next/link";
import { Droplets } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-slate-900 text-slate-400 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-slate-800">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              {APP_CONFIG.name}
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              {APP_CONFIG.tagline}
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold text-sm">Navigation</h4>
            {[
              ["Home", "#home"],
              ["Features", "#features"],
              ["How It Works", "#how-it-works"],
              ["About", "#about"],
              ["Download", "#download"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm hover:text-sky-400 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-semibold text-sm">Legal</h4>
            <a
              href={APP_CONFIG.privacyPolicyUrl}
              className="text-sm hover:text-sky-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href={APP_CONFIG.disclaimerUrl}
              className="text-sm hover:text-sky-400 transition-colors"
            >
              Medical Disclaimer
            </a>
            <a
              href="/admin/login"
              className="text-sm hover:text-sky-400 transition-colors"
            >
              Admin Portal →
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <p>© {year} {APP_CONFIG.name}. All rights reserved.</p>
          <p>
            This application does not replace professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

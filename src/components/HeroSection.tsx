import React from 'react';
import { ArrowRight, Play, WifiOff, Cloud, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import hero3d from '../assets/hero_3d.jpg';

interface HeroSectionProps {
  onOpenDemo: () => void;
  onOpenContact: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDemo, onOpenContact }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background soft clay gradient orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-teal-200/40 via-emerald-100/30 to-coral-200/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 clay-pill mb-6 text-xs sm:text-sm font-extrabold text-slate-800">
            <span className="flex h-2.5 w-2.5 rounded-full bg-teal-500 animate-ping" />
            <span className="text-teal-600 font-bold uppercase tracking-wider">Zero-Downtime POS</span>
            <span className="text-slate-300">|</span>
            <span>Built for Fast Food, Cafes & Food Courts</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            The <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Offline-First</span> POS That Never Stops Serving.
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
            Wifi dropped? Internet down? <strong>QWeble keeps taking orders, printing tokens, and running kitchen displays seamlessly.</strong> Automatically syncs to the cloud the instant you reconnect.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="clay-btn-primary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-3 cursor-pointer group"
            >
              <span>Try Live Kiosk Simulator</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onOpenContact}
              className="clay-btn-secondary w-full sm:w-auto px-7 py-4 text-base flex items-center justify-center gap-3 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Get Started Free</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-500" /> 100% Offline Ready
            </span>
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-coral-500" /> Touch Kiosks in 30s
            </span>
            <span className="flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-blue-500" /> Automated Cloud Sync
            </span>
          </div>
        </div>

        {/* 3D Clay Hero Image Showcase with Floating Clay Badges */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Visual Card */}
          <div className="clay-card p-3 sm:p-5 bg-white/70 backdrop-blur-sm relative group overflow-hidden">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-inner border border-white/60">
              <img
                src={hero3d}
                alt="QWeble 3D Claymorphic POS and Kiosk System"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Clay Badge 1: Offline Protection (Top Left) */}
            <div className="absolute -top-4 -left-2 sm:top-8 sm:-left-6 clay-card p-3.5 sm:p-4 bg-white flex items-center gap-3 animate-clay-float shadow-xl max-w-[220px] sm:max-w-xs">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0 shadow-inner">
                <WifiOff className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Zero-Internet Mode</p>
                <p className="text-[11px] font-semibold text-teal-600">Orders Never Fail</p>
              </div>
            </div>

            {/* Floating Clay Badge 2: Auto Cloud Sync (Top Right) */}
            <div className="absolute -bottom-4 -right-2 sm:bottom-10 sm:-right-6 clay-card p-3.5 sm:p-4 bg-white flex items-center gap-3 animate-clay-float-reverse shadow-xl max-w-[220px] sm:max-w-xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                <Cloud className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Automated Cloud Sync</p>
                <p className="text-[11px] font-semibold text-blue-600">Centralized Cloud Rollup</p>
              </div>
            </div>

            {/* Floating Clay Badge 3: Token Generated (Bottom Left) */}
            <div className="hidden sm:flex absolute bottom-8 left-10 clay-pill px-4 py-2 bg-white/95 items-center gap-2.5 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-extrabold text-slate-800">Token #104 Placed · 12ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

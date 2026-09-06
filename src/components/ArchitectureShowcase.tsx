import React from 'react';
import { Database, Server, Laptop, Monitor, Cloud, Check, X, ShieldAlert } from 'lucide-react';

export const ArchitectureShowcase: React.FC = () => {
  return (
    <section className="py-20 bg-white/60 backdrop-blur-sm border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-slate-700 mb-3">
            <span>Architecture Breakdown</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Why Other Cloud POS Systems Crash
          </h2>
          <p className="text-slate-600 font-medium text-base">
            See the engineering difference between generic web-only cash registers and QWeble's local-first edge runtime.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Cloud POS */}
          <div className="clay-card p-6 sm:p-8 bg-rose-50/20 border-rose-200/50">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100 mb-6">
              <span className="font-extrabold text-base text-rose-900">Standard Cloud-Only POS</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Fragile</span>
            </div>
            <ul className="space-y-4 text-sm font-medium text-slate-700">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>Freezes on Wifi Drop:</strong> Orders cannot be keyed in without an active internet connection.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>High Cloud Latency:</strong> 800ms–2000ms delay per order waiting for remote server roundtrips.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>Expensive Proprietary Hardware:</strong> Locked into buying $1500 custom vendor terminals.</span>
              </li>
            </ul>
          </div>

          {/* QWeble Offline-First POS */}
          <div className="clay-card p-6 sm:p-8 bg-teal-50/20 border-teal-200/60 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-teal-100 mb-6">
              <span className="font-extrabold text-base text-teal-950">QWeble Offline-First POS</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">Resilient</span>
            </div>
            <ul className="space-y-4 text-sm font-medium text-slate-800">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>Zero-Downtime Local SQLite:</strong> Orders process instantly on local LAN with zero external dependancies.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>Instant Sub-15ms Token Output:</strong> Kitchen display and thermal printers fire without lag.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span><strong>Runs on Any Windows/Tablet Device:</strong> Keep your existing PC, laptops, touch screens, and thermal printers.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

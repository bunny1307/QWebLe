import React from 'react';
import { WifiOff, MonitorSmartphone, ChefHat, CloudLightning, ShieldCheck, Printer, Zap, BarChart3 } from 'lucide-react';
import kitchen3d from '../assets/kitchen_3d.jpg';
import analytics3d from '../assets/analytics_3d.jpg';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-teal-700 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Unmatched Architecture
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Engineered For The Toughest Lunch Rush.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Unlike cloud-only POS systems that freeze the moment your internet flinches, QWeble combines the lightning speed of an on-premise SQLite database with background automated cloud synchronization.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Card 1: Offline Engine (Large 7 cols) */}
          <div className="md:col-span-7 clay-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-white to-teal-50/40">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 mb-6 shadow-inner">
                <WifiOff className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                100% Offline-First Execution
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed mb-6 text-sm sm:text-base">
                Your registers and touch kiosks write directly to an embedded, zero-configuration local database. Tokens are issued, kitchen tickets dispatched, and inventory decremented in under <strong>15 milliseconds</strong>—even with zero internet connection.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              <div className="clay-card-tinted p-3 text-center">
                <span className="block text-2xl font-black text-teal-600">0 ms</span>
                <span className="text-[11px] font-bold text-slate-500">Cloud Delay</span>
              </div>
              <div className="clay-card-tinted p-3 text-center">
                <span className="block text-2xl font-black text-emerald-600">100%</span>
                <span className="text-[11px] font-bold text-slate-500">LAN Uptime</span>
              </div>
              <div className="clay-card-tinted p-3 text-center col-span-2 sm:col-span-1">
                <span className="block text-2xl font-black text-slate-800">Auto</span>
                <span className="text-[11px] font-bold text-slate-500">Failover</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Self-Ordering Touch Kiosk (5 cols) */}
          <div className="md:col-span-5 clay-card p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-white to-coral-50/30">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-coral-100 flex items-center justify-center text-coral-600 mb-6 shadow-inner">
                <MonitorSmartphone className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                Touch Kiosks on Any Screen
              </h3>
              <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mb-4">
                Turn any Windows touch terminal, iPad, or Android tablet into a customer self-ordering kiosk with one click. Dedicated Edge kiosk lockdown prevents customer tampering.
              </p>
            </div>
          </div>

          {/* Bento Card 3: Kitchen Display System (5 cols with 3D Render) */}
          <div id="kds" className="md:col-span-5 clay-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-6 shadow-inner">
                <ChefHat className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                Live Kitchen Kanban (KDS)
              </h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4">
                Eliminate lost paper slips. Chef screens update in real-time with color-coded tokens (New, Preparing, Ready, Delivered) with sound chimes.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md border border-slate-100 mt-2">
              <img src={kitchen3d} alt="3D Clay Kitchen Display" className="w-full h-44 object-cover" />
            </div>
          </div>

          {/* Bento Card 4: Intelligent Cloud Sync & Backup (7 cols with 3D Render) */}
          <div id="cloud-sync" className="md:col-span-7 clay-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center justify-between bg-gradient-to-br from-white via-white to-blue-50/40">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                <CloudLightning className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">
                Automated Silent Cloud Sync
              </h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4">
                Whenever internet connectivity is active, a non-blocking daemon thread automatically pushes every completed order, daily ledger, and inventory update directly to your secure cloud dashboard.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4" /> Bank-Grade Hardware-Locked Security
              </div>
            </div>
            <div className="w-full sm:w-56 rounded-2xl overflow-hidden shadow-md border border-slate-100 shrink-0">
              <img src={analytics3d} alt="3D Clay Cloud Analytics" className="w-full h-44 object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

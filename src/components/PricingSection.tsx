import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Base Tier',
      tagline: 'Ideal for small cafes & standalone food trucks',
      priceMonthly: 799,
      priceAnnual: 649,
      popular: false,
      color: 'slate',
      features: [
        'Standalone Offline POS Terminal',
        'Daily Token Counter Engine',
        'Cash & Counter Reconciliation',
        'Thermal Printer ESC/POS & PDF Receipts',
        'Local SQLite Database',
        'Inventory Tracking & Stock Alerts',
      ],
      notIncluded: [
        'Multi-screen touch kiosk pairing',
        'Automated cloud backup & sync',
        'AI sales & demand forecasting',
      ],
    },
    {
      name: 'Cloud Sync',
      tagline: 'For fast food, busy bistros & multi-screen counters',
      priceMonthly: 1499,
      priceAnnual: 1199,
      popular: true,
      color: 'teal',
      features: [
        'Everything in Base Tier',
        'Unlimited Self-Ordering Touch Kiosks',
        'Real-Time Kitchen Display System (KDS)',
        'Automated Cloud Sync',
        'Live Internet Diagnostics & Auto-Failover',
        'Razorpay QR / Dynamic UPI Payments',
        'Multi-device LAN Device Authorization Gate',
        'Priority Phone & WhatsApp Support',
      ],
      notIncluded: [
        'AI automated inventory demand forecasting',
      ],
    },
    {
      name: 'AI Analytics',
      tagline: 'For high-volume chains, franchises & food courts',
      priceMonthly: 2499,
      priceAnnual: 1999,
      popular: false,
      color: 'coral',
      features: [
        'Everything in Cloud Sync',
        'AI Demand & Rush Hour Forecasting',
        'Smart Ingredient & Stock Depletion Predictions',
        'Multi-Outlet Master Dashboard & Rollups',
        'Custom Cloud Domain & Web Reporting',
        'Automated Cryptographic Tamper-Proof Audit Logs',
        'Dedicated Technical Account Manager',
      ],
      notIncluded: [],
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-teal-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            Simple, Transparent Plans
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Invest in Reliability, Not Downtime.
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            No hidden per-transaction POS surcharges. Zero lock-in contracts.
          </p>

          {/* Billing Interval Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 clay-pill bg-white border border-slate-200/80">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                !isAnnual ? 'clay-btn-primary' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnnual ? 'clay-btn-primary' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((p) => {
            const price = isAnnual ? p.priceAnnual : p.priceMonthly;
            return (
              <div
                key={p.name}
                className={`clay-card p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  p.popular
                    ? 'border-2 border-teal-500/80 shadow-2xl scale-[1.03] z-10 bg-white'
                    : 'bg-white/80'
                }`}
              >
                {/* Popular Pill */}
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 clay-pill px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{p.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 min-h-[32px]">{p.tagline}</p>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-slate-100 flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900">₹{price}</span>
                    <span className="text-xs font-bold text-slate-400">/ outlet / mo</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 text-xs sm:text-sm mb-8">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-slate-700 font-medium">
                        <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {p.notIncluded.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-slate-400 font-normal line-through opacity-75">
                        <span className="w-4 h-4 shrink-0 flex items-center justify-center text-xs">✕</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectPlan(p.name)}
                  className={`w-full py-3.5 text-sm font-extrabold cursor-pointer ${
                    p.popular ? 'clay-btn-primary' : 'clay-btn-secondary'
                  }`}
                >
                  Choose {p.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

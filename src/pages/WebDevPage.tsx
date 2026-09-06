import React, { useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Palette, 
  Wrench, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Terminal, 
  Server, 
  Gauge
} from 'lucide-react';

interface WebDevPageProps {
  onBackToHome: () => void;
  onOpenContact: (plan?: string) => void;
}

export const WebDevPage: React.FC<WebDevPageProps> = ({ onBackToHome, onOpenContact }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const coreServices = [
    {
      icon: <Palette className="w-6 h-6 text-teal-500" />,
      tag: 'AESTHETIC_ENGINE',
      title: 'Bespoke Brand UI/UX',
      description: 'Handcrafted around your restaurant ambiance, typography, and food photography. Zero cookie-cutter templates.',
      perks: ['Custom 3D & Clay Accents', 'Brand-Matched Color Palette', 'Fluid Touch-First UX'],
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-500" />,
      tag: 'MENU_SHOWCASE',
      title: 'Interactive Digital Menus',
      description: 'High-res dynamic food showcases with instant category filtering, dietary allergen flags, and live dish highlights.',
      perks: ['Veg/Non-Veg/Vegan Tags', 'Photo Lightbox & Media', 'Chef Special Highlights'],
    },
    {
      icon: <Gauge className="w-6 h-6 text-indigo-500" />,
      tag: 'SPEED_ENGINE',
      title: 'Ultra-Fast Performance',
      description: 'Engineered for sub-second load times on mobile networks so hungry customers never bounce from sluggish pages.',
      perks: ['Sub-500ms Edge Loading', 'Optimized Core Web Vitals', 'Fluid 60 FPS Micro-Interactions'],
    },
    {
      icon: <Server className="w-6 h-6 text-amber-500" />,
      tag: 'MANAGED_OPS',
      title: '100% Fully Managed DevOps',
      description: 'We handle enterprise cloud hosting, SSL encryption, daily automated backups, and 99.99% uptime monitoring.',
      perks: ['Global High-Speed CDN', 'Automated SSL Renewal', 'DDoS & Security Protection'],
    },
    {
      icon: <Wrench className="w-6 h-6 text-purple-500" />,
      tag: 'RAPID_DISPATCH',
      title: 'Ongoing Menu Maintenance',
      description: 'Need to update seasonal pricing, add weekend combos, or swap photography? Message us and we push it live for you.',
      perks: ['Turnaround in Under 2 Hours', 'Price & Content Updates', 'Holiday Banner Refreshes'],
    },
    {
      icon: <Globe className="w-6 h-6 text-cyan-500" />,
      tag: 'LOCAL_RADAR',
      title: 'Local SEO & Google Maps',
      description: 'Engineered with Schema.org culinary markup so local foodies and hungry travelers discover your venue first.',
      perks: ['Google Search Menu Schema', 'Geo-Targeted Local Tags', 'Rich Social Share Previews'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-slate-900 selection:bg-teal-500 selection:text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="clay-pill px-4 py-2 text-xs font-black text-slate-700 hover:text-teal-600 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Main Site</span>
          </button>
        </div>

        {/* Hero Section: Cyberpunk Telemetry + Claymorphic Depth */}
        <div className="clay-card p-8 sm:p-14 mb-16 relative overflow-hidden bg-white">
          {/* Subtle Ambient Circuit Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 clay-pill text-xs font-mono font-bold text-teal-800 border border-teal-500/30 mb-6 bg-teal-50/50">
              <Terminal className="w-3.5 h-3.5 text-teal-600" />
              <span>BESPOKE CULINARY WEB ENGINEERING</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              We Build & Maintain Websites For Your Food Brand.
            </h1>

            <p className="text-slate-600 text-base sm:text-xl font-medium leading-relaxed mb-8">
              Don’t settle for generic templates that crash on smartphones. We design, deploy, host, and continuously maintain high-performance websites and interactive digital menus for restaurants, cafes, and food businesses.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onOpenContact('Custom Website Development')}
                className="clay-btn-primary px-8 py-4 text-sm font-black flex items-center gap-2.5 cursor-pointer shadow-lg hover:shadow-teal-500/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Request Custom Website Proposal</span>
              </button>

              <button
                onClick={onBackToHome}
                className="clay-btn-secondary px-6 py-4 text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                <span>Back to Main Site</span>
              </button>
            </div>
          </div>
        </div>

        {/* Terminal / Tech Telemetry Section */}
        <div className="clay-cyber-dark p-6 sm:p-8 mb-16 relative overflow-hidden font-mono text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-slate-400 font-bold">qweble-webdev-engine :: production</span>
            </div>
            <span className="text-teal-400 font-bold text-xs">STATUS: 100% OPERATIONAL</span>
          </div>
          <div className="space-y-2 text-slate-300">
            <p className="text-slate-400"># QWeble Full-Service Web Engineering & Hosting</p>
            <p><span className="text-teal-400">&gt; stack:</span> Modern React, Vite, Tailwind CSS, Global Edge CDN, Automated SSL</p>
            <p><span className="text-teal-400">&gt; maintenance:</span> 100% Managed — zero terminal commands or server hassles for owners</p>
            <p><span className="text-teal-400">&gt; menu_updates:</span> Instant turnaround for seasonal specials, new combos &amp; price revisions</p>
            <p className="text-emerald-400 font-bold">✔ Deploy target: Custom domain (e.g., yourbrand.com) with 99.99% uptime guarantee</p>
          </div>
        </div>

        {/* Core Services Bento Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Full-Service Web Lifecycle
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base">
              Everything from initial branding and interactive digital menus to high-speed hosting and ongoing maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreServices.map((service, idx) => (
              <div key={idx} className="clay-cyber-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs">
                      {service.icon}
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                      {service.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <ul className="space-y-2">
                    {service.perks.map((perk, pIdx) => (
                      <li key={pIdx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        
        {/* Traditional Agency vs QWeble Comparison Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 clay-pill text-xs font-mono font-bold text-teal-800 border border-teal-500/30 mb-3 bg-teal-50/50">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>THE QWEBLE ADVANTAGE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Traditional Agency vs. QWeble
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base">
              Why restaurants choose our dedicated web engineering partnership over detached, one-off agencies.
            </p>
          </div>

          <div className="clay-card p-6 sm:p-10 bg-white max-w-5xl mx-auto overflow-hidden shadow-xl border border-slate-200/80">
            {/* Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="font-black text-base sm:text-lg text-slate-700">Traditional Agency</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                  Outdated
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/15 border border-teal-500/30">
                <span className="font-black text-base sm:text-lg text-teal-950">QWeble</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-white shadow-xs">
                  Full Service
                </span>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-slate-100 mt-2">
              {[
                {
                  traditional: 'Website is separate from operations',
                  qweble: 'Built around your restaurant workflow',
                },
                {
                  traditional: 'Manual menu changes',
                  qweble: 'Centralized menu management',
                },
                {
                  traditional: 'Generic templates',
                  qweble: 'Custom restaurant UX',
                },
                {
                  traditional: 'Hosting is your problem',
                  qweble: 'Fully managed',
                },
                {
                  traditional: 'Website only',
                  qweble: 'Website + digital menu + QWeble ecosystem',
                },
                {
                  traditional: 'Slow change requests',
                  qweble: 'Rapid updates',
                },
                {
                  traditional: 'Built once, forgotten',
                  qweble: 'Continuously maintained',
                },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 py-4 items-center">
                  {/* Traditional Agency Side */}
                  <div className="flex items-start gap-3 text-slate-500 text-xs sm:text-sm font-medium pl-2">
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-rose-200/70">
                      ✕
                    </span>
                    <span>{row.traditional}</span>
                  </div>

                  {/* QWeble Side */}
                  <div className="flex items-start gap-3 text-slate-900 text-xs sm:text-sm font-bold bg-teal-50/40 hover:bg-teal-50/70 transition-colors p-3 rounded-xl border border-teal-200/50 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-teal-950 font-extrabold">{row.qweble}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The 4-Step Process */}
        <div className="clay-card p-8 sm:p-12 mb-20 bg-white">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-10">
            How We Partner With You
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                01
              </div>
              <h4 className="font-black text-slate-900 mb-1">Brand & Concept Discovery</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We review your existing menu, branding, photos, and unique culinary style.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                02
              </div>
              <h4 className="font-black text-slate-900 mb-1">Interactive Prototype</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We build an interactive preview for desktop and mobile for your review and feedback.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                03
              </div>
              <h4 className="font-black text-slate-900 mb-1">Performance & SEO Tuning</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We fine-tune sub-second load times, Google Maps search tags, and mobile responsive polish.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                04
              </div>
              <h4 className="font-black text-slate-900 mb-1">Launch & 24/7 Managed Care</h4>
              <p className="text-xs text-slate-500 leading-relaxed">We publish your domain, enable SSL, and continuously handle all ongoing menu updates.</p>
            </div>
          </div>
        </div>

        {/* Final Call to Action (No Cost Mentioned) */}
        <div className="clay-cyber-dark p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> CUSTOM SCOPE · FULLY MANAGED
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Ready to Upgrade Your Food Brand Online?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed mb-8">
              Tell us about your restaurant, cafe, or culinary concept. Our design and engineering team will tailor an end-to-end proposal with zero obligation.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onOpenContact('Custom Website Development')}
                className="clay-btn-primary px-8 py-4 text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-teal-500/30"
              >
                <span>Request Custom Website Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onBackToHome}
                className="px-6 py-4 rounded-full text-sm font-bold bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer"
              >
                Back to Main Site
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

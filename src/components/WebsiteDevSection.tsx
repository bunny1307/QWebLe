import React from 'react';
import { Globe, Palette, Wrench, Smartphone, Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface WebsiteDevSectionProps {
  onOpenContact: (plan?: string) => void;
}

export const WebsiteDevSection: React.FC<WebsiteDevSectionProps> = ({ onOpenContact }) => {
  const highlights = [
    {
      icon: <Palette className="w-6 h-6 text-amber-500" />,
      title: 'Bespoke Custom Design',
      description:
        'Crafted specifically around your brand, ambiance, and food aesthetics. No generic templates or boring cookie-cutter layouts.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-teal-500" />,
      title: 'Interactive Digital Menus',
      description:
        'Stunning, lightning-fast mobile menus with high-res food photography, allergen tags, and optional direct ordering for takeout.',
    },
    {
      icon: <Wrench className="w-6 h-6 text-indigo-500" />,
      title: 'Continuous Managed Maintenance',
      description:
        'We manage high-speed cloud hosting, SSL encryption, daily backups, and perform all your ongoing menu updates and seasonal changes.',
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-500" />,
      title: 'Local SEO & Google Discover',
      description:
        'Optimized for Google Maps, local food searches, schema food markup, and social links so hungry customers find your tables first.',
    },
  ];

  return (
    <section id="website-development" className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-slate-100/60 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Beyond The POS Counter
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            We Also Build & Maintain Websites For Your Brand.
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            Your food deserves an online presence as memorable as your dining experience. We engineer, host, and continuously maintain custom websites for cafes, restaurants, and cloud kitchens.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="clay-card p-6 bg-white/90 hover:bg-white flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center mb-5 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Banner (No Cost Mentioned) */}
        <div className="clay-card p-8 sm:p-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Full-Service Web Solution
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-white">
                Need a Custom Website For Your Restaurant?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
                Whether opening a new flagship bistro or upgrading an outdated menu, our dedicated web engineering team handles design, deployment, domain setup, and ongoing updates tailored to your unique scope.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 justify-center lg:justify-start">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" /> Fast Delivery
                </span>
                <span className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" /> 100% Fully Managed
                </span>
                <span className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" /> Seamless POS Integration
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => onOpenContact('Custom Website Development')}
                className="clay-btn-primary px-8 py-4 text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-teal-500/25"
              >
                <span>Inquire About Web Development</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

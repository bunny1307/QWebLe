import React from 'react';
import logoImg from '../assets/logo.png';
import { ArrowUp, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-100">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-1.5 shadow-md flex items-center justify-center">
                <img src={logoImg} alt="QWeble Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                QWeble<span className="text-teal-500">.</span>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed mb-6">
              The resilient offline-first point-of-sale and self-ordering kiosk engineered for fast food, cafes, and multi-outlet restaurants.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational · Offline Resilient</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm font-semibold text-slate-600">
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Offline POS</a></li>
              <li><a href="#interactive-demo" className="hover:text-teal-600 transition-colors">Self-Ordering Kiosk</a></li>
              <li><a href="#kds" className="hover:text-teal-600 transition-colors">Kitchen Display (KDS)</a></li>
              <li><a href="#cloud-sync" className="hover:text-teal-600 transition-colors">Automated Cloud Sync</a></li>
              <li><a href="#pricing" className="hover:text-teal-600 transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm font-semibold text-slate-600">
              <li><a href="#faq" className="hover:text-teal-600 transition-colors">Documentation</a></li>
              <li><a href="#faq" className="hover:text-teal-600 transition-colors">Hardware Compatibility</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a></li>
              <li><a href="mailto:support@qweble.com" className="hover:text-teal-600 transition-colors">support@qweble.com</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <p>© {new Date().getFullYear()} QWeble Inc. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemo, onOpenContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'py-3' : 'py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className={`clay-pill px-5 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
        }`}>
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-1.5 shadow-md flex items-center justify-center transition-transform group-hover:scale-105">
              <img src={logoImg} alt="QWeble Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                QWeble<span className="text-teal-500">.</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Offline-First POS
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Features
            </a>
            <a href="#interactive-demo" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Live POS Demo
            </a>
            <a href="#kds" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Kitchen KDS
            </a>
            <a href="#cloud-sync" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Cloud Sync
            </a>
            <a href="#website-development" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Websites
            </a>
            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-teal-600 transition-colors">
              FAQs
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenDemo}
              className="clay-btn-secondary px-5 py-2 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Try Demo</span>
            </button>
            <button
              onClick={onOpenContact}
              className="clay-btn-primary px-5 py-2 text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 clay-card p-6 flex flex-col gap-4 bg-white/95 backdrop-blur-md shadow-2xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600"
            >
              Features
            </a>
            <a 
              href="#interactive-demo" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Live POS Demo
            </a>
            <a 
              href="#kds" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600"
            >
              Kitchen KDS
            </a>
            <a 
              href="#cloud-sync" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600"
            >
              Cloud Sync
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-bold text-slate-700 hover:text-teal-600"
            >
              FAQs
            </a>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenDemo(); }}
                className="clay-btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Try Live Demo</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenContact(); }}
                className="clay-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

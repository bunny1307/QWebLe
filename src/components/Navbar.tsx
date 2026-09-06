import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, Globe } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface NavbarProps {
  currentView: 'home' | 'webdev';
  onNavigate: (view: 'home' | 'webdev', sectionId?: string) => void;
  onOpenDemo: () => void;
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenDemo, onOpenContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('interactive-demo');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (currentView === 'webdev') {
        setActiveSection('webdev');
        return;
      }

      // Sections in vertical scroll order from top to bottom
      const sections = ['interactive-demo', 'features', 'kds', 'cloud-sync', 'pricing', 'faq'];
      
      // Near top of page
      if (window.scrollY < 120) {
        setActiveSection('interactive-demo');
        return;
      }

      // Bottom-up check using getBoundingClientRect() to accurately identify active section
      let current = 'interactive-demo';
      for (let i = sections.length - 1; i >= 0; i--) {
        const id = sections[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Element has reached within view threshold
          if (rect.top <= 280) {
            current = id;
            break;
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'webdev') {
      setActiveSection('webdev');
    }
  }, [currentView]);

  const handleLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (currentView !== 'home') {
      onNavigate('home', sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        const yOffset = -90;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const handleWebDevClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate('webdev');
  };

  const navItemClass = (id: string) => {
    const isActive = currentView === 'home' && activeSection === id;
    return `text-xs sm:text-sm font-bold transition-all px-3 py-1.5 rounded-full cursor-pointer whitespace-nowrap ${
      isActive
        ? 'bg-teal-500 text-white shadow-sm scale-105'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
    }`;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'py-2 sm:py-3' : 'py-4 sm:py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glassmorphic Navbar Container */}
        <nav className={`px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between rounded-full transition-all duration-300 ${
          scrolled ? 'glass-nav-bar-scrolled' : 'glass-nav-bar'
        }`}>
          {/* Logo with clean white background */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group text-left cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 p-1.5 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
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
          </button>

          {/* Desktop Nav Links in Exact Vertical Scroll Order */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            <button
              onClick={(e) => handleLinkClick(e, 'interactive-demo')}
              className={navItemClass('interactive-demo')}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Live Demo
              </span>
            </button>
            <button
              onClick={(e) => handleLinkClick(e, 'features')}
              className={navItemClass('features')}
            >
              Features
            </button>
            <button
              onClick={(e) => handleLinkClick(e, 'kds')}
              className={navItemClass('kds')}
            >
              Kitchen KDS
            </button>
            <button
              onClick={(e) => handleLinkClick(e, 'cloud-sync')}
              className={navItemClass('cloud-sync')}
            >
              Cloud Sync
            </button>
            <button
              onClick={(e) => handleLinkClick(e, 'pricing')}
              className={navItemClass('pricing')}
            >
              Pricing
            </button>
            <button
              onClick={handleWebDevClick}
              className={`text-xs sm:text-sm font-bold transition-all px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                currentView === 'webdev'
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/70'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Websites</span>
            </button>
            <button
              onClick={(e) => handleLinkClick(e, 'faq')}
              className={navItemClass('faq')}
            >
              FAQs
            </button>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenDemo}
              className="clay-btn-secondary px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Try Demo</span>
            </button>
            <button
              onClick={onOpenContact}
              className="clay-btn-primary px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown in Exact Vertical Scroll Order */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 p-5 flex flex-col gap-3 rounded-2xl glass-nav-bar-scrolled shadow-2xl">
            <button 
              onClick={(e) => handleLinkClick(e, 'interactive-demo')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Live POS Demo
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, 'features')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600"
            >
              Features
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, 'kds')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600"
            >
              Kitchen KDS
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, 'cloud-sync')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600"
            >
              Cloud Sync
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, 'pricing')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600"
            >
              Pricing
            </button>
            <button 
              onClick={handleWebDevClick}
              className="text-left py-1 text-sm font-bold text-indigo-600 flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Custom Website Development</span>
            </button>
            <button 
              onClick={(e) => handleLinkClick(e, 'faq')}
              className="text-left py-1 text-sm font-bold text-slate-700 hover:text-teal-600"
            >
              FAQs
            </button>

            <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenDemo(); }}
                className="clay-btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Try Demo
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenContact(); }}
                className="clay-btn-primary w-full py-2.5 text-xs font-bold"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

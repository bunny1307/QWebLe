import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InteractiveDemo } from './components/InteractiveDemo';
import { FeaturesSection } from './components/FeaturesSection';
import { ArchitectureShowcase } from './components/ArchitectureShowcase';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { CoffeeBrewerWidget } from './components/CoffeeBrewerWidget';
import { WebDevPage } from './pages/WebDevPage';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'webdev'>('home');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro');

  useEffect(() => {
    // Listen to hash changes for direct linking (#websites / #home)
    const checkHash = () => {
      if (window.location.hash === '#websites' || window.location.hash === '#website-development') {
        setCurrentView('webdev');
      } else {
        setCurrentView('home');
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleNavigate = (view: 'home' | 'webdev', sectionId?: string) => {
    setCurrentView(view);
    if (view === 'webdev') {
      window.location.hash = '#websites';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = '';
      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleOpenDemo = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('interactive-demo');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('interactive-demo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (plan?: string) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    setIsContactOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-slate-900 selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
      {/* Full-Height Left Section: Coffee Brewer on Home View */}
      {currentView === 'home' && <CoffeeBrewerWidget />}

      {/* Main Content Layout */}
      <div className={`relative z-10 transition-all ${currentView === 'home' ? 'pl-0 md:pl-28 lg:pl-32' : 'pl-0'}`}>
        {/* Glassmorphic Navbar with Active Section Tracker */}
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenDemo={handleOpenDemo}
          onOpenContact={() => setIsContactOpen(true)}
        />

        {currentView === 'webdev' ? (
          /* Dedicated Web Development Page (Cyber-Clay Aesthetic) */
          <WebDevPage
            onBackToHome={() => handleNavigate('home')}
            onOpenContact={handleSelectPlan}
          />
        ) : (
          /* Main POS Landing Page */
          <>
            <HeroSection
              onOpenDemo={handleOpenDemo}
              onOpenContact={() => setIsContactOpen(true)}
            />

            <InteractiveDemo />

            <FeaturesSection />

            <ArchitectureShowcase />

            <PricingSection onSelectPlan={handleSelectPlan} />

            <FaqSection />
          </>
        )}

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Contact / Plan Request Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
}

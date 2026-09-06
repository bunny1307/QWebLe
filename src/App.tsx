import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InteractiveDemo } from './components/InteractiveDemo';
import { FeaturesSection } from './components/FeaturesSection';
import { ArchitectureShowcase } from './components/ArchitectureShowcase';
import { WebsiteDevSection } from './components/WebsiteDevSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { CoffeeBrewerWidget } from './components/CoffeeBrewerWidget';

export function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Pro');

  const handleOpenDemo = () => {
    const el = document.getElementById('interactive-demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
      {/* Full-Height Left Section: Coffee Machine (Top) -> Pour Stream -> Cup (Bottom) */}
      <CoffeeBrewerWidget />

      {/* Main Content Layout with Left Offset so it never collides with the Brewer */}
      <div className="relative z-10 pl-0 md:pl-28 lg:pl-32 transition-all">
        {/* Navigation */}
        <Navbar
          onOpenDemo={handleOpenDemo}
          onOpenContact={() => setIsContactOpen(true)}
        />

        {/* Hero Section */}
        <HeroSection
          onOpenDemo={handleOpenDemo}
          onOpenContact={() => setIsContactOpen(true)}
        />

        {/* Live Interactive POS Kiosk Demo */}
        <InteractiveDemo />

        {/* Core Features Bento Grid */}
        <FeaturesSection />

        {/* Architecture Breakdown */}
        <ArchitectureShowcase />

        {/* Pricing Tiers */}
        {/* Custom Website Development & Maintenance */}
        <WebsiteDevSection onOpenContact={handleSelectPlan} />

        {/* Pricing Tiers */}
        <PricingSection onSelectPlan={handleSelectPlan} />

        {/* FAQs */}
        <FaqSection />

        {/* Footer */}
        <Footer />
      </div>

      {/* Contact / Onboarding Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
}

export default App;

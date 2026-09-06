import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'What happens when the restaurant internet disconnects?',
    a: 'Nothing stops. QWeble operates 100% on your local LAN with its embedded SQLite database. Customer touch kiosks take orders, kitchen displays show tickets, and tokens print instantly. As soon as the internet returns, QWeble silently syncs all transactions to the cloud in the background.',
  },
  {
    q: 'Do I need expensive proprietary POS terminals or iPad stands?',
    a: 'No. QWeble is hardware-agnostic. You can run the cashier admin on any Windows PC or laptop, and run the customer self-ordering kiosk on any tablet, touchscreen monitor, or iPad using modern browser lockdown mode.',
  },
  {
    q: 'How does UPI payment verification work if the internet is down?',
    a: 'When offline, QWeble automatically switches to Cash & Counter Payment mode so you never accept unverified digital payments. When online, customers scan dynamic Razorpay QR codes with instant webhook signature validation.',
  },
  {
    q: 'Can I connect multiple kitchen screens and customer kiosks?',
    a: 'Yes. With the Cloud Sync plan, you can pair multiple customer kiosks and chef screens over your local Wi-Fi router in seconds using intuitive 6-digit screen pairing codes.',
  },
  {
    q: 'How do I export sales data for accounting and GST filing?',
    a: 'The admin portal includes a 1-click comprehensive PDF business report generator detailing daily tokens, GST breakdown, payment method distribution, and itemized sales.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-slate-700 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Everything You Need To Know
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="clay-card p-5 sm:p-6 bg-white cursor-pointer transition-all"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {faq.q}
                  </h3>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-teal-100 text-teal-700' : 'text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {isOpen && (
                  <p className="mt-4 text-sm sm:text-base text-slate-600 font-medium leading-relaxed pt-3 border-t border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

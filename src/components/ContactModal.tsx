import React, { useState } from 'react';
import { X, CheckCircle2, Send, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, defaultPlan }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    restaurant: '',
    phone: '',
    email: '',
    outlets: '1',
    plan: defaultPlan || 'Cloud Sync',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="clay-card p-6 sm:p-8 bg-white max-w-lg w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Request Received!</h3>
            <p className="text-sm font-medium text-slate-600 mb-6">
              Our restaurant implementation team will reach out to <strong>{formData.phone}</strong> within 1 hour to set up your free trial.
            </p>
            <button
              onClick={() => { setSubmitted(false); onClose(); }}
              className="clay-btn-primary px-8 py-3 text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 p-1.5 flex items-center justify-center shrink-0">
                <img src={logoImg} alt="QWeble" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Get Started with QWeble</h3>
                <p className="text-xs text-slate-500 font-medium">Zero-downtime setup for your restaurant</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Vikram Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="clay-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Restaurant Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Chai & Bites"
                    value={formData.restaurant}
                    onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                    className="clay-input w-full px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="clay-input w-full px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Number of Outlets</label>
                  <select
                    value={formData.outlets}
                    onChange={(e) => setFormData({ ...formData, outlets: e.target.value })}
                    className="clay-input w-full px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="1">1 Outlet</option>
                    <option value="2-5">2 - 5 Outlets</option>
                    <option value="6+">6+ Outlets / Franchise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selected Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    className="clay-input w-full px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="Base Tier">Base Tier</option>
                    <option value="Cloud Sync">Cloud Sync (Recommended)</option>
                    <option value="AI Analytics">AI Analytics</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="clay-btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Request Instant Setup</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

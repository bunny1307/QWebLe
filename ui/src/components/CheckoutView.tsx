import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, RestaurantInfo } from '../types';
import { calculateTotals } from '../utils';
import { ArrowLeft, ChevronRight, ReceiptText, Smartphone, Banknote, AlertCircle, X } from 'lucide-react';

interface CheckoutViewProps {
  cartItems: CartItem[];
  restaurant: RestaurantInfo;
  onBackToCart: () => void;
  onUPIPayment: (customerName?: string) => Promise<void>;
  onCashPayment: (customerName?: string) => Promise<void>;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  restaurant,
  onBackToCart,
  onUPIPayment,
  onCashPayment,
}) => {
  const currency = restaurant.currencySymbol || '₹';
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState<'upi' | 'cash' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.food.price * item.quantity,
    0
  );
  const taxPercentage = restaurant.taxPercentage || 0;
  const { tax, total } = calculateTotals(subtotal, taxPercentage);

  const handleUPI = async () => {
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting('upi');
    try {
      await onUPIPayment(customerName.trim() || undefined);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'UPI payment failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCash = async () => {
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting('cash');
    try {
      await onCashPayment(customerName.trim() || undefined);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToCart}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-900 px-4 py-2.5 rounded-xl font-semibold text-base cursor-pointer active:scale-95 transition-all border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span>BACK TO CART</span>
        </button>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          REVIEW ORDER
        </h2>
        <div className="w-24 hidden sm:block" />
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-5 py-4 text-sm font-medium"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="shrink-0 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-[#FF4F18]" />
              <span>Order Details</span>
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Review your order before choosing a payment method.
            </p>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.food.id} className="flex justify-between gap-4 border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-bold text-slate-900">{item.food.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × {currency}{item.food.price.toFixed(2)}</p>
                  </div>
                  <p className="font-mono font-bold text-slate-900">{currency}{(item.food.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Customer Name / Table No. <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul / Table 04"
              maxLength={120}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base text-slate-900 focus:outline-none focus:border-[#FF4F18] focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6 sticky top-6">
            <h3 className="text-base font-bold text-orange-400 border-b border-slate-800 pb-3 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="font-mono text-white">{currency}{subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>GST ({taxPercentage}%)</span>
                  <span className="font-mono text-white">{currency}{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-3 flex justify-between text-xl font-bold text-white">
                <span>Total Amount</span>
                <span className="font-mono text-[#FF4F18] text-2xl">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* ---- Payment Method ---- */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Choose Payment Method
              </p>

              {/* UPI Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={submitting !== null}
                onClick={handleUPI}
                className="w-full bg-[#FF4F18] hover:bg-[#e03e0d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg text-base flex items-center justify-center gap-3 cursor-pointer transition-all"
              >
                <Smartphone className="w-5 h-5 shrink-0 stroke-[2.5]" />
                <span>
                  {submitting === 'upi' ? 'OPENING PAYMENT...' : `PAY ${currency}${total.toFixed(2)} VIA UPI`}
                </span>
                {submitting !== 'upi' && <ChevronRight className="w-5 h-5 stroke-[2.5] ml-auto" />}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-gray-500 font-semibold">OR</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Cash Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={submitting !== null}
                onClick={handleCash}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-3 cursor-pointer transition-all border border-slate-600"
              >
                <Banknote className="w-5 h-5 shrink-0 stroke-[2]" />
                <span>
                  {submitting === 'cash' ? 'PLACING ORDER...' : 'PAY WITH CASH'}
                </span>
                {submitting !== 'cash' && <ChevronRight className="w-5 h-5 stroke-[2.5] ml-auto" />}
              </motion.button>

              <p className="text-xs text-center text-gray-500 pt-1">
                Cash: pay at the counter · UPI: pay now via Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

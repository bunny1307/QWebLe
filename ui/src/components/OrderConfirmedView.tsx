import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RefreshCw, Utensils, BadgeCheck, Banknote } from 'lucide-react';
import { PreparedOrder, RestaurantInfo } from '../types';

interface Props {
  order: PreparedOrder;
  restaurant: RestaurantInfo;
  onNewOrder: () => void;
}

export const OrderConfirmedView: React.FC<Props> = ({ order, restaurant, onNewOrder }) => {
  const currency = restaurant.currencySymbol || '₹';
  const isUPI = order.payment_mode === 'UPI';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 sm:p-8 text-center shadow-xs border border-gray-200"
      >
        {/* Success icon */}
        <div className={`w-20 h-20 ${isUPI ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-orange-50 text-orange-500 border-orange-200'} rounded-full flex items-center justify-center mx-auto mb-5 border`}>
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isUPI ? 'PAYMENT SUCCESSFUL!' : 'ORDER PLACED'}
        </h2>
        <p className="text-gray-500 text-base sm:text-lg mt-2 font-medium">
          {isUPI
            ? 'Your UPI payment was confirmed.'
            : `Your order has been sent to ${restaurant.name}.`}
        </p>

        {/* Token card */}
        <div className="bg-slate-900 text-white p-7 rounded-3xl max-w-sm mx-auto mt-7 shadow-md">
          <p className="text-xs font-mono uppercase text-orange-400 tracking-widest font-bold">
            YOUR TOKEN NUMBER
          </p>
          <p className="text-6xl font-extrabold font-mono text-[#FF4F18] tracking-widest my-3">
            #{order.token_number}
          </p>
          <p className="text-sm text-gray-300 font-medium">
            {isUPI
              ? <>Payment of <strong className="text-white">{currency}{order.total.toFixed(2)}</strong> received. Keep this token.</>
              : <>Please pay <strong className="text-white">{currency}{order.total.toFixed(2)}</strong> at the restaurant counter and keep this token.</>
            }
          </p>
        </div>

        {/* Status badge */}
        <div className={`mt-6 p-4 ${isUPI ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-orange-50 border-orange-200 text-orange-950'} border rounded-2xl text-sm font-medium flex items-center justify-center gap-2`}>
          {isUPI ? (
            <>
              <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Paid via UPI · Your order is already in the kitchen queue!</span>
            </>
          ) : (
            <>
              <Banknote className="w-5 h-5 text-[#FF4F18] shrink-0" />
              <span>Cash payment · Staff will prepare your order once payment is collected.</span>
            </>
          )}
        </div>

        {/* Payment mode tag */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isUPI ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {isUPI ? <BadgeCheck className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
            {isUPI ? 'UPI PAID' : 'CASH ON COUNTER'}
          </span>
        </div>

        {/* Order summary */}
        <div className="mt-6 text-left bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <h3 className="font-bold text-slate-900 mb-3">Order summary</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.item_id} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-700">{item.quantity} × {item.item_name}</span>
                <span className="font-mono font-bold text-slate-900">{currency}{item.line_total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between font-extrabold">
            <span>Total</span>
            <span className="font-mono text-[#FF4F18]">{currency}{order.total.toFixed(2)}</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onNewOrder}
          className="w-full mt-7 bg-[#FF4F18] hover:bg-[#e03e0d] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md text-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          START NEW ORDER
        </motion.button>
      </motion.div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { CartItem, RestaurantInfo } from '../types';
import { calculateTotals } from '../utils';
import { Plus, Minus, Trash2, ArrowLeft, ShoppingCart, ArrowRight } from 'lucide-react';

interface CartViewProps {
  cartItems: CartItem[];
  restaurant: RestaurantInfo;
  onUpdateQuantity: (foodId: string, newQuantity: number) => void;
  onClearCart: () => void;
  onBackToMenu: () => void;
  onProceedToCheckout: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cartItems,
  restaurant,
  onUpdateQuantity,
  onClearCart,
  onBackToMenu,
  onProceedToCheckout,
}) => {
  const currency = restaurant.currencySymbol || '₹';

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.food.price * item.quantity,
    0
  );

  const taxPercentage = restaurant.taxPercentage || 0;
  const { tax, total } = calculateTotals(subtotal, taxPercentage);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
      {/* Top Navigation & Title */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToMenu}
          id="cart-back-to-menu-btn"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-900 px-4 py-2.5 rounded-xl font-semibold text-base cursor-pointer active:scale-95 transition-all border border-gray-200"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span>BACK TO MENU</span>
        </button>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShoppingCart className="w-7 h-7 text-[#FF4F18]" />
          <span>YOUR ORDER CART</span>
        </h2>

        {cartItems.length > 0 ? (
          <button
            onClick={onClearCart}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        ) : (
          <div className="w-24" />
        )}
      </div>

      {cartItems.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center my-8 shadow-xs max-w-lg mx-auto">
          <div className="w-20 h-20 bg-orange-50 text-[#FF4F18] rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h3>
          <p className="text-gray-500 text-base mt-2 mb-8">
            You have not added any food items yet. Go back to categories to select delicious items!
          </p>
          <button
            onClick={onBackToMenu}
            id="empty-cart-back-btn"
            className="w-full bg-[#FF4F18] hover:bg-[#e03e0d] text-white font-bold py-4 px-6 rounded-2xl shadow-md text-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>EXPLORE MENU & ADD FOOD</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Cart Content Table / List */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Header row */}
            <div className="bg-slate-900 text-gray-300 text-xs font-semibold uppercase tracking-wider px-6 py-3.5 flex justify-between">
              <span>Item & Quantity</span>
              <span>Total Price</span>
            </div>

            {/* List of items */}
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => {
                const itemSubtotal = item.food.price * item.quantity;

                return (
                  <div
                    key={item.food.id}
                    id={`cart-item-row-${item.food.id}`}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Food Info */}
                    <div className="flex items-center gap-4">
                      <img
                        src={item.food.image}
                        alt={item.food.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-gray-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 leading-tight">
                          {item.food.name}
                        </h4>
                        <p className="text-sm font-semibold text-gray-500 mt-1 font-mono">
                          {currency}{item.food.price} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls & Row Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {/* Touch Quantity Stepper */}
                      <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() =>
                            onUpdateQuantity(item.food.id, item.quantity - 1)
                          }
                          id={`cart-decrement-${item.food.id}`}
                          className="w-10 h-10 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-lg flex items-center justify-center shadow-xs border border-gray-200 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-5 h-5 stroke-[2.5]" />
                        </motion.button>

                        <span className="w-12 text-center text-lg font-bold font-mono text-slate-900">
                          {item.quantity}
                        </span>

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() =>
                            onUpdateQuantity(item.food.id, item.quantity + 1)
                          }
                          id={`cart-increment-${item.food.id}`}
                          className="w-10 h-10 bg-[#FF4F18] hover:bg-[#e03e0d] text-white font-bold rounded-lg flex items-center justify-center shadow-xs cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </motion.button>
                      </div>

                      {/* Row Subtotal */}
                      <div className="text-right min-w-24">
                        <span className="text-xl font-extrabold text-slate-900 font-mono">
                          {currency}{itemSubtotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Bill Calculation Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
            <h3 className="text-sm font-semibold text-orange-400 border-b border-slate-800 pb-3 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex justify-between text-gray-300">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-white">{currency}{subtotal}</span>
              </div>

              {tax > 0 && (
                <div className="flex justify-between text-gray-300">
                  <span>GST / Taxes ({taxPercentage}%)</span>
                  <span className="font-mono font-bold text-white">{currency}{tax}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between text-xl font-bold text-white">
                <span>Total Amount Payable</span>
                <span className="font-mono text-[#FF4F18] text-2xl">{currency}{total}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onBackToMenu}
                className="w-full bg-slate-800 hover:bg-slate-700 text-gray-200 font-semibold py-4 rounded-2xl border border-slate-700 text-center cursor-pointer transition-all active:scale-98"
              >
                + Add More Items
              </button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onProceedToCheckout}
                id="proceed-to-checkout-btn"
                className="w-full bg-[#FF4F18] hover:bg-[#e03e0d] active:bg-[#c63409] text-white font-bold py-4 px-6 rounded-2xl shadow-md text-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

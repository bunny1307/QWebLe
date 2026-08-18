import React from 'react';
import { motion } from 'motion/react';
import { CartItem, RestaurantInfo } from '../types';
import { calculateTotals } from '../utils';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, UtensilsCrossed } from 'lucide-react';

interface CartSidebarProps {
  cartItems: CartItem[];
  restaurant: RestaurantInfo;
  onUpdateQuantity: (foodId: string, newQuantity: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  isCheckoutDisabled?: boolean;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cartItems,
  restaurant,
  onUpdateQuantity,
  onClearCart,
  onProceedToCheckout,
  isCheckoutDisabled = false,
}) => {
  const currency = restaurant.currencySymbol || '₹';

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.food.price * item.quantity,
    0
  );
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const taxPercentage = restaurant.taxPercentage || 0;
  const { tax, total } = calculateTotals(subtotal, taxPercentage);

  return (
    <aside
      id="persistent-cart-sidebar"
      className="bg-white border-l border-gray-200 w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col h-full min-h-[600px] shadow-sm select-none"
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF4F18] text-white flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-none">My Order</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Current Selection
            </p>
          </div>
        </div>

        {/* Item Count Badge (0 by default) */}
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 text-white font-mono text-xs font-bold px-3 py-1 rounded-full">
            {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
          </span>
          {totalItemCount > 0 && (
            <button
              onClick={onClearCart}
              title="Clear all items"
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              aria-label="Clear cart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List or Empty State */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100">
        {cartItems.length === 0 ? (
          /* Default 0 Items Empty State */
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Your Cart is Empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
              Tap food items on the left menu to add them to your order.
            </p>
          </div>
        ) : (
          /* Added Items List */
          cartItems.map((item) => {
            const itemPriceTotal = item.food.price * item.quantity;

            return (
              <div
                key={item.food.id}
                id={`sidebar-cart-item-${item.food.id}`}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3"
              >
                {/* Item Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.food.image ? (
                    <img
                      src={item.food.image}
                      alt={item.food.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border border-gray-200 shrink-0 bg-slate-50 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate leading-snug">
                      {item.food.name}
                    </h4>
                    <span className="text-xs font-semibold text-gray-500 font-mono">
                      {currency}{item.food.price} each
                    </span>
                  </div>
                </div>

                {/* Inline Stepper Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-0.5">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() =>
                        onUpdateQuantity(item.food.id, item.quantity - 1)
                      }
                      id={`sidebar-cart-decrement-${item.food.id}`}
                      className="w-7 h-7 bg-white text-slate-700 hover:text-rose-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border border-gray-200 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </motion.button>

                    <span className="w-7 text-center text-xs font-bold font-mono text-slate-900">
                      {item.quantity}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() =>
                        onUpdateQuantity(item.food.id, item.quantity + 1)
                      }
                      id={`sidebar-cart-increment-${item.food.id}`}
                      className="w-7 h-7 bg-[#FF4F18] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </motion.button>
                  </div>

                  {/* Subtotal */}
                  <span className="text-sm font-extrabold text-slate-900 font-mono w-14 text-right">
                    {currency}{itemPriceTotal}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Summary & Checkout */}
      <div className="p-5 border-t border-gray-200 bg-slate-900 text-white space-y-3 mt-auto">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono text-white font-bold">{currency}{subtotal}</span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>GST ({taxPercentage}%)</span>
              <span className="font-mono text-white font-bold">{currency}{tax}</span>
            </div>
          )}

          <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-extrabold text-white">
            <span>Total Payable</span>
            <span className="font-mono text-[#FF4F18] text-xl">{currency}{total}</span>
          </div>
        </div>

        {/* Direct Checkout Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={cartItems.length === 0 || isCheckoutDisabled}
          onClick={onProceedToCheckout}
          id="sidebar-checkout-button"
          className="w-full bg-[#FF4F18] hover:bg-[#e03e0d] active:bg-[#c63409] disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {cartItems.length === 0 ? (
            <span>CART IS EMPTY</span>
          ) : (
            <>
              <span>CHECKOUT ({currency}{total})</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, RotateCcw, Smartphone, Banknote, Sparkles, Plus, Minus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  isVeg: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Classic Smash Burger', price: 140, category: 'Mains', emoji: '🍔', isVeg: false },
  { id: '2', name: 'Crispy Peri Peri Fries', price: 90, category: 'Sides', emoji: '🍟', isVeg: true },
  { id: '3', name: 'Belgian Choco Shake', price: 110, category: 'Beverages', emoji: '🥤', isVeg: true },
  { id: '4', name: 'Paneer Tikka Roll', price: 130, category: 'Mains', emoji: '🌯', isVeg: true },
  { id: '5', name: 'Cheesy Garlic Bread', price: 95, category: 'Sides', emoji: '🧀', isVeg: true },
  { id: '6', name: 'Iced Caramel Cold Brew', price: 105, category: 'Beverages', emoji: '☕', isVeg: true },
];

export const InteractiveDemo: React.FC = () => {
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([
    { item: MENU_ITEMS[0], quantity: 1 },
    { item: MENU_ITEMS[1], quantity: 1 },
  ]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [tokenPlaced, setTokenPlaced] = useState<number | null>(null);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { item: MenuItem; quantity: number }[]
    );
  };

  const subtotal = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const newToken = Math.floor(Math.random() * 80) + 20;
    setTokenPlaced(newToken);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00B894', '#FF6B4A', '#FFC048', '#6C5CE7'],
      });
    } catch {
      // ignore
    }
  };

  const resetOrder = () => {
    setTokenPlaced(null);
    setCart([
      { item: MENU_ITEMS[0], quantity: 1 },
      { item: MENU_ITEMS[1], quantity: 1 },
    ]);
  };

  return (
    <section id="interactive-demo" className="py-20 bg-gradient-to-b from-transparent via-[#F1F5F9] to-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill text-xs font-bold text-teal-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            Interactive Touch Simulator
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Experience the Kiosk. Test It Live.
          </h2>
          <p className="text-slate-600 font-medium text-base">
            Click food items below, toggle payment methods, and place an order. See how QWeble generates tokens in under <strong>15 milliseconds</strong>.
          </p>
        </div>

        {/* The Clay POS Terminal */}
        <div className="max-w-4xl mx-auto clay-card p-4 sm:p-8 bg-white/90 backdrop-blur-md relative border-2 border-white">
          {/* Terminal Top Bar */}
          <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
              <div>
                <span className="font-black text-sm text-slate-900">QWeble Kiosk Terminal #01</span>
                <span className="text-xs text-slate-400 block font-medium">Local SQLite Engine · Active</span>
              </div>
            </div>

            {/* Offline Simulation Switch */}
            <div className="flex items-center gap-3 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/60">
              <span className="text-xs font-bold text-slate-600">Simulate Internet:</span>
              <button
                onClick={() => setIsSimulatingOffline(!isSimulatingOffline)}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isSimulatingOffline
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {isSimulatingOffline ? '● OFFLINE' : '● ONLINE'}
              </button>
            </div>
          </div>

          {tokenPlaced ? (
            /* Order Success Receipt Screen */
            <div className="py-12 px-6 text-center max-w-md mx-auto clay-card-tinted p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">Order Sent to Kitchen!</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                {isSimulatingOffline ? 'Saved locally (Will sync to cloud when online)' : 'Synced with Cloud Dashboard'}
              </p>

              {/* Huge Token Badge */}
              <div className="clay-card p-6 bg-white mb-6 border-2 border-dashed border-teal-200">
                <span className="text-xs font-bold text-slate-400 uppercase">Your Token Number</span>
                <div className="text-5xl font-black text-teal-600 my-2">#{tokenPlaced}</div>
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-semibold">
                  <span>Payment Mode</span>
                  <span className="font-bold text-slate-800">{paymentMode}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1 font-semibold">
                  <span>Total Paid</span>
                  <span className="font-bold text-slate-800">₹{total}.00</span>
                </div>
              </div>

              <button
                onClick={resetOrder}
                className="clay-btn-secondary w-full py-3.5 text-sm flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Place Another Test Order</span>
              </button>
            </div>
          ) : (
            /* Menu + Cart 2-Column Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Menu Grid (7 cols) */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-extrabold text-sm text-slate-900">Select Items</h4>
                  <span className="text-xs font-semibold text-slate-400">Click to add</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="clay-card p-3 text-left hover:scale-[1.03] transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-bold text-slate-400">{item.category}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs font-extrabold text-teal-600 mt-1.5">₹{item.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart / Checkout Panel (5 cols) */}
              <div className="lg:col-span-5 clay-card-tinted p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3">
                    <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                      <ShoppingBag className="w-4 h-4 text-teal-600" />
                      <span>Order Cart</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{cart.length} items</span>
                  </div>

                  {/* Cart Items List */}
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Cart is empty. Tap menu items to add.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {cart.map(({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs shadow-sm border border-white"
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.emoji}</span>
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <p className="text-slate-400 font-medium">₹{item.price} each</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-slate-900 w-4 text-center">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals & Payment Action */}
                <div className="pt-4 border-t border-slate-200/70 mt-4">
                  {/* Payment Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => setPaymentMode('UPI')}
                      className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMode === 'UPI'
                          ? 'clay-btn-primary'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Pay via UPI</span>
                    </button>
                    <button
                      onClick={() => setPaymentMode('CASH')}
                      className={`py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMode === 'CASH'
                          ? 'clay-btn-primary'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash Counter</span>
                    </button>
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-1 text-xs mb-3 text-slate-600 font-semibold">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span>₹{tax}.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="text-teal-600">₹{total}.00</span>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    disabled={cart.length === 0}
                    onClick={handlePlaceOrder}
                    className="clay-btn-coral w-full py-3 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-extrabold"
                  >
                    <span>Instant Token Print</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RestaurantData, Category, FoodItem, CartItem, ScreenType, PreparedOrder } from './types';
import { fetchDBData } from './data/restaurantData';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { FoodGrid } from './components/FoodGrid';
import { CheckoutView } from './components/CheckoutView';
import { CartSidebar } from './components/CartSidebar';
import { OrderConfirmedView } from './components/OrderConfirmedView';

// ── Razorpay SDK type shim ──────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (resp: unknown) => void) => void;
    };
  }
}

// ── Load Razorpay checkout script once ──────────────────────
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
    document.head.appendChild(script);
  });
}

export default function App() {
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('CATEGORY_PAGE');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null);

  // Keep a ref so Razorpay callbacks can always access latest cart
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        const data = await fetchDBData();
        if (!cancelled) setRestaurantData(data);
      } catch (error) {
        if (!cancelled) {
          setRestaurantData(null);
          setDataError(error instanceof Error ? error.message : 'Failed to load restaurant data.');
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (cartRef.current.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleAddToCart = useCallback((food: FoodItem) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.food.id === food.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + 1 };
        return next;
      }
      return [...prev, { food, quantity: 1 }];
    });
  }, []);

  const handleUpdateQuantity = useCallback((foodId: string, quantity: number) => {
    setCart((prev) => quantity <= 0
      ? prev.filter((item) => item.food.id !== foodId)
      : prev.map((item) => item.food.id === foodId ? { ...item, quantity } : item));
  }, []);

  const handleSelectCategory = useCallback((category: Category) => {
    setSelectedCategory(category);
    setCurrentScreen('FOOD_PAGE');
  }, []);

  const handleProceedToCheckout = () => {
    if (cart.length) setCurrentScreen('CHECKOUT_PAGE');
  };

  // ── CASH PAYMENT ─────────────────────────────────────────────
  const handleCashPayment = async (customerName?: string) => {
    if (!cart.length) return;

    const response = await fetch('/api/orders/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((item) => ({ item_id: item.food.id, quantity: item.quantity })),
        customer_name: customerName || null,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data?.error?.message || 'Unable to place order.');
    }

    // Cash orders go to admin — inject payment_mode so confirmation screen knows
    const order: PreparedOrder = { ...data.order, payment_mode: 'CASH' };
    setPreparedOrder(order);
    setCurrentScreen('ORDER_CONFIRMED');
    setCart([]);
  };

  // ── UPI / RAZORPAY PAYMENT ────────────────────────────────────
  const handleUPIPayment = async (customerName?: string) => {
    if (!cart.length) return;

    // 1. Load Razorpay SDK
    await loadRazorpayScript();

    // 2. Create a Razorpay order on our server
    const createResp = await fetch('/api/orders/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((item) => ({ item_id: item.food.id, quantity: item.quantity })),
        customer_name: customerName || null,
      }),
    });

    const createData = await createResp.json();
    if (!createResp.ok || !createData.ok) {
      throw new Error(createData?.error?.message || 'Unable to initiate payment.');
    }

    // 3. Open Razorpay checkout
    await new Promise<void>((resolve, reject) => {
      const options: Record<string, unknown> = {
        key: createData.key_id,
        amount: Math.round(createData.total * 100),   // paise
        currency: 'INR',
        name: restaurantData?.restaurant?.name || 'Restaurant',
        description: 'Food Order',
        order_id: createData.razorpay_order_id,
        prefill: {
          name: customerName || '',
        },
        theme: { color: '#FF4F18' },
        modal: { ondismiss: () => reject(new Error('Payment cancelled by user.')) },

        // ── Payment success ──────────────────────────────────
        handler: async (response: Record<string, string>) => {
          try {
            const verifyResp = await fetch('/api/orders/verify-upi-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: createData.order_id,
              }),
            });

            const verifyData = await verifyResp.json();
            if (!verifyResp.ok || !verifyData.ok) {
              reject(new Error(verifyData?.error?.message || 'Payment verification failed.'));
              return;
            }

            const order: PreparedOrder = { ...verifyData.order, payment_mode: 'UPI' };
            setPreparedOrder(order);
            setCurrentScreen('ORDER_CONFIRMED');
            setCart([]);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      // ── Modal dismissed without payment ─────────────────────
      rzp.on('payment.failed', (response: unknown) => {
        const msg =
          (response as { error?: { description?: string } })?.error?.description
          || 'Payment failed. Please try again.';
        reject(new Error(msg));
      });

      rzp.open();
    });
  };

  const handleStartNewOrder = () => {
    setCart([]);
    setPreparedOrder(null);
    setSelectedCategory(null);
    setCurrentScreen('CATEGORY_PAGE');
  };

  const handleBack = () => {
    if (currentScreen === 'FOOD_PAGE') {
      setSelectedCategory(null);
      setCurrentScreen('CATEGORY_PAGE');
    } else if (currentScreen === 'CHECKOUT_PAGE') {
      setCurrentScreen(selectedCategory ? 'FOOD_PAGE' : 'CATEGORY_PAGE');
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="text-2xl font-semibold">Loading restaurant...</div>
          <div className="mt-2 text-slate-500">Please wait</div>
        </div>
      </div>
    );
  }

  if (dataError || !restaurantData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-6">
        <div className="text-center max-w-md">
          <div className="text-2xl font-semibold">Restaurant data unavailable</div>
          <div className="mt-3 text-slate-500">{dataError || 'Unable to load restaurant data.'}</div>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  const canGoBack = currentScreen !== 'CATEGORY_PAGE' && currentScreen !== 'ORDER_CONFIRMED';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900 flex flex-col justify-between selection:bg-orange-200 selection:text-slate-900">
      <Header
        restaurant={restaurantData.restaurant}
        currentScreen={currentScreen}
        selectedCategoryName={selectedCategory?.name}
        onBack={handleBack}
        canGoBack={canGoBack}
      />

      <main className="grow flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto min-h-[calc(100vh-100px)]">
        <div className="flex-1 min-w-0 pb-12">
          {currentScreen === 'CATEGORY_PAGE' && (
            <CategoryList categories={restaurantData.categories} foods={restaurantData.foods} onSelectCategory={handleSelectCategory} />
          )}

          {currentScreen === 'FOOD_PAGE' && selectedCategory && (
            <FoodGrid
              category={selectedCategory}
              foods={restaurantData.foods}
              cartItems={cart}
              currencySymbol={restaurantData.restaurant.currencySymbol || '₹'}
              onBackToCategories={() => { setSelectedCategory(null); setCurrentScreen('CATEGORY_PAGE'); }}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          )}

          {currentScreen === 'CHECKOUT_PAGE' && (
            <CheckoutView
              cartItems={cart}
              restaurant={restaurantData.restaurant}
              onBackToCart={handleBack}
              onUPIPayment={handleUPIPayment}
              onCashPayment={handleCashPayment}
            />
          )}

          {currentScreen === 'ORDER_CONFIRMED' && preparedOrder && (
            <OrderConfirmedView
              order={preparedOrder}
              restaurant={restaurantData.restaurant}
              onNewOrder={handleStartNewOrder}
            />
          )}
        </div>

        {currentScreen !== 'ORDER_CONFIRMED' && (
          <CartSidebar
            cartItems={cart}
            restaurant={restaurantData.restaurant}
            onUpdateQuantity={handleUpdateQuantity}
            onClearCart={() => setCart([])}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}
      </main>
    </div>
  );
}

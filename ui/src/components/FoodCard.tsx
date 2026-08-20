import React from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, Ban, ShoppingBag } from 'lucide-react';
import { FoodItem } from '../types';

interface FoodCardProps {
  food: FoodItem;
  quantityInCart: number;
  currencySymbol: string;
  onAddToCart: (food: FoodItem) => void;
  onUpdateQuantity: (foodId: string, newQuantity: number) => void;
}

export const FoodCard: React.FC<FoodCardProps> = React.memo(({
  food,
  quantityInCart,
  currencySymbol,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const isAvailable = food.available !== false;
  const [imageError, setImageError] = React.useState(false);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(food.id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(food.id, quantityInCart - 1);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    onAddToCart(food);
  };

  return (
    <div
      id={`food-card-${food.id}`}
      className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
        !isAvailable
          ? 'border-gray-200 opacity-70 bg-gray-50'
          : quantityInCart > 0
          ? 'border-[#FF4F18] ring-2 ring-[#FF4F18]/15'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div>
        {/* Image & Badges */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {food.image && !imageError ? (
            <img
              src={food.image}
              alt={food.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                !isAvailable ? 'grayscale opacity-75' : 'hover:scale-105'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-slate-200" />
            </div>
          )}

          {/* Veg / Non-Veg Indicator */}
          {food.isVeg !== undefined && (
            <div
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-xs backdrop-blur-md ${
                food.isVeg
                  ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50/90 text-rose-800 border-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
              <span>{food.isVeg ? 'VEG' : 'NON-VEG'}</span>
            </div>
          )}

          {/* Calories badge */}
          {food.calories && (
            <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md">
              {food.calories}
            </div>
          )}

          {/* Unavailable Banner */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-rose-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md uppercase border border-rose-400">
                <Ban className="w-4 h-4" />
                <span>UNAVAILABLE</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {food.name}
            </h3>
            <span className="text-lg font-extrabold text-[#FF4F18] shrink-0 font-mono">
              {currencySymbol}{food.price}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
            {food.description}
          </p>
        </div>
      </div>

      {/* Action Footer: ADD TO CART vs QUANTITY CONTROLS */}
      <div className="p-5 pt-0 mt-auto">
        {!isAvailable ? (
          <button
            disabled
            className="w-full bg-gray-200 text-gray-400 py-3 rounded-2xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Ban className="w-4 h-4" />
            <span>Out of Stock</span>
          </button>
        ) : quantityInCart === 0 ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            id={`add-to-cart-btn-${food.id}`}
            className="w-full bg-[#FF4F18] hover:bg-[#e03e0d] active:bg-[#c63409] text-white font-bold py-3.5 px-4 rounded-2xl shadow-sm text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>ADD TO CART</span>
          </motion.button>
        ) : (
          <div className="flex items-center justify-between bg-orange-50/80 border-2 border-[#FF4F18] rounded-2xl p-1 shadow-xs">
            {/* Decrement Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleDecrement}
              id={`decrement-btn-${food.id}`}
              className="w-11 h-10 bg-white text-slate-800 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-xl flex items-center justify-center shadow-xs border border-gray-200 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
            </motion.button>

            {/* Quantity Display */}
            <div className="flex flex-col items-center justify-center px-3">
              <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">In Cart</span>
              <span className="text-lg font-black text-slate-900 font-mono leading-none">
                {quantityInCart}
              </span>
            </div>

            {/* Increment Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleIncrement}
              id={`increment-btn-${food.id}`}
              className="w-11 h-10 bg-[#FF4F18] hover:bg-[#e03e0d] text-white font-bold rounded-xl flex items-center justify-center shadow-xs cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
});

import React from 'react';
import { Category, FoodItem, CartItem } from '../types';
import { FoodCard } from './FoodCard';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';

interface FoodGridProps {
  category: Category;
  foods: FoodItem[];
  cartItems: CartItem[];
  currencySymbol: string;
  onBackToCategories: () => void;
  onAddToCart: (food: FoodItem) => void;
  onUpdateQuantity: (foodId: string, newQuantity: number) => void;
}

export const FoodGrid: React.FC<FoodGridProps> = React.memo(({
  category,
  foods,
  cartItems,
  currencySymbol,
  onBackToCategories,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const categoryFoods = foods.filter((f) => f.categoryId === category.id);

  const getCartQuantity = (foodId: string) => {
    const found = cartItems.find((item) => item.food.id === foodId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Category Header Banner */}
      <div className="bg-white border border-gray-200 p-5 sm:p-6 rounded-3xl shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToCategories}
            id="back-to-categories-btn"
            className="bg-gray-100 hover:bg-gray-200 text-slate-800 p-2.5 rounded-2xl cursor-pointer active:scale-95 transition-all border border-gray-200"
            aria-label="Back to categories"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">{category.icon || '🍽️'}</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {category.name}
              </h2>
            </div>
            {category.description && (
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="text-slate-600 text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-gray-200">
          {categoryFoods.length} Items
        </div>
      </div>

      {/* Grid of Foods */}
      {categoryFoods.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center max-w-md mx-auto shadow-xs">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900">No Items Available</h3>
          <p className="text-gray-500 text-sm mt-1">
            No food items found in this category.
          </p>
          <button
            onClick={onBackToCategories}
            className="mt-5 bg-[#FF4F18] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#e03e0d] cursor-pointer"
          >
            ← Back to Categories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {categoryFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              quantityInCart={getCartQuantity(food.id)}
              currencySymbol={currencySymbol}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))}
        </div>
      )}
    </div>
  );
});

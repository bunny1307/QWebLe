import React from 'react';
import { motion } from 'motion/react';
import { Category, FoodItem } from '../types';
import { ChevronRight, Utensils } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  foods: FoodItem[];
  onSelectCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = React.memo(({
  categories,
  foods,
  onSelectCategory,
}) => {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Categories
        </h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Select a category to view food items and add them to your order.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8 shadow-xs">
          <Utensils className="w-12 h-12 text-[#FF4F18] mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-900">No Categories Found</h3>
          <p className="text-gray-500 text-sm mt-1">
            Category data is currently empty in the loaded JSON presets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {categories.map((category, index) => {
            const categoryFoodCount = foods.filter(
              (f) => f.categoryId === category.id
            ).length;

            return (
              <motion.button
                key={category.id}
                id={`category-card-${category.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectCategory(category)}
                className="group bg-white rounded-3xl p-5 sm:p-6 border-2 border-gray-200 hover:border-[#FF4F18] shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center cursor-pointer min-h-[220px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                {/* Category Icon Circle */}
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform shadow-xs">
                  {category.icon || '🍽️'}
                </div>

                {/* Category Name & Info */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#FF4F18] transition-colors leading-snug">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Items Badge & Action */}
                <div className="w-full pt-3 flex items-center justify-between text-xs font-semibold text-gray-400 border-t border-gray-100">
                  <span className="bg-gray-100 px-2.5 py-0.5 rounded-full text-slate-700">
                    {categoryFoodCount} items
                  </span>
                  <div className="flex items-center gap-1 text-[#FF4F18] font-bold group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
});

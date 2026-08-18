import React, { useState, useEffect } from 'react';
import { ArrowLeft, Store, Clock } from 'lucide-react';
import { RestaurantInfo, ScreenType } from '../types';

interface HeaderProps {
  restaurant: RestaurantInfo;
  currentScreen: ScreenType;
  selectedCategoryName?: string;
  onBack: () => void;
  canGoBack: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  restaurant,
  currentScreen,
  selectedCategoryName,
  onBack,
  canGoBack,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setTimeString(now.toLocaleTimeString('en-US', timeOptions).toUpperCase());
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white text-slate-900 sticky top-0 z-30 select-none border-b border-gray-200 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left Side: BACK Button, Logo & Info */}
        <div className="flex items-center gap-4">
          {canGoBack && (
            <button
              onClick={onBack}
              id="kiosk-back-button"
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-slate-900 active:scale-95 transition-all px-4 py-2 rounded-xl font-semibold text-sm border border-gray-200 cursor-pointer shrink-0"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">BACK</span>
            </button>
          )}

          <div className="flex items-center gap-3 text-left">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-gray-200 shadow-xs bg-gray-50 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF4F18] flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
                <Store className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
            )}
            
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {restaurant.name}
              </h1>
              {restaurant.tagline && (
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase hidden sm:block">
                  {restaurant.tagline}
                </p>
              )}
              {(restaurant.phone || restaurant.address) && (
                <p className="text-[10px] text-gray-400 font-medium tracking-wide hidden md:block">
                  {restaurant.address && <span>{restaurant.address}</span>}
                  {restaurant.address && restaurant.phone && <span className="mx-1">•</span>}
                  {restaurant.phone && <span>{restaurant.phone}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Context Indicator & Clock */}
        <div className="flex items-center gap-3">
          {/* Location / Section Indicator if in category/food */}
          {selectedCategoryName && currentScreen === 'FOOD_PAGE' && (
            <div className="hidden lg:flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-200 text-xs font-semibold">
              <span>Category:</span>
              <span className="text-slate-900 font-bold">{selectedCategoryName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-100 text-slate-800 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-mono font-bold shrink-0">
            <Clock className="w-4 h-4 text-[#FF4F18]" />
            <span>{timeString}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

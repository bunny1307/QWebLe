import React, { useState, useEffect, useRef } from 'react';
import logoImg from '../assets/logo.png';

// Celebration Stream: Sequentially Originating from Inside the Cup (No Cluster)
const CELEBRATION_STREAM = [
  { char: '✨', className: 'text-amber-300 text-xs animate-rise-1', left: '-8px', delay: '0.0s' },
  { char: '☕', className: 'text-amber-700 text-xs animate-rise-2', left: '6px', delay: '0.22s' },
  { char: '~', className: 'text-amber-500 font-black text-lg animate-rise-3', left: '-2px', delay: '0.44s' },
  { char: '🤎', className: 'text-[11px] animate-rise-4', left: '10px', delay: '0.66s' },
  { char: '⭐', className: 'text-yellow-400 text-[10px] animate-rise-5', left: '-10px', delay: '0.88s' },
  { char: '🫘', className: 'text-amber-900 text-xs animate-rise-6', left: '8px', delay: '1.10s' },
  { char: '~', className: 'text-teal-400 font-black text-xl animate-rise-7', left: '2px', delay: '1.32s' },
  { char: '🌟', className: 'text-amber-300 text-xs animate-rise-8', left: '-5px', delay: '1.54s' },
  { char: '✨', className: 'text-teal-300 text-xs animate-rise-9', left: '7px', delay: '1.76s' },
  { char: '☕', className: 'text-amber-600 text-[11px] animate-rise-10', left: '-6px', delay: '1.98s' },
  { char: '♨', className: 'text-amber-400/90 text-sm animate-rise-11', left: '9px', delay: '2.20s' },
  { char: '✦', className: 'text-amber-200 text-xs animate-rise-12', left: '0px', delay: '2.42s' },
  { char: '🤎', className: 'text-[10px] animate-rise-1', left: '5px', delay: '2.64s' },
  { char: '~', className: 'text-amber-400 font-black text-base animate-rise-2', left: '-9px', delay: '2.86s' },
  { char: '⭐', className: 'text-amber-300 text-xs animate-rise-3', left: '-4px', delay: '3.08s' },
  { char: '🫘', className: 'text-amber-800 text-[11px] animate-rise-4', left: '4px', delay: '3.30s' },
  { char: '✨', className: 'text-yellow-200 text-xs animate-rise-5', left: '-11px', delay: '3.52s' },
  { char: '☕', className: 'text-amber-800 text-xs animate-rise-6', left: '8px', delay: '3.74s' },
  { char: '✧', className: 'text-teal-200 text-xs animate-rise-7', left: '-3px', delay: '3.96s' },
  { char: '🌟', className: 'text-yellow-300 text-[11px] animate-rise-8', left: '11px', delay: '4.18s' },
  { char: '~', className: 'text-emerald-400 font-black text-lg animate-rise-9', left: '-7px', delay: '4.40s' },
  { char: '🤎', className: 'text-xs animate-rise-10', left: '2px', delay: '4.62s' },
  { char: '✨', className: 'text-amber-400 text-xs animate-rise-11', left: '5px', delay: '4.84s' },
  { char: '✦', className: 'text-yellow-100 text-[10px] animate-rise-12', left: '-6px', delay: '5.06s' },
];

const CELEBRATION_EMBERS = [
  { size: 'w-1.5 h-1.5', color: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]', anim: 'animate-rise-2', left: '-5px', delay: '0.33s' },
  { size: 'w-1 h-1', color: 'bg-teal-300 shadow-[0_0_5px_#2dd4bf]', anim: 'animate-rise-5', left: '7px', delay: '1.43s' },
  { size: 'w-2 h-2', color: 'bg-amber-300/90 shadow-[0_0_8px_#fbbf24]', anim: 'animate-rise-8', left: '3px', delay: '2.53s' },
  { size: 'w-1 h-1', color: 'bg-emerald-400 shadow-[0_0_5px_#34d399]', anim: 'animate-rise-11', left: '-7px', delay: '3.85s' },
];

export const CoffeeBrewerWidget: React.FC = () => {
  // Target fill level determined by scroll (reaches 1.0 at 50% scroll)
  const targetFillRef = useRef(0);
  // Current smoothly interpolated fill level (damped fluid inertia)
  const [dampedFill, setDampedFill] = useState(0);
  // Machine operation state: 'IDLE' | 'POURING' | 'SETTLING' | 'FULL_SETTLED'
  const [machineState, setMachineState] = useState<'IDLE' | 'POURING' | 'SETTLING' | 'FULL_SETTLED'>('IDLE');
  
  // Track previous state for settling triggers
  const prevStateRef = useRef<'IDLE' | 'POURING' | 'SETTLING' | 'FULL_SETTLED'>('IDLE');
  const scrollTimeoutRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);

  // 1. Scroll Listener -> Updates target fill with 50% threshold
  useEffect(() => {
    const handleScroll = () => {
      isUserScrollingRef.current = true;
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      
      // Cup reaches 100% full capacity when page is HALF SCROLLED (0.5 threshold)
      targetFillRef.current = Math.min(rawProgress / 0.5, 1.0);

      // Debounce detecting when scrolling stops
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 120);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 2. Physics Animation Loop (60 FPS Inertia & Fluid Damping)
  useEffect(() => {
    let animId: number;
    let current = 0;

    const tick = () => {
      const target = targetFillRef.current;
      // Damped viscous liquid movement (lerp factor 0.075)
      const delta = target - current;
      if (Math.abs(delta) > 0.0008) {
        current += delta * 0.075;
      } else {
        current = target;
      }

      setDampedFill(current);

      // Determine state machine transition based on fluid physics
      const isActivelyMoving = Math.abs(delta) > 0.003 || isUserScrollingRef.current;
      const hasReachedFull = current >= 0.985;
      const hasBegun = current > 0.015;

      let nextState: 'IDLE' | 'POURING' | 'SETTLING' | 'FULL_SETTLED' = 'IDLE';

      if (!hasBegun) {
        nextState = 'IDLE';
      } else if (hasReachedFull) {
        nextState = 'FULL_SETTLED';
      } else if (isActivelyMoving) {
        nextState = 'POURING';
      } else {
        nextState = 'SETTLING';
      }

      setMachineState(nextState);
      prevStateRef.current = nextState;

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const isPouring = machineState === 'POURING';
  const isFilled = machineState === 'FULL_SETTLED' || dampedFill >= 0.985;
  const isSettling = machineState === 'SETTLING';

  // Liquid height in pixels inside the 52px tall cup cavity (from 4px to 46px)
  const liquidHeightPx = Math.round(4 + dampedFill * 42);

  return (
    <div
      aria-label="Premium Industrial Design Coffee Brewer"
      className="hidden md:flex fixed top-0 bottom-0 left-2 sm:left-4 w-24 sm:w-28 z-30 pointer-events-none flex-col items-center justify-between py-5 select-none overflow-hidden max-w-[112px]"
    >
      {/* ========================================================
          1. TOP: PREMIUM COMMERCIAL ESPRESSO MACHINE HEAD
          Visuals preserved 100% untouched.
          Physical response: Subtle rotary pump hum when active.
      ========================================================= */}
      <div className={`flex flex-col items-center pointer-events-auto shrink-0 pt-1 transition-transform duration-100 ${
        isPouring ? 'animate-pump-hum' : ''
      }`}>
        {/* Machine Head Outer Chassis (Subtle 3D Perspective) */}
        <div className="relative w-[92px] sm:w-[98px] rounded-b-xl overflow-visible filter drop-shadow-[0_12px_16px_rgba(15,23,42,0.22)]">
          {/* Top Chamfered Lid with Specular Highlight */}
          <div className="w-full h-3 bg-gradient-to-r from-[#334155] via-[#475569] to-[#1e293b] rounded-t-sm border-t border-[#64748b]/60 flex items-center justify-between px-2">
            <span className="w-1 h-1 rounded-full bg-[#94a3b8]/40" />
            <span className="w-1 h-1 rounded-full bg-[#94a3b8]/40" />
          </div>

          {/* Main Chassis Body (Dark Gunmetal Finish) */}
          <div className="w-full bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#0b1120] border-x border-[#334155]/60 p-1.5 flex flex-col items-center relative">
            {/* Top Seam Groove */}
            <div className="w-full h-[1px] bg-[#020617] border-b border-[#334155]/40 mb-1.5" />

            {/* Inset Brushed Stainless Steel Fascia Panel */}
            <div
              className={`w-full rounded-md p-1.5 flex flex-col items-center relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.2)] border border-[#475569]/50 transition-opacity duration-300 ${
                isPouring ? 'opacity-100' : 'opacity-95'
              }`}
              style={{
                background: 'linear-gradient(90deg, #64748b 0%, #94a3b8 15%, #cbd5e1 45%, #e2e8f0 55%, #94a3b8 85%, #64748b 100%)',
              }}
            >
              {/* Subtle Horizontal Grain Texture */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:3px_3px] pointer-events-none rounded-md" />

              {/* Status Header: Power LED + Status Text */}
              <div className="w-full flex items-center justify-between px-1 mb-1 relative z-10">
                {/* Glowing LED Ring */}
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      isPouring
                        ? 'bg-[#FFB800] shadow-[0_0_5px_#FFB800]'
                        : isFilled
                        ? 'bg-[#00D2A0] shadow-[0_0_4px_#00D2A0]'
                        : 'bg-[#00D2A0]/80'
                    }`}
                  />
                  <span className="text-[6.5px] font-black tracking-widest text-slate-700/80 uppercase">
                    {isPouring ? 'BREWING' : 'READY'}
                  </span>
                </div>
                {/* Micro Screws / Rivets */}
                <span className="w-1 h-1 rounded-full bg-[#475569] shadow-inner" />
              </div>

              {/* QWeble Laser-Etched Metallic Logo Badge */}
              <div className="relative z-10 px-2 py-0.5 rounded bg-gradient-to-b from-[#f8fafc]/90 via-[#e2e8f0]/80 to-[#cbd5e1]/90 border border-white/60 shadow-[0_1px_2px_rgba(0,0,0,0.15)] flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-[#00B894] to-[#00D2A0] p-0.5 flex items-center justify-center shadow-sm">
                  <img src={logoImg} alt="QWeble" className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-black text-slate-900 tracking-tight leading-none">
                  QWeble<span className="text-teal-600">.</span>
                </span>
              </div>
            </div>

            {/* Bottom Chassis Seam */}
            <div className="w-full h-[1px] bg-[#020617] border-b border-[#334155]/40 mt-1.5" />
          </div>

          {/* Heavy Machined Chrome Group Head Collar */}
          <div
            className="w-[72px] h-3.5 mx-auto rounded-b-sm relative flex items-center justify-center border-t border-[#334155] shadow-md"
            style={{
              background: 'linear-gradient(90deg, #334155 0%, #64748b 15%, #cbd5e1 35%, #ffffff 50%, #cbd5e1 65%, #64748b 85%, #334155 100%)',
            }}
          >
            {/* Machined Metal Ring Grooves */}
            <div className="w-[85%] h-[1px] bg-[#334155]/80" />
          </div>

          {/* Chrome Dual Dispensing Spout with Exact Central Nozzle Cavity */}
          <div className="relative flex justify-center items-start -mt-0.5">
            <svg width="28" height="14" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
              {/* Spout Collar */}
              <rect x="8" y="0" width="12" height="4" rx="1" fill="url(#chromeGradient)" />
              {/* Dual Spout Horns */}
              <path d="M9 4 C9 8, 5 11, 4 13 C7 12, 10 10, 11 6 L17 6 C18 10, 21 12, 24 13 C23 11, 19 8, 19 4 Z" fill="url(#chromeGradientDark)" />
              {/* Inner Nozzle Cavity (Where coffee physically originates) */}
              <ellipse cx="14" cy="5" rx="2.5" ry="1.5" fill="#1e130b" />
              <defs>
                <linearGradient id="chromeGradient" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="25%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="chromeGradientDark" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="30%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Soft Ambient Cast Shadow Below Machine Head */}
          <div className="w-[84px] h-3 mx-auto bg-gradient-to-b from-slate-900/40 to-transparent blur-[2px] pointer-events-none" />
        </div>
      </div>

      {/* ========================================================
          2. MIDDLE: REALISTIC FLUID POURING COFFEE STREAM
          Physical: Originates inside chrome nozzle, naturally tapers
          under gravity acceleration (Bernoulli fluid narrowing).
      ========================================================= */}
      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden my-0.5">
        {/* Subtle Guide Reference Line */}
        <div className="absolute top-0 bottom-0 w-[1px] bg-slate-400/10" />

        {isPouring ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Natural Tapered Fluid Jet (SVG path: wider at nozzle, narrower mid-fall) */}
            <svg width="12" height="100%" className="overflow-visible animate-stream-wobble">
              <defs>
                <linearGradient id="streamFluidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#231107" />
                  <stop offset="20%" stopColor="#4d2a13" />
                  <stop offset="45%" stopColor="#8c5324" />
                  <stop offset="60%" stopColor="#b5763d" />
                  <stop offset="85%" stopColor="#4a2712" />
                  <stop offset="100%" stopColor="#231107" />
                </linearGradient>
              </defs>
              {/* Primary Jet: 2.4px at top nozzle, tapering to 1.6px in middle, entering cup */}
              <path
                d="M 4.8 0 L 7.2 0 L 6.8 1000 L 5.2 1000 Z"
                fill="url(#streamFluidGradient)"
                className="filter drop-shadow-[0_0_3px_rgba(180,105,40,0.35)]"
              />
              {/* Center Specular Glint Line */}
              <line x1="6" y1="0" x2="6" y2="1000" stroke="#fef3c7" strokeWidth="0.5" strokeOpacity="0.45" />
            </svg>

            {/* Braided Meandering Fluid Tendril */}
            <div
              className="absolute top-0 w-[1px] h-full rounded-full animate-tendril opacity-70"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, #c48852 30%, #522d14 70%, transparent 100%)',
              }}
            />

            {/* Accelerated Falling Coffee Droplets */}
            <div className="absolute top-1 w-1.5 h-3 rounded-full bg-[#6d3c19] animate-drop-left shadow-sm" />
            <div className="absolute top-6 w-1.5 h-3.5 rounded-full bg-[#9c5e2d] animate-drop-right shadow-sm" />
          </div>
        ) : isFilled ? (
          /* Finished State: Clean detachment with single delicate micro-drop */
          <div className="h-full flex flex-col items-center justify-start pt-1.5 opacity-30 transition-opacity duration-500">
            <div className="w-1 h-2 rounded-full bg-[#4a2712]" />
          </div>
        ) : (
          /* Idle Standby: Subtle droplet bead poised at spout */
          <div className="h-full flex flex-col items-center justify-start pt-1 opacity-20">
            <div className="w-1 h-1.5 rounded-full bg-[#4a2712]" />
          </div>
        )}
      </div>

      {/* ========================================================
          3. BOTTOM: REALISTIC CERAMIC COFFEE CUP ON DRIP TRAY
          Physical response: Capillary surface ripples during pouring,
          harmonic liquid settling when stopped, soft irregular steam.
      ========================================================= */}
      <div className={`flex flex-col items-center relative pointer-events-auto shrink-0 pb-1 transition-transform duration-200 ${
        isSettling ? 'animate-cup-settle' : isPouring ? 'scale-[1.001]' : ''
      }`}>
                        {/* HIGH-DENSITY CELEBRATION WHEN CUP IS FILLED (RISING ALL THE WAY TO THE TOP) */}
        {isFilled && (
          <>
                                    {/* Continuous Celebration Stream Originating Sequentially from Cup */}
            <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-20 overflow-visible">
              {CELEBRATION_STREAM.map((item, idx) => (
                <span
                  key={idx}
                  className={`absolute font-black select-none pointer-events-none opacity-0 ${item.className}`}
                  style={{
                    left: `calc(50% + ${item.left})`,
                    top: '0px',
                    animationDelay: item.delay,
                  }}
                >
                  {item.char}
                </span>
              ))}

              {/* Golden Crema Micro-Embers */}
              {CELEBRATION_EMBERS.map((ember, idx) => (
                <span
                  key={`ember-${idx}`}
                  className={`absolute rounded-full pointer-events-none opacity-0 ${ember.size} ${ember.color} ${ember.anim}`}
                  style={{
                    left: `calc(50% + ${ember.left})`,
                    top: '0px',
                    animationDelay: ember.delay,
                  }}
                />
              ))}
            </div>

            {/* Realistic Organic Steam Wisps */}
            <div className="absolute -top-14 inset-x-0 flex justify-center pointer-events-none z-10 overflow-visible">
              <div className="absolute -left-1 w-2.5 h-12 rounded-full bg-gradient-to-t from-slate-300/30 via-slate-200/15 to-transparent blur-[2px] animate-organic-steam-1" />
              <div className="absolute right-0 w-3 h-16 rounded-full bg-gradient-to-t from-slate-300/35 via-slate-100/20 to-transparent blur-[2.5px] animate-organic-steam-2" />
              <div className="absolute inset-x-0 mx-auto w-2 h-10 rounded-full bg-gradient-to-t from-amber-100/25 via-slate-200/10 to-transparent blur-[1.5px] animate-organic-steam-3" />
            </div>
          </>
        )}

        {/* Cup Assembly (Constrained to 84px to prevent horizontal overflow) */}
        <div className="relative w-[78px] sm:w-[84px] flex items-center justify-center">
          {/* Ceramic Cup Body (Glazed Stoneware Cylinder) */}
          <div
            className={`relative w-[60px] sm:w-[66px] h-[52px] sm:h-[56px] rounded-b-[24px] rounded-t-sm p-1 flex flex-col justify-end overflow-hidden transition-all duration-300 shadow-[0_6px_14px_rgba(15,23,42,0.18)] ${
              isFilled ? 'animate-cup-aura border-teal-500/80 shadow-[0_6px_18px_rgba(0,184,148,0.4)]' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 55%, #e2e8f0 85%, #cbd5e1 100%)',
              border: '1.5px solid #cbd5e1',
            }}
          >
            {/* Top Ceramic Rim Highlight (Physical Glazed Wall Thickness) */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-white via-white to-slate-200 border-b border-slate-300/60 z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />

            {/* Empty Interior Cavity Base (Visible when cup is empty) */}
            <div className="absolute inset-x-1.5 top-2 bottom-1.5 rounded-b-[20px] bg-gradient-to-b from-[#cbd5e1] via-[#e2e8f0] to-[#f1f5f9] -z-0 opacity-80" />

            {/* ========================================================
                REALISTIC RISING ESPRESSO LIQUID & CREMA SURFACE
                Physical: Smoothly lerps with fluid inertia,
                capillary concentric ripples on impact, decaying settle.
            ========================================================= */}
            <div
              className={`w-full rounded-b-[20px] transition-[height] duration-75 relative flex flex-col justify-start z-10 overflow-visible ${
                isSettling ? 'animate-slosh' : ''
              }`}
              style={{
                height: `${liquidHeightPx}px`,
                background: 'linear-gradient(180deg, #3d1f0e 0%, #261208 30%, #150904 100%)',
              }}
            >
              {/* Elliptical Coffee Surface Meniscus with Crema & Softbox Studio Reflection */}
              <div
                className="w-full h-3 rounded-full relative overflow-hidden flex items-center justify-center -mt-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                style={{
                  background: 'radial-gradient(ellipse at center, #8a532b 0%, #c48852 45%, #63361a 75%, #36190b 100%)',
                  border: '0.5px solid #d4a373',
                }}
              >
                {/* Golden Crema Micro-Marbling */}
                <div className="absolute inset-0 opacity-60 bg-[radial-gradient(#faedcd_0.8px,transparent_0.8px)] [background-size:3px_2px]" />

                {/* Softbox Studio Window Light Reflection */}
                <div className="absolute top-0.5 right-2 w-4 h-1 bg-white/40 rounded-full blur-[0.5px] transform -rotate-6" />

                {/* Physical Capillary Surface Ripples during active pouring */}
                {isPouring && (
                  <svg width="28" height="12" className="absolute inset-0 m-auto pointer-events-none overflow-visible">
                    {/* Ripple 1 */}
                    <ellipse cx="14" cy="6" rx="3" ry="1.5" fill="none" stroke="#faedcd" className="animate-capillary-1" />
                    {/* Ripple 2 */}
                    <ellipse cx="14" cy="6" rx="2" ry="1" fill="none" stroke="#fef3c7" className="animate-capillary-2" />
                  </svg>
                )}

                {/* Micro Impact Crema Bubbles */}
                {isPouring && (
                  <>
                    <div className="absolute left-3 -top-0.5 w-1 h-1 rounded-full bg-[#c48852] animate-splash-left" />
                    <div className="absolute right-3 -top-1 w-1 h-1 rounded-full bg-[#faedcd] animate-splash-right" />
                  </>
                )}
              </div>
            </div>

            {/* QWeble Debossed Logo on Front of Ceramic Body */}
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center pointer-events-none z-20">
              <div
                className={`w-5 h-5 rounded-full bg-white/95 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),0_1px_1px_rgba(255,255,255,0.8)] border border-slate-300/80 flex items-center justify-center transition-transform duration-300 ${
                  isFilled ? 'scale-110 shadow-[0_0_12px_rgba(0,184,148,0.85)]' : ''
                }`}
              >
                <img src={logoImg} alt="QWeble Cup Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Ceramic Cup Handle with 3D Depth (Curved outer & inner ambient shadow) */}
          <div
            className="absolute top-2.5 right-0.5 w-3.5 h-7 rounded-r-xl border-[3px] border-l-0 border-[#cbd5e1] shadow-[2px_2px_4px_rgba(15,23,42,0.15)] z-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #f1f5f9 60%, #e2e8f0 100%)',
            }}
          />
        </div>

        {/* Realistic Contact Shadow directly under the cup */}
        <div className="w-[58px] h-2 bg-gradient-to-r from-transparent via-slate-900/35 to-transparent blur-[1.5px] -mt-1 pointer-events-none" />

        {/* ========================================================
            BRUSHED STAINLESS STEEL DRIP TRAY PLATFORM
            Visuals preserved 100% untouched.
        ========================================================= */}
        <div
          className="w-[74px] sm:w-[82px] h-3 rounded-md relative flex items-center justify-center shadow-[0_4px_8px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] border border-slate-400/60 mt-0.5"
          style={{
            background: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 20%, #f1f5f9 50%, #cbd5e1 80%, #94a3b8 100%)',
          }}
        >
          {/* Laser-Cut Circular Drain Perforations with Internal Shadows */}
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.8)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.8)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.8)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.8)]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#334155] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.8)]" />
          </div>
        </div>

        {/* Soft Ground Shadow Under Drip Tray */}
        <div className="w-[66px] h-1.5 bg-gradient-to-r from-transparent via-slate-900/25 to-transparent blur-[2px] pointer-events-none" />
      </div>
    </div>
  );
};

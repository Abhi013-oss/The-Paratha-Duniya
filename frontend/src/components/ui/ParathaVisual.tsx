'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ParathaVisual() {
  const [parathaSettled, setParathaSettled] = useState(false);

  return (
    <div className="relative w-72 h-72 sm:w-96 sm:h-96 mx-auto flex items-center justify-center">
      {/* 1. Golden Glowing Background Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={parathaSettled ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-amber-400/5 to-transparent rounded-full blur-3xl"
      />

      {/* 2. Floating Hot Steam Trails (Rendered dynamically when paratha settles) */}
      {parathaSettled && (
        <div className="absolute top-0 w-full flex justify-center space-x-12 -translate-y-4 z-20">
          <div className="steam-particle w-1.5 h-16 bg-gradient-to-t from-zinc-500/20 via-zinc-400/10 to-transparent rounded-full blur-sm" />
          <div className="steam-particle-fast w-1 h-12 bg-gradient-to-t from-zinc-400/15 via-zinc-300/8 to-transparent rounded-full blur-[3px]" />
          <div className="steam-particle-slow w-2 h-20 bg-gradient-to-t from-zinc-500/20 via-zinc-400/8 to-transparent rounded-full blur-[5px]" />
          <div className="steam-particle w-1 h-14 bg-gradient-to-t from-zinc-400/15 via-zinc-300/10 to-transparent rounded-full blur-[3px] -delay-1000" />
        </div>
      )}

      {/* 3. Outer Plate shadow and glow */}
      <motion.div
        initial={{ scale: 0.1, rotate: -270, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 55,
          damping: 14,
          mass: 1,
          duration: 1.6,
        }}
        onAnimationComplete={() => setParathaSettled(true)}
        className="absolute w-[95%] h-[95%] rounded-full border border-primary/10 bg-[#0F0F0F]/80 shadow-2xl flex items-center justify-center"
      >
        {/* Fine plate grooves representing authentic metal plate */}
        <div className="absolute w-[94%] h-[94%] rounded-full border border-zinc-900/60" />
        <div className="absolute w-[86%] h-[86%] rounded-full border border-zinc-800/40" />

        {/* 4. The Paratha Graphic */}
        <div className="relative w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-amber-800 via-primary to-amber-400 p-[3px] shadow-[0_0_40px_rgba(244,166,35,0.25)]">
          {/* Inner roasted paratha texture */}
          <div className="w-full h-full rounded-full bg-cover bg-center relative overflow-hidden flex items-center justify-center"
               style={{
                 backgroundImage: 'radial-gradient(circle, #e99b24 10%, #bd7312 40%, #7d4402 85%)'
               }}>
            
            {/* Flaky layered circles representing folds of a Laccha Paratha */}
            <div className="absolute inset-4 rounded-full border-2 border-amber-900/35 border-dashed" />
            <div className="absolute inset-10 rounded-full border border-amber-900/20 border-double" />
            <div className="absolute inset-16 rounded-full border-2 border-amber-950/30 border-dashed" />
            <div className="absolute inset-24 rounded-full border border-amber-950/25" />

            {/* Roasted brown spots */}
            <div className="absolute top-[20%] left-[30%] w-6 h-5 bg-[#3a1d04] rounded-full blur-[2px] opacity-75" />
            <div className="absolute top-[60%] left-[20%] w-4 h-4 bg-[#4a2404] rounded-full blur-[1px] opacity-80" />
            <div className="absolute top-[45%] right-[25%] w-8 h-6 bg-[#2d1401] rounded-full blur-[2px] opacity-85" />
            <div className="absolute bottom-[20%] right-[35%] w-5 h-4 bg-[#3d1d02] rounded-full blur-[1px] opacity-70" />
            <div className="absolute top-[25%] right-[40%] w-3 h-3 bg-[#4a2705] rounded-full blur-[1px] opacity-80" />

            {/* Ghee Shimmer Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-300/10 via-transparent to-amber-200/5 mix-blend-overlay" />

            {/* 5. Melting butter dollop - animated landing */}
            <motion.div
              initial={{ y: -200, scale: 0.1, opacity: 0, rotate: -45 }}
              animate={
                parathaSettled
                  ? { y: 0, scale: 1, opacity: 1, rotate: 0 }
                  : { y: -200, scale: 0.1, opacity: 0, rotate: -45 }
              }
              transition={{
                type: "spring",
                stiffness: 85,
                damping: 11,
                mass: 1.1,
                delay: 0.2, // Lands shortly after plate settle
              }}
              className="absolute w-12 h-10 bg-yellow-400 rounded-full shadow-[0_4px_15px_rgba(253,224,71,0.6)] flex items-center justify-center"
            >
              {/* Melted butter puddle */}
              <div className="absolute -inset-2 bg-yellow-400/40 rounded-full blur-[6px] mix-blend-screen" />
              
              {/* Melting shape detail */}
              <div className="w-10 h-8 bg-yellow-300 rounded-full relative overflow-hidden flex items-center justify-center">
                {/* Shine highlight */}
                <div className="absolute top-1 left-2 w-4 h-2 bg-white/70 rounded-full rotate-[-15deg] butter-shimmer" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Floating Sparkles */}
      <div className="absolute top-[15%] left-[10%] text-primary/30 animate-pulse text-xl">★</div>
      <div className="absolute bottom-[20%] right-[12%] text-primary/40 animate-pulse text-lg -delay-1000">✦</div>
      <div className="absolute top-[50%] right-[5%] text-primary/20 animate-pulse text-sm -delay-500">★</div>
    </div>
  );
}

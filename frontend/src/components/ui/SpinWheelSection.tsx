'use client';

import React, { useState } from 'react';
import { Sparkles, ShoppingBag, RotateCw, CheckCircle, ArrowRight, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const WHEEL_ITEMS = [
  { id: 186, name: 'Cheese Chilli Garlic Paratha', price: 80, color: '#F4A623', image: '/images/cheese_chilli_garlic.jpg', desc: 'Melted mozzarella cheese, spicy chillies & roasted garlic.' },
  { id: 167, name: 'Classic Aloo Paratha', price: 60, color: '#D97706', image: '/images/aloo.jpg', desc: 'Spiced potato filling with fresh coriander & desi ghee.' },
  { id: 3, name: 'Paneer Butter Paratha', price: 110, color: '#B45309', image: '/images/paneer.jpg', desc: 'Fresh malai paneer with aromatic Punjabi spices.' },
  { id: 4, name: 'Mix Veg Paratha', price: 75, color: '#92400E', image: '/images/mix_veg.jpg', desc: 'Loaded with carrots, peas, potatoes & spicy herbs.' },
  { id: 5, name: 'Sattu Spice Paratha', price: 85, color: '#F59E0B', image: '/images/sattu.jpg', desc: 'Bihari roasted gram flour with pickle spices.' },
  { id: 6, name: 'Aloo Pyaz Paratha', price: 70, color: '#EAB308', image: '/images/onion.jpg', desc: 'Crispy onions blended with spiced mashed potatoes.' },
  { id: 7, name: 'Gobhi Stuffed Paratha', price: 75, color: '#CA8A04', image: '/images/gobhi.jpg', desc: 'Grated cauliflower seasoned with ginger & green chillies.' },
  { id: 2, name: 'Luxury Dry Fruit Paratha', price: 249, color: '#A16207', image: '/images/butter.jpg', desc: 'Rich saffron, almonds, cashews & pure desi ghee.' },
];

export default function SpinWheelSection() {
  const { addToCart } = useCart();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<typeof WHEEL_ITEMS[0] | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setWinner(null);
    setAddedSuccess(false);

    // Calculate random target index (0 to 7)
    const randomIndex = Math.floor(Math.random() * WHEEL_ITEMS.length);
    const sliceAngle = 360 / WHEEL_ITEMS.length;

    // Full rotations (5 to 8 turns) + offset to slice center
    const extraTurns = (5 + Math.floor(Math.random() * 3)) * 360;
    // Align indicator at top (270deg offset)
    const targetDegrees = extraTurns + (360 - (randomIndex * sliceAngle + sliceAngle / 2));

    const totalRotation = rotation + targetDegrees;
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(WHEEL_ITEMS[randomIndex]);
    }, 4500);
  };

  const handleAddToCart = () => {
    if (!winner) return;

    addToCart(
      {
        id: winner.id,
        name: winner.name,
        price: winner.price,
        image: winner.image,
        isVeg: true,
      },
      1
    );

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 3000);
  };

  return (
    <section className="py-20 bg-[#070707] relative overflow-hidden border-t border-b border-zinc-900">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-12">
        
        {/* Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Can't Decide What to Eat?</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-white tracking-wide">
            Spin the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">Paratha Wheel</span> 🎡
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Let fate choose your meal! Spin the wheel to pick your dish, add it straight to your basket, and enjoy royal butterloaded goodness.
          </p>
        </div>

        {/* Wheel Container */}
        <div className="flex flex-col items-center justify-center relative">
          
          {/* Wheel Pointer Arrow at Top */}
          <div className="z-30 -mb-5 relative">
            <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(244,166,35,0.6)]" />
          </div>

          {/* SVG Wheel */}
          <div className="relative w-80 h-80 sm:w-[400px] sm:h-[400px] rounded-full p-3 bg-gradient-to-b from-amber-500/30 to-zinc-900 border-4 border-amber-500/40 shadow-[0_0_50px_rgba(244,166,35,0.15)]">
            
            <div
              className="w-full h-full rounded-full relative overflow-hidden transition-transform duration-[4500ms] cubic-bezier(0.15, 0.99, 0.18, 0.99)"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {WHEEL_ITEMS.map((item, index) => {
                  const sliceAngle = 360 / WHEEL_ITEMS.length;
                  const startAngle = index * sliceAngle;
                  const endAngle = (index + 1) * sliceAngle;

                  const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Text Label positioning
                  const midAngle = startAngle + sliceAngle / 2;
                  const textX = 50 + 32 * Math.cos((Math.PI * midAngle) / 180);
                  const textY = 50 + 32 * Math.sin((Math.PI * midAngle) / 180);

                  return (
                    <g key={item.id}>
                      <path
                        d={pathData}
                        fill={index % 2 === 0 ? '#18181B' : '#111113'}
                        stroke="#27272A"
                        strokeWidth="0.5"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill={index % 2 === 0 ? '#F4A623' : '#FFFFFF'}
                        fontSize="3.2"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      >
                        {item.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Center Wheel Hub Cap */}
              <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 bg-zinc-950 border-4 border-amber-400/80 rounded-full shadow-2xl flex items-center justify-center z-20">
                <span className="font-serif text-xs sm:text-sm font-black text-amber-400">TPD</span>
              </div>
            </div>
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-8">
            <button
              onClick={spinWheel}
              disabled={spinning}
              className="px-10 py-4 bg-gradient-to-r from-primary via-amber-400 to-amber-500 text-black font-extrabold text-base rounded-full shadow-[0_0_30px_rgba(244,166,35,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{spinning ? 'Spinning Fates...' : 'SPIN THE WHEEL 🎡'}</span>
            </button>
          </div>

        </div>

        {/* Winner Result Modal */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="max-w-md mx-auto glass-panel p-6 rounded-3xl border border-amber-400/40 text-left space-y-5 gold-glow relative"
            >
              <button
                onClick={() => setWinner(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>The Wheel Has Spoken!</span>
              </div>

              <div className="flex items-center space-x-4">
                <img
                  src={winner.image}
                  alt={winner.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/40 shrink-0"
                />
                <div>
                  <h3 className="font-serif text-lg font-extrabold text-white">{winner.name}</h3>
                  <p className="text-zinc-400 text-xs mt-1 leading-snug">{winner.desc}</p>
                  <span className="font-extrabold text-primary text-base block mt-1">₹{winner.price}</span>
                </div>
              </div>

              {addedSuccess ? (
                <div className="w-full py-3.5 bg-green-500/10 border border-green-500/30 text-green-500 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 text-center">
                  <CheckCircle className="w-4 h-4" />
                  <span>Added to Cart! Ready for Order 🚀</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-grow py-3.5 bg-primary hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 gold-glow"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart & Order</span>
                  </button>

                  <button
                    onClick={spinWheel}
                    className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition-colors"
                  >
                    Spin Again 🔄
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, RotateCw, CheckCircle, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';

// Official Paratha Duniya Menu Items fallback
const OFFICIAL_MENU_FALLBACK = [
  { id: 1, name: 'Classic Aloo Paratha', price: 60, image: '/images/aloo.jpg', desc: 'Generously stuffed with spiced mashed potatoes, green chillies, and fresh coriander.' },
  { id: 2, name: 'Cheese Chilli Garlic Paratha', price: 80, image: '/images/cheese_chilli_garlic.jpg', desc: 'A mouthwatering fusion of melted cheese, spicy green chillies, and roasted garlic bits.' },
  { id: 3, name: 'Gobhi Paratha', price: 60, image: '/images/gobhi.jpg', desc: 'Loaded with grated fresh cauliflower, seasoned ginger, green chillies, and roasted cumin.' },
  { id: 6, name: 'Paneer Paratha', price: 70, image: '/images/paneer.jpg', desc: 'Stuffed with fresh grated spiced paneer cottage cheese, roasted onions, and traditional herbs.' },
  { id: 7, name: 'Cheese Paratha', price: 70, image: '/images/cheese.jpg', desc: 'Melted premium cheese loaded inside a crispy layered flatbread. Extremely gooey and satisfying.' },
  { id: 9, name: 'Onion Paratha', price: 60, image: '/images/onion.jpg', desc: 'Finely chopped crispy onions seasoned with carom seeds (ajwain) and traditional spices.' },
  { id: 10, name: 'Mixed Veg Paratha', price: 60, image: '/images/mix_veg.jpg', desc: 'A delicious assortment of potatoes, carrots, beans, peas, and paneer stuffed in crispy dough.' },
  { id: 11, name: 'Sattu Paratha', price: 60, image: '/images/sattu.jpg', desc: 'Traditional roasted gram flour (sattu) stuffed with pickle spices, mustard oil, garlic, and chillies.' },
];

export default function SpinWheelSection() {
  const { addToCart } = useCart();
  const [wheelItems, setWheelItems] = useState(OFFICIAL_MENU_FALLBACK);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<typeof OFFICIAL_MENU_FALLBACK[0] | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Fetch actual products from API if available
  useEffect(() => {
    const fetchMenuForWheel = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= 8) {
            const mapped = data.slice(0, 8).map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image || '/images/aloo.jpg',
              desc: p.description || 'Authentic butterloaded paratha prepared fresh on order.',
            }));
            setWheelItems(mapped);
          }
        }
      } catch (e) {
        console.log('Using official menu fallback for spin wheel.');
      }
    };

    fetchMenuForWheel();
  }, []);

  const spinWheel = () => {
    if (spinning || wheelItems.length === 0) return;

    setSpinning(true);
    setWinner(null);
    setAddedSuccess(false);

    // Calculate random target index (0 to 7)
    const randomIndex = Math.floor(Math.random() * wheelItems.length);
    const sliceAngle = 360 / wheelItems.length;

    // Full rotations (5 to 8 turns) + offset to slice center
    const extraTurns = (5 + Math.floor(Math.random() * 3)) * 360;
    // Align indicator at top (270deg offset)
    const targetDegrees = extraTurns + (360 - (randomIndex * sliceAngle + sliceAngle / 2));

    const totalRotation = rotation + targetDegrees;
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(wheelItems[randomIndex]);
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
            Let fate choose your meal from our official menu! Spin the wheel to pick your dish, add it straight to your basket, and enjoy royal butterloaded goodness.
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
                {wheelItems.map((item, index) => {
                  const sliceAngle = 360 / wheelItems.length;
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

                  const shortName = item.name.replace('Paratha', '').trim().split(' ')[0];

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
                        {shortName}
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
                <span>The Wheel Selected Your Menu Dish!</span>
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
                    <span>Add to Cart & Order (₹{winner.price})</span>
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

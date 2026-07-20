'use client';

import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { CartItem } from '../../context/CartContext';

interface ItemCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
    description?: string;
  };
  onAddToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
}

const SPICE_LEVELS = ['Regular', 'Extra Spicy 🌶️', 'Mild / Less Spicy'];

const ADD_ONS = [
  { id: 'ghee', name: 'Extra Pure Desi Ghee', price: 15 },
  { id: 'cheese', name: 'Extra Mozzarella Cheese', price: 25 },
  { id: 'curd', name: 'Fresh Dahi / Curd Portion', price: 20 },
  { id: 'butter', name: 'Extra Amul Butter Cube', price: 15 },
];

export default function ItemCustomizeModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
}: ItemCustomizeModalProps) {
  const [selectedSpice, setSelectedSpice] = useState('Regular');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  // Compute total addon extra fee
  const addonsFee = ADD_ONS.filter((a) => selectedAddons.includes(a.name)).reduce(
    (acc, item) => acc + item.price,
    0
  );
  const finalUnitPrice = product.price + addonsFee;
  const totalPrice = finalUnitPrice * quantity;

  const toggleAddon = (name: string) => {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAdd = () => {
    const customizations = [
      `Spice: ${selectedSpice}`,
      ...selectedAddons
    ];

    onAddToCart({
      id: product.id,
      name: product.name,
      price: finalUnitPrice,
      image: product.image,
      isVeg: product.isVeg,
      customizations,
      notes: notes.trim() || undefined
    }, quantity);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 text-left relative my-8 border border-zinc-850">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Details Header */}
        <div className="flex items-center space-x-4 border-b border-zinc-900 pb-4 pr-8">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 rounded-2xl object-cover border border-zinc-800"
          />
          <div>
            <span className="text-[10px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wider">
              {product.isVeg ? 'PURE VEG' : 'NON VEG'}
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{product.name}</h3>
            <p className="text-xs font-extrabold text-primary">₹{product.price} Base Price</p>
          </div>
        </div>

        {/* 1. SPICE LEVEL OPTION */}
        <div className="space-y-2.5">
          <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">
            Select Spice Preference
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPICE_LEVELS.map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSelectedSpice(sp)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                  selectedSpice === sp
                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ADD-ONS SELECTION */}
        <div className="space-y-2.5">
          <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">
            Add Extra Toppings & Sides
          </label>
          <div className="space-y-2">
            {ADD_ONS.map((addon) => {
              const isChecked = selectedAddons.includes(addon.name);
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.name)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-zinc-900 border-primary text-white'
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-primary border-primary text-black' : 'border-zinc-700'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold">{addon.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-primary">+₹{addon.price}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. SPECIAL COOKING INSTRUCTIONS */}
        <div className="space-y-2">
          <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">
            Special Instructions (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Make it extra crispy, less oil..."
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* QUANTITY & SUBMIT FOOTER */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold flex items-center justify-center text-sm"
            >
              -
            </button>
            <span className="font-extrabold text-white text-sm w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold flex items-center justify-center text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-grow py-3.5 bg-primary text-black font-extrabold text-sm rounded-xl text-center hover:bg-amber-400 gold-glow transition-all flex items-center justify-center space-x-2"
          >
            <span>Add to Cart • ₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

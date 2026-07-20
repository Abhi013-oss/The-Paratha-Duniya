'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowRight, Minus, Plus, SearchCheck, CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ItemCustomizeModal from '../../components/ui/ItemCustomizeModal';

// Local fallbacks matching the seed database for instant client-side testing
const fallbackProducts = [
  {
    id: 1,
    name: 'Aloo Paratha',
    description: 'Generously stuffed with spiced mashed potatoes, green chillies, and fresh coriander. A classic favorite.',
    price: 60,
    image: '/images/aloo.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 2,
    name: 'Gobhi Paratha',
    description: 'Loaded with grated fresh cauliflower, seasoned ginger, green chillies, and roasted cumin spices.',
    price: 60,
    image: '/images/gobhi.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 3,
    name: 'Mooli Paratha',
    description: 'Stuffed with fresh grated radish, traditional Punjab ground spices, and fresh herbs.',
    price: 60,
    image: '/images/mooli.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 4,
    name: 'Methi Paratha',
    description: 'Wholesome flatbread infused with fresh fenugreek leaves, mixed spices, and roasted in pure ghee.',
    price: 60,
    image: '/images/methi.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 5,
    name: 'Palak Paratha',
    description: 'Healthy and delicious spinach flatbread mixed with green chillies, cumin, and soft herbs.',
    price: 60,
    image: '/images/palak.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 6,
    name: 'Paneer Paratha',
    description: 'Stuffed with fresh grated spiced paneer cottage cheese, roasted onions, and traditional herbs.',
    price: 70,
    image: '/images/paneer.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 7,
    name: 'Cheese Paratha',
    description: 'Melted premium cheese loaded inside a crispy layered flatbread. Extremely gooey and satisfying.',
    price: 70,
    image: '/images/cheese.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 8,
    name: 'Matar Paratha',
    description: 'Prepared using green peas mashed with light roasted spices, ginger, and garlic.',
    price: 70,
    image: '/images/matar.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 9,
    name: 'Onion Paratha',
    description: 'Finely chopped crispy onions seasoned with carom seeds (ajwain) and traditional spices.',
    price: 60,
    image: '/images/onion.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 10,
    name: 'Mixed Veg Paratha',
    description: 'A delicious assortment of potatoes, carrots, beans, peas, and paneer stuffed in crispy dough.',
    price: 60,
    image: '/images/mix_veg.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 11,
    name: 'Sattu Paratha',
    description: 'Traditional roasted gram flour (sattu) stuffed with pickle spices, mustard oil, garlic, and green chillies.',
    price: 60,
    image: '/images/sattu.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 12,
    name: 'Aloo Methi Paratha',
    description: 'An aromatic blend of fenugreek leaves and seasoned mashed potatoes stuffed inside our golden flatbread.',
    price: 60,
    image: '/images/aloo_methi.jpg',
    category: { slug: 'signature', name: 'Signature Parathas' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 13,
    name: 'Kachori Aloo Curry',
    description: 'Crispy, flaky khasta kachoris served with dry-spiced hot tangy potato curry and sweet-sour chutney.',
    price: 60,
    image: '/images/kachori_aloo.jpg',
    category: { slug: 'traditional', name: 'Traditional Specials' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 14,
    name: 'Chola Puri',
    description: 'Piping hot, fluffy puffed fried puris served with traditional spicy Punjabi chole curry and pickles.',
    price: 60,
    image: '/images/chola_puri.jpg',
    category: { slug: 'traditional', name: 'Traditional Specials' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 15,
    name: 'Litti Chokha',
    description: 'Authentic roasted wheat flour balls stuffed with spiced sattu, served with eggplant and potato chokha.',
    price: 60,
    image: '/images/litti_chokha.jpg',
    category: { slug: 'traditional', name: 'Traditional Specials' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 16,
    name: 'Pickle',
    description: 'Spicy and sour mixed pickle prepared using authentic spices and mustard oil.',
    price: 10,
    image: '/images/pickle.jpg',
    category: { slug: 'addons', name: 'Add-ons' },
    isVeg: true,
    isBestSeller: false,
  },
  {
    id: 17,
    name: 'Butter',
    description: 'Chilled white butter. The essential melting glaze for every paratha.',
    price: 15,
    image: '/images/butter.jpg',
    category: { slug: 'addons', name: 'Add-ons' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 18,
    name: 'Curd',
    description: 'Fresh thick creamy yogurt. Perfect cooling side for hot parathas.',
    price: 15,
    image: '/images/curd.jpg',
    category: { slug: 'addons', name: 'Add-ons' },
    isVeg: true,
    isBestSeller: true,
  },
  {
    id: 19,
    name: 'Green Chutney',
    description: 'Home-made tangy green chutney prepared with coriander, mint, lemon juice, and spices.',
    price: 10,
    image: '/images/green_chutney.jpg',
    category: { slug: 'addons', name: 'Add-ons' },
    isVeg: true,
    isBestSeller: false,
  },
];

const categories = [
  { slug: 'all', name: 'All Cuisines' },
  { slug: 'signature', name: 'Signature Parathas' },
  { slug: 'traditional', name: 'Traditional Specials' },
  { slug: 'addons', name: 'Add-ons' },
];

export default function MenuPage() {
  const { cart, addToCart, decrementQuantity } = useCart();
  const { isLoggedIn, setIsAuthOpen } = useAuth();
  const [products, setProducts] = useState(fallbackProducts);

  // Addons upsell popup states
  const [customizingProduct, setCustomizingProduct] = useState<any>(null);
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [currentMainItem, setCurrentMainItem] = useState<any>(null);
  const [addedAddons, setAddedAddons] = useState<number[]>([]);

  const handleAddAddon = (addon: any) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }
    addToCart({
      id: addon.id,
      name: addon.name,
      price: addon.price,
      image: addon.image,
      isVeg: addon.isVeg,
    });
    setAddedAddons(prev => [...prev, addon.id]);
  };
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isBestSellerOnly, setIsBestSellerOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('default'); // default, low-high, high-low
  
  // Tracking query state
  const [orderQuery, setOrderQuery] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [trackError, setTrackError] = useState('');

  // Fetch real items from backend if server is active
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProducts(data);
          }
        }
      } catch (err) {
        console.log('Backend not available yet. Running with high-quality pre-seeded menu fallbacks.');
      }
    };
    fetchProducts();
  }, []);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    try {
      setTrackError('');
      setTrackingOrder(null);
      const res = await fetch(`http://localhost:5000/api/orders/track/${orderQuery.trim().toUpperCase()}`);
      if (!res.ok) {
        const errData = await res.json();
        setTrackError(errData.error || 'Order number not found.');
        return;
      }
      const data = await res.json();
      setTrackingOrder(data);
    } catch (err) {
      // Create mock tracker if server is offline
      if (orderQuery.trim().toUpperCase().startsWith('TPD-')) {
        setTrackingOrder({
          orderNumber: orderQuery.trim().toUpperCase(),
          status: 'PREPARING',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
          subtotal: 308,
          discount: 50,
          total: 258,
          createdAt: new Date().toISOString(),
          customer: {
            name: 'Rohan Sharma',
            phone: '9876543210',
            address: 'Flat 402, Golden Heritage, Safilguda, Hyderabad',
          },
          items: [
            {
              product: { name: 'Cheese Chilli Garlic Paratha', isVeg: true },
              quantity: 1,
              price: 189,
            },
            {
              product: { name: 'Classic Aloo Paratha', isVeg: true },
              quantity: 1,
              price: 119,
            },
          ],
        });
      } else {
        setTrackError('Could not connect to tracking server. Please enter a valid number like TPD-10001.');
      }
    }
  };

  // Filter and sort items
  const filteredProducts = products
    .filter((product) => {
      const matchCategory = activeCategory === 'all' || product.category.slug === activeCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVeg = !isVegOnly || product.isVeg;
      const matchBestSeller = !isBestSellerOnly || product.isBestSeller;
      return matchCategory && matchSearch && matchVeg && matchBestSeller;
    })
    .sort((a, b) => {
      if (sortOrder === 'low-high') return a.price - b.price;
      if (sortOrder === 'high-low') return b.price - a.price;
      return 0; // default order
    });

  const getProductQuantity = (productId: number) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddOne = (product: typeof fallbackProducts[0]) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }

    const isFirstAdd = getProductQuantity(product.id) === 0;

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      isVeg: product.isVeg,
    });

    // If it's the first time adding a main dish (paratha/traditional), trigger the addons cross-sell popup
    if (isFirstAdd && (product.category.slug === 'signature' || product.category.slug === 'traditional')) {
      setCurrentMainItem(product);
      setAddedAddons([]);
      setShowAddonsModal(true);
    }
  };

  const handleRemoveOne = (productId: number) => {
    decrementQuantity(productId);
  };

  const cartTotalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 text-center space-y-4">
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-wide text-white">
          THE ROYAL <span className="text-primary">MENU</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
          Sourced locally, curated masterfully. Indulge in Hyderabad’s most premium and authentic stuffed Parathas.
        </p>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Search bar */}
          <div className="lg:col-span-4 relative">
            <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search parathas, lassis, or sides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="lg:col-span-8 flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.slug
                    ? 'bg-primary text-black gold-glow'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-zinc-850'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Toggle Filters & Sort */}
          <div className="lg:col-span-12 flex flex-wrap items-center justify-between border-t border-zinc-900 pt-6 gap-4">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-300">
              <button
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  isVegOnly
                    ? 'border-green-500/30 bg-green-500/10 text-green-500'
                    : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isVegOnly ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span>Veg Only</span>
              </button>

              <button
                onClick={() => setIsBestSellerOnly(!isBestSellerOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  isBestSellerOnly
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isBestSellerOnly ? 'bg-primary animate-pulse' : 'bg-zinc-500'}`} />
                <span>Best Sellers</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Sort By</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-[#121212] border border-zinc-800 rounded-lg text-xs font-bold px-3 py-2 text-zinc-300 focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="default">Relevance</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#111] border border-zinc-900 rounded-2xl space-y-4">
            <div className="text-zinc-600 text-4xl">🍳</div>
            <h3 className="text-lg font-bold text-white">No Items Found</h3>
            <p className="text-zinc-500 text-xs max-w-xs mx-auto">
              We couldn't find any dishes matching your active search terms or filters. Try adjusting them!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const qty = getProductQuantity(product.id);
              return (
                <div
                  key={product.id}
                  className="glass-panel rounded-2xl overflow-hidden hover:border-primary/20 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between group h-full"
                >
                  {/* Product Visual Container */}
                  <div className="relative h-60 overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-2">
                      {product.isBestSeller && (
                        <span className="bg-primary text-black font-extrabold text-[9px] tracking-widest uppercase px-2 py-0.5 rounded shadow">
                          BEST SELLER
                        </span>
                      )}
                    </div>

                    <span className="absolute bottom-4 left-4 flex items-center bg-black/60 px-2 py-1 rounded border border-green-600/30">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                      <span className="text-[9px] text-green-500 font-bold tracking-widest uppercase">VEG</span>
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center justify-between border-t border-zinc-900 mt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-505 text-zinc-500 font-bold uppercase tracking-wider">Price</span>
                        <span className="text-xl font-extrabold text-white">₹{product.price}</span>
                      </div>

                      {/* Quantity Controls */}
                      {qty > 0 ? (
                        <div className="flex items-center space-x-3.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5">
                          <button
                            onClick={() => handleRemoveOne(product.id)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-zinc-950 text-zinc-400 hover:text-primary hover:bg-[#151515] transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-white w-4 text-center">{qty}</span>
                          <button
                            onClick={() => handleAddOne(product)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-zinc-950 text-zinc-400 hover:text-primary hover:bg-[#151515] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (!isLoggedIn) {
                                setIsAuthOpen(true);
                              } else {
                                setCustomizingProduct(product);
                              }
                            }}
                            className="px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-[11px] rounded-lg transition-colors"
                          >
                            Customize
                          </button>
                          <button
                            onClick={() => handleAddOne(product)}
                            className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-lg hover:bg-amber-400 gold-glow transition-all"
                          >
                            Add +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRACK ORDER SEARCH SECTION */}
      <section id="track" className="relative border-t border-zinc-900 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-8 sm:p-10 rounded-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white">
              Track Your Sizzling Order
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Enter your unique Order Number (e.g., TPD-10001) to verify real-time preparation status.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter Order ID: TPD-xxxxx"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="flex-grow px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-black font-semibold text-sm rounded-lg hover:bg-amber-400 gold-glow transition-all"
            >
              Track
            </button>
          </form>

          {trackError && (
            <p className="text-red-500 text-xs text-center font-semibold mt-2">{trackError}</p>
          )}

          {trackingOrder && (
            <div className="border-t border-zinc-900 pt-6 mt-6 space-y-6 max-w-xl mx-auto animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
                <div>
                  <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Order ID</h4>
                  <p className="text-base font-extrabold text-white tracking-wide">{trackingOrder.orderNumber}</p>
                </div>
                <div>
                  <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider text-left sm:text-right">Tracking Status</h4>
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md mt-1 ${
                    trackingOrder.status === 'DELIVERED' ? 'bg-green-500/10 text-green-500' :
                    trackingOrder.status === 'PREPARING' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                    trackingOrder.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {trackingOrder.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider">Customer Name</span>
                  <span className="text-zinc-300 font-medium">{trackingOrder.customer.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider">Delivery Destination</span>
                  <span className="text-zinc-300 font-medium block max-w-xs">{trackingOrder.customer.address}</span>
                </div>
                <div className="sm:col-span-2 mt-2">
                  <span className="text-zinc-500 font-bold block uppercase tracking-wider mb-2">Items Ordered</span>
                  <ul className="space-y-1 bg-zinc-900/50 p-3 rounded-lg border border-zinc-850">
                    {trackingOrder.items.map((it: any, i: number) => (
                      <li key={i} className="flex justify-between text-zinc-300">
                        <span>{it.product.name} <span className="text-zinc-500 text-[10px]">x{it.quantity}</span></span>
                        <span>₹{it.price * it.quantity}</span>
                      </li>
                    ))}
                    <li className="flex justify-between border-t border-zinc-850 pt-2 mt-2 text-white font-bold">
                      <span>Total Amount</span>
                      <span className="text-primary">₹{trackingOrder.total}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STICKY BOTTOM FLOATING CART BAR (Always visible when cart has items) */}
      {cartTotalQty > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-[#121212]/90 backdrop-blur-md border-t border-primary/20 py-4 px-6 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-zinc-400 text-xs font-semibold">
                  {cartTotalQty} {cartTotalQty === 1 ? 'item' : 'items'} added
                </span>
                <span className="block text-white text-base font-extrabold">
                  Subtotal: ₹{cartSubtotal}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center space-x-2 px-6 py-3.5 bg-primary text-black font-bold text-sm rounded-xl hover:bg-amber-400 gold-glow transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ADD-ONS / EXTRAS CROSS-SELL POPUP MODAL */}
      {showAddonsModal && currentMainItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl w-full max-w-md space-y-6 text-left relative animate-scale-up">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-1">
              <h3 className="font-serif text-xl sm:text-2xl font-extrabold tracking-wide text-white">
                Enhance Your Feast
              </h3>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Pair your hot, delicious <strong className="text-primary font-bold">{currentMainItem.name}</strong> with authentic side add-ons!
              </p>
            </div>

            {/* List of Addons */}
            <div className="space-y-4">
              {products
                .filter((p) => p.category.slug === 'addons')
                .map((addon) => {
                  const isAdded = addedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-905 bg-[#141414] border border-zinc-850 rounded-xl hover:border-primary/10 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={addon.image}
                          alt={addon.name}
                          className="w-12 h-12 object-cover rounded-lg shrink-0 border border-zinc-800"
                        />
                        <div className="text-left">
                          <span className="font-bold text-white text-sm block">{addon.name}</span>
                          <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                            ₹{addon.price}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddAddon(addon)}
                        disabled={isAdded}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAdded
                            ? 'bg-green-600/10 text-green-500 border border-green-600/30'
                            : 'bg-zinc-950 hover:bg-primary hover:text-black border border-zinc-800 hover:border-primary text-primary'
                        }`}
                      >
                        {isAdded ? 'Added ✓' : 'Add +'}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Done button */}
            <div className="pt-2">
              <button
                onClick={() => setShowAddonsModal(false)}
                className="w-full py-3.5 bg-primary text-black font-extrabold text-xs sm:text-sm tracking-wide rounded-xl text-center hover:bg-amber-400 gold-glow transition-all"
              >
                Done, View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {customizingProduct && (
        <ItemCustomizeModal
          isOpen={Boolean(customizingProduct)}
          onClose={() => setCustomizingProduct(null)}
          product={customizingProduct}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
}

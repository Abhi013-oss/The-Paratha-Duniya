'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Flame, Award, Truck, Star, Heart, ArrowRight, CheckCircle, ChevronDown, MessageCircle, PhoneCall, Trash2, Lock } from 'lucide-react';
import ParathaVisual from '../components/ui/ParathaVisual';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

// Hardcoded popular items for quick display on home page
const popularItems = [
  {
    id: 186,
    name: 'Cheese chilli garlic paratha',
    description: 'A mouthwatering fusion of melted cheese, spicy green chillies, and roasted garlic bits.',
    price: 80,
    image: '/images/cheese_chilli_garlic.jpg',
    isVeg: true,
    isBestSeller: true,
    rating: 4.9,
    reviews: 124,
  },
  {
    id: 167,
    name: 'Classic aloo paratha',
    description: 'Generously stuffed with spiced mashed potatoes, green chillies, and fresh coriander. A classic favorite.',
    price: 60,
    image: '/images/aloo.jpg',
    isVeg: true,
    isBestSeller: true,
    rating: 4.8,
    reviews: 312,
  },
];

const faqs = [
  {
    q: 'Do you use pure desi ghee for roasting?',
    a: 'Absolutely. Every single Paratha is brushed and slow-roasted on heavy iron tawas using 100% pure premium desi ghee or butter (as per your choice) for that authentic flaky crust and unmatched aroma.',
  },
  {
    q: 'What is the estimated delivery time?',
    a: 'We prepare every order fresh upon receipt. It takes about 10-15 minutes to roast a stuffed paratha to perfection, and our riders deliver it hot in insulated bags within 30-40 minutes depending on your distance.',
  },
  {
    q: 'Are your parathas 100% vegetarian?',
    a: 'Yes, we are a 100% pure vegetarian kitchen. We enforce strict hygiene protocols and source all ingredients fresh daily.',
  },
  {
    q: 'Do you accept corporate or bulk party orders?',
    a: 'Yes, we specialize in catering for corporate luncheons, family get-togethers, and festivals. You can reach out directly via our contact form or call button to discuss custom menus and discounts.',
  },
];

export default function HomePage() {
  const { addToCart } = useCart();
  const { isLoggedIn, customer, setIsAuthOpen } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [addedItem, setAddedItem] = useState<number | null>(null);

  // Dynamic reviews state loaded from localStorage if present, initially empty (0 reviews)
  const [reviews, setReviews] = useState<Array<{ id?: string; name: string; role: string; quote: string; rating: number }>>([]);

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRole, setNewReviewRole] = useState('');
  const [newReviewQuote, setNewReviewQuote] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          message: contactMessage
        })
      });

      if (res.ok) {
        setContactSuccess(true);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactMessage('');
        setTimeout(() => setContactSuccess(false), 5000);
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Message sent! Thank you for reaching out.');
      setContactSuccess(true);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setContactSuccess(false), 5000);
    } finally {
      setContactLoading(false);
    }
  };

  // Prefill name when customer profile loads
  useEffect(() => {
    if (customer && customer.name) {
      setNewReviewName(customer.name);
    }
  }, [customer]);

  useEffect(() => {
    const saved = localStorage.getItem('tpd_reviews');
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load reviews', e);
      }
    } else {
      setReviews([]);
    }
  }, []);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('You must be signed in to submit a review.');
      setIsAuthOpen(true);
      return;
    }

    if (!newReviewName.trim() || !newReviewQuote.trim()) return;

    const newRev = {
      id: Date.now().toString(),
      name: newReviewName.trim(),
      role: newReviewRole.trim() || 'Resident',
      quote: newReviewQuote.trim(),
      rating: newReviewRating
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem('tpd_reviews', JSON.stringify(updated));

    // Reset fields
    setNewReviewQuote('');
    setNewReviewRole('');
    setNewReviewRating(5);
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 4000);
  };

  const handleDeleteReview = (indexToDelete: number) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const updated = reviews.filter((_, idx) => idx !== indexToDelete);
      setReviews(updated);
      localStorage.setItem('tpd_reviews', JSON.stringify(updated));
    }
  };

  const handleQuickAdd = (item: typeof popularItems[0]) => {
    if (!isLoggedIn) {
      setIsAuthOpen(true);
      return;
    }
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      isVeg: item.isVeg,
    });
    setAddedItem(item.id);
    setTimeout(() => setAddedItem(null), 2000);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A]">
      {/* BACKGROUND GRAPHIC ORNAMENTS */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-0 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:py-28 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 text-left space-y-8 z-10"
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-primary uppercase">
                HYDERABAD’S PREMIER STUFFED PARATHAS
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white">
                THE PARATHA <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
                  DUNIYA
                </span>
              </h1>
              <p className="text-zinc-400 text-base sm:text-lg max-w-xl leading-relaxed">
                Indulge in a royal culinary journey. Every paratha is loaded with spiced fillings, roasted slowly in pure ghee, and served sizzling hot with hand-churned white butter.
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-4 text-xs font-semibold tracking-wide text-zinc-300">
              <span className="flex items-center bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-primary mr-1.5" />
                Freshly Made
              </span>
              <span className="flex items-center bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-primary mr-1.5" />
                Served Piping Hot
              </span>
              <span className="flex items-center bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-primary mr-1.5" />
                100% Authentic Taste
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/menu"
                className="px-8 py-4 bg-primary text-black font-bold rounded-xl text-center hover:bg-amber-400 transition-all duration-300 gold-glow"
              >
                Order Now
              </Link>
              <Link
                href="/menu#full-menu"
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl text-center border border-zinc-800 hover:bg-[#121212] hover:border-zinc-700 transition-colors"
              >
                View Menu
              </Link>
            </div>
          </motion.div>

          {/* Hero Right Steaming Paratha Visual */}
          <div className="lg:col-span-5 flex justify-center z-10">
            <ParathaVisual />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white">
            The Royal Standards of Freshness
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            What makes our kitchen Hyderabad’s absolute favorite destination for authentic stuffed flatbreads.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { icon: Flame, title: 'Fresh Ingredients', desc: 'Hand-picked organic farm vegetables and home-spiced fillings.' },
            { icon: Award, title: 'Traditional Recipes', desc: 'Authentic ancestral Punjabi spices ground in house.' },
            { icon: Truck, title: 'Express Delivery', desc: 'Insulated thermal carriers keeping food oven-fresh.' },
            { icon: ShieldCheck, title: '100% Hygienic', desc: 'Double-sanitized pure vegetarian state-of-the-art kitchen.' },
            { icon: Heart, title: 'Unmatched Taste', desc: 'Dipped in love, seasoned with premium ghee and butter.' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover:border-primary/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base tracking-wide">{item.title}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* POPULAR ITEMS */}
      <section className="relative bg-[#080808] border-t border-zinc-900 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white">
                Best-Selling Chef Curations
              </h2>
              <p className="text-zinc-400 text-sm">
                Most ordered and highly reviewed gourmet delicacies.
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-flex items-center text-primary font-semibold text-sm hover:underline"
            >
              Explore Full Menu <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="glass-panel rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:border-primary/25 group flex flex-col h-full"
              >
                {/* Image & Best Seller Tag */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {item.isBestSeller && (
                    <span className="absolute top-4 left-4 bg-primary text-black font-extrabold text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-md shadow-md">
                      BEST SELLER
                    </span>
                  )}

                  {/* Veg indicator */}
                  <span className="absolute bottom-4 left-4 flex items-center bg-black/60 px-2 py-1 rounded border border-green-600/30">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                    <span className="text-[9px] text-green-500 font-bold tracking-widest uppercase">VEG</span>
                  </span>
                </div>

                {/* Details */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-zinc-900 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Price</span>
                      <span className="text-xl font-extrabold text-white">₹{item.price}</span>
                    </div>

                    <button
                      onClick={() => handleQuickAdd(item)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        addedItem === item.id
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-900 hover:bg-primary hover:text-black border border-zinc-800 hover:border-primary text-primary'
                      }`}
                    >
                      {addedItem === item.id ? 'Added! ✓' : 'Quick Add'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS & TESTIMONIALS */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 border-t border-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white">
            What Our Patrons Say
          </h2>
          <p className="text-zinc-400 text-sm">
            Honest reviews from food bloggers, local residents, and corporate foodies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reviews List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 max-h-[580px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
          >
            {reviews.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl text-center border border-zinc-850 flex flex-col items-center justify-center space-y-4 h-[300px]">
                <Star className="w-10 h-10 text-zinc-700 animate-pulse" />
                <p className="text-zinc-400 text-sm">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              reviews.map((rev, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-2xl space-y-4 hover:border-primary/20 transition-all duration-300 relative group">
                  <div className="flex justify-between items-start">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < rev.rating ? 'fill-primary text-primary' : 'text-zinc-700'}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleDeleteReview(idx)}
                      className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-300 text-sm italic leading-relaxed text-left">
                    "{rev.quote}"
                  </p>
                  <div className="flex items-center space-x-3 pt-4 border-t border-zinc-900 text-left">
                    <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-primary text-sm uppercase">
                      {rev.name ? rev.name[0] : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{rev.name}</h4>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{rev.role}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>

          {/* Leave a Review Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-zinc-850 space-y-6 relative"
          >
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Share Your Experience</h3>
              <p className="text-xs text-zinc-400">Loved our Parathas? Let us know!</p>
            </div>

            {!isLoggedIn ? (
              <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-2xl text-center space-y-4 py-12">
                <Lock className="w-10 h-10 text-primary mx-auto" />
                <h4 className="font-bold text-white text-base">Sign In Required</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Only signed-in customers are permitted to submit food reviews. Please sign in to your profile to post a review.
                </p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-3 bg-primary text-black font-bold text-xs rounded-xl hover:bg-amber-400 gold-glow transition-all"
                >
                  Sign In to Review
                </button>
              </div>
            ) : showReviewSuccess ? (
              <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl text-center space-y-3 py-10">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
                <h4 className="font-bold text-white">Review Submitted!</h4>
                <p className="text-xs text-zinc-400">Thank you for sharing your feedback with the Paratha Duniya family.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-left">
                {/* Star rating picker */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Rating</label>
                  <div className="flex space-x-1.5">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = hoveredRating ? starVal <= hoveredRating : starVal <= newReviewRating;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setNewReviewRating(starVal)}
                          onMouseEnter={() => setHoveredRating(starVal)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              isActive ? 'fill-primary text-primary' : 'text-zinc-700'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Abhinav Shinde"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Role / Tagline */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Role / Tagline (Optional)</label>
                  <input
                    type="text"
                    value={newReviewRole}
                    onChange={(e) => setNewReviewRole(e.target.value)}
                    placeholder="Local Resident / Food Blogger"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Review Comments</label>
                  <textarea
                    required
                    value={newReviewQuote}
                    onChange={(e) => setNewReviewQuote(e.target.value)}
                    placeholder="What did you think of our parathas?"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors h-24 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-black font-bold rounded-xl text-center hover:bg-amber-400 transition-all duration-300 gold-glow text-sm"
                >
                  Submit Review
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative bg-[#080808] border-t border-zinc-900 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm">
              Answers to common queries about our culinary processes.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#111] border border-zinc-900 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between text-white font-semibold text-sm sm:text-base hover:text-primary transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${
                      activeFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-zinc-400 text-xs sm:text-sm border-t border-zinc-950/80 pt-4 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT & RESERVATION FORM */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-8 sm:p-12 rounded-3xl space-y-8 relative"
        >
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl font-bold tracking-wide text-white">
              Reach Out to Us
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Send us corporate feedback, catering requirements, or simple greetings.
            </p>
          </div>

          {contactSuccess ? (
            <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-2xl text-center space-y-3 py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
              <h3 className="font-bold text-white text-lg">Message Received!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Thank you for reaching out to Paratha Duniya. Our team will review your message and contact you back shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2 text-left">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Your Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="Rohan Shinde"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="sm:col-span-2 space-y-2 text-left">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Your Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="rohan@gmail.com"
                />
              </div>
              <div className="sm:col-span-2 space-y-2 text-left">
                <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Your Message *</label>
                <textarea
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors h-32 resize-none"
                  placeholder="Details of your catering request or feedback..."
                />
              </div>
              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full py-4 bg-primary disabled:bg-zinc-800 text-black font-bold rounded-xl text-center hover:bg-amber-400 transition-all duration-300 gold-glow text-sm disabled:cursor-not-allowed"
                >
                  {contactLoading ? 'Sending Message...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </section>

      {/* GOOGLE MAPS LOCATION SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative border-t border-zinc-900 py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white">
            Visit Our Kitchen
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Drop by to experience fresh, piping hot parathas straight from our tandoor!
          </p>
        </div>

        <div className="glass-panel overflow-hidden rounded-2xl border border-zinc-850 h-[350px] sm:h-[450px] w-full relative group shadow-2xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.9526733246835!2d78.5401238!3d17.4649987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9b7ae5545509%3A0x7a34c379688901c3!2sManoj%20Residency!5e0!3m2!1sen!2sin!4v1721345999999!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) grayscale(10%) contrast(90%)' }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 bg-black/80 backdrop-blur-md border border-zinc-850 p-4 rounded-xl max-w-xs text-left">
            <span className="text-primary font-bold text-xs uppercase tracking-wider block mb-1">Our Location</span>
            <span className="text-white text-xs sm:text-sm block leading-relaxed">
              Shop No. 5, Golden Arc Arcade, Safilguda, Hyderabad, Telangana 500056
            </span>
            <a
              href="https://www.google.com/maps/place/Manoj+Residency/@17.4646722,78.5406348,17z/data=!4m6!3m5!1s0x3bcb9b7ae5545509:0x7a34c379688901c3!8m2!3d17.4649987!4d78.5423125!16s%2Fg%2F11fsx9h02g?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-primary text-xs font-bold border-b border-primary/20 hover:border-primary pb-0.5 mt-3 transition-all"
            >
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      </motion.section>

      {/* STICKY QUICK LINKS IN FLOATING FOOTER BAR */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
        <a
          href="https://wa.me/919492760128?text=Hello%20The%20Paratha%20Duniya,%20I'd%20like%20to%20place%20an%20order!"
          target="_blank"
          rel="noreferrer"
          className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all gold-glow"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
        <a
          href="tel:+919492760128"
          className="w-12 h-12 bg-primary hover:bg-amber-400 rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all gold-glow"
          title="Click to Call"
        >
          <PhoneCall className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, Phone, User, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { cart } = useCart();
  const { customer, isLoggedIn, logout, isAuthOpen, setIsAuthOpen } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Monitor scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Full Menu', path: '/menu' },
    { name: 'Track Order', path: '/track' },
    ...(isLoggedIn ? [{ name: 'My Profile', path: '/profile' }] : []),
    { name: 'Admin Portal', path: '/admin' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'glass-navbar py-3 shadow-lg'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">
                  THE PARATHA DUNIYA
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`text-sm tracking-wide font-medium transition-colors hover:text-primary ${
                    pathname === link.path ? 'text-primary' : 'text-zinc-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-6">
              <a
                href="tel:+919492760128"
                className="flex items-center text-xs font-semibold text-zinc-400 hover:text-primary transition-colors duration-200"
              >
                <Phone className="w-3.5 h-3.5 mr-1 text-primary" />
                +91 94927 60128
              </a>

              {/* Cart Icon */}
              <Link href="/checkout" className="relative p-2 text-zinc-300 hover:text-primary transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary text-black font-bold text-xs rounded-full gold-glow">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Account Controls */}
              {isLoggedIn ? (
                <div className="flex items-center space-x-4 border-l border-zinc-800 pl-6">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Customer</span>
                    <span className="text-xs font-bold text-white max-w-[100px] truncate">{customer?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-4 py-2 bg-primary/10 border border-primary/20 hover:border-primary/50 text-primary font-bold text-xs rounded-xl hover:bg-primary hover:text-black transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Buttons */}
            <div className="flex items-center space-x-4 md:hidden">
              <Link href="/checkout" className="relative p-2 text-zinc-300 hover:text-primary transition-colors">
                <ShoppingCart className="w-5.5 h-5.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-primary text-black font-bold text-[10px] rounded-full gold-glow">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleMenu}
                className="text-zinc-300 hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isOpen && (
          <div className="md:hidden glass-panel border-t border-zinc-900 absolute top-full left-0 w-full py-4 px-6 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium tracking-wide transition-colors ${
                    pathname === link.path ? 'text-primary' : 'text-zinc-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <hr className="border-zinc-800" />
              <div className="flex flex-col space-y-3">
                <a
                  href="tel:+919492760128"
                  className="flex items-center text-sm font-semibold text-zinc-400 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2 text-primary" />
                  Call: +91 94927 60128
                </a>

                {isLoggedIn ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Logged In As</span>
                      <span className="text-xs font-semibold text-white">{customer?.name}</span>
                    </div>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setIsAuthOpen(true); setIsOpen(false); }}
                    className="w-full py-2.5 bg-primary text-black font-bold rounded-lg text-sm text-center hover:bg-amber-400 transition-colors gold-glow"
                  >
                    Sign In / Create Account
                  </button>
                )}

                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 rounded-lg border border-primary/20 text-primary font-bold text-center hover:bg-primary/10 transition-colors"
                >
                  Checkout Now ({cartCount} items)
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal Container */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

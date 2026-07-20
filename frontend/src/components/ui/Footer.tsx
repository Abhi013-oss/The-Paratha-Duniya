'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, MessageSquare, Clock, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#090909] border-t border-zinc-900 mt-auto">
      {/* Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h3 className="font-serif text-2xl font-semibold tracking-wide text-white">
              Subscribe to the Duniya Chronicles
            </h3>
            <p className="text-zinc-400 mt-2 text-sm max-w-md">
              Receive secret recipes, limited-edition chef releases, and exclusive golden hour discount coupons directly.
            </p>
          </div>
          <div>
            <form onSubmit={(e) => e.preventDefault()} className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-4 py-3 bg-[#121212] border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary transition-colors"
                required
              />
              <button
                type="submit"
                className="px-5 py-3 bg-primary text-black font-semibold text-sm rounded-lg hover:bg-amber-400 gold-glow transition-all duration-300"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div>
            <span className="font-serif text-2xl font-bold tracking-wider text-primary">
              THE PARATHA DUNIYA
            </span>
            <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
              Serving the absolute finest, butterloaded, luxury Indian stuffed flatbreads. Prepared using generational recipes and roasted to golden perfection.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#121212] text-zinc-400 hover:text-primary border border-zinc-800 hover:border-primary/30 transition-all"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a
                href="https://wa.me/919492760128"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#121212] text-zinc-400 hover:text-primary border border-zinc-800 hover:border-primary/30 transition-all"
                aria-label="WhatsApp"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-widest uppercase mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/menu" className="text-zinc-400 hover:text-primary text-sm transition-colors">
                  Explore Full Menu
                </Link>
              </li>
              <li>
                <Link href="/menu#popular" className="text-zinc-400 hover:text-primary text-sm transition-colors">
                  Popular Best-Sellers
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-zinc-400 hover:text-primary text-sm transition-colors">
                  Merchant Access (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Timings & Operations */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-widest uppercase mb-6">
              Hours of Joy
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Mon - Thu: 11:00 AM - 11:00 PM</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-white font-medium">Fri - Sun: 11:00 AM - 01:00 AM</span>
              </li>
              <li className="border-t border-zinc-900 pt-3 mt-3 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:punnushri084@gmail.com" className="hover:text-primary transition-colors">
                  punnushri084@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Location & Map */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-widest uppercase mb-6">
              Find Us
            </h4>
            <div className="text-sm text-zinc-400 space-y-3">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Shop No. 5, Golden Arc Arcade, Safilguda, Hyderabad, Telangana 500056</span>
              </p>
              <a
                href="https://www.google.com/maps/place/Manoj+Residency/@17.4646722,78.5406348,17z/data=!4m6!3m5!1s0x3bcb9b7ae5545509:0x7a34c379688901c3!8m2!3d17.4649987!4d78.5423125!16s%2Fg%2F11fsx9h02g?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold border-b border-primary/30 hover:border-primary pb-0.5 mt-2 transition-all"
              >
                <span>View Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#050505] border-t border-zinc-950/80 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} The Paratha Duniya. All rights reserved.</p>
          <p className="flex items-center space-x-3 text-zinc-600">
            <span>Premium Taste</span>
            <span>•</span>
            <span>Generational Traditions</span>
            <span>•</span>
            <span>Made in Hyderabad</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

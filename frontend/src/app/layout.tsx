import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'THE PARATHA DUNIYA | Premium Luxury Stuffed Flatbreads',
  description: 'Experience Hyderabad’s finest, butterloaded, gourmet Parathas. Crafted from generational secret recipes and served piping hot with fresh home-made white butter.',
  manifest: '/manifest.json',
  keywords: ['Paratha', 'Hyderabad Food', 'Indian Bread', 'Loni Paratha', 'Luxury Dining Hyderabad', 'Order Paratha Online'],
  openGraph: {
    title: 'THE PARATHA DUNIYA | Premium Indian Stuffed Flatbreads',
    description: 'Hyderabad’s finest, butterloaded, gourmet Parathas served hot.',
    url: 'https://theparathaduniya.com',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'The Paratha Duniya Signature Platter',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full dark`}>
      <head>
        {/* Load Razorpay Checkout Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        {/* Load Google Identity Services Client Script */}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

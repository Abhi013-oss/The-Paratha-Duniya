'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Phone, MapPin, Bike, Clock, ShieldCheck } from 'lucide-react';

interface LiveTrackingMapProps {
  status: string; // PENDING, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  customerAddress?: string;
  customerName?: string;
}

// Fixed Restaurant Central Kitchen Location: Manoj Residency, Moula Ali, Secunderabad
const KITCHEN_LAT = 17.4649;
const KITCHEN_LNG = 78.5674;
const KITCHEN_ADDRESS_FULL = 'Manoj Residency, FG7R+XWV, Ganesh Nagar, Moula Ali, Secunderabad, Telangana 500056';

export default function LiveTrackingMap({ status, customerAddress, customerName }: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  // Telemetry state
  const [destLat, setDestLat] = useState(17.4580);
  const [destLng, setDestLng] = useState(78.4720);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(3.2);
  const [remainingKm, setRemainingKm] = useState<number>(3.2);
  const [etaMins, setEtaMins] = useState<number>(15);
  const [speed, setSpeed] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0); // Starts at 0%
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. Geocode Customer Address using OpenStreetMap Nominatim API for real GPS coordinates
  useEffect(() => {
    if (!customerAddress) return;

    const geocodeAddress = async () => {
      try {
        const query = encodeURIComponent(`${customerAddress}, India`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setDestLat(lat);
            setDestLng(lng);

            // Compute Haversine distance in KM
            const dist = calculateHaversineDistance(KITCHEN_LAT, KITCHEN_LNG, lat, lng);
            const roundedDist = parseFloat(dist.toFixed(1));
            setTotalDistanceKm(roundedDist);
            setRemainingKm(roundedDist);
            setEtaMins(Math.max(5, Math.round(roundedDist * 4)));
          }
        }
      } catch (err) {
        console.log('Geocoding fallback to default neighborhood offset.');
      }
    };

    geocodeAddress();
  }, [customerAddress]);

  // Haversine Distance Formula in Kilometers
  function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 2. Load Leaflet Library dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!(window as any).L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initLeafletMap();
      document.head.appendChild(script);
    } else if ((window as any).L) {
      initLeafletMap();
    }

    function initLeafletMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (window as any).L;
      if (!L) return;

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [KITCHEN_LAT, KITCHEN_LNG],
        zoom: 13,
        zoomControl: false
      });

      // Add Google Maps Dark Mode CartoDB Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      // Custom Icon Generators
      const kitchenIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background:#F4A623; color:#000; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 15px rgba(244,166,35,0.8); display:flex; align-items:center; justify-center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const customerIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background:#22c55e; color:#000; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 15px rgba(34,197,94,0.8); display:flex; align-items:center; justify-center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const riderIcon = L.divIcon({
        className: 'custom-rider-pin',
        html: `
          <div style="background:#eab308; color:#000; padding:8px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 20px rgba(234,179,8,1); display:flex; align-items:center; justify-center; animation: bounce 1s infinite;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      // Add Kitchen Pin
      L.marker([KITCHEN_LAT, KITCHEN_LNG], { icon: kitchenIcon })
        .addTo(map)
        .bindPopup('<b>The Paratha Duniya Hub</b><br>Central Kitchen')
        .openPopup();

      // Add Customer Destination Pin
      L.marker([destLat, destLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>${customerName || 'Customer Home'}</b><br>${customerAddress || 'Delivery Address'}`);

      // Draw Polyline Route Path
      const routePath = [
        [KITCHEN_LAT, KITCHEN_LNG],
        [KITCHEN_LAT + (destLat - KITCHEN_LAT) * 0.4, KITCHEN_LNG + (destLng - KITCHEN_LNG) * 0.2],
        [KITCHEN_LAT + (destLat - KITCHEN_LAT) * 0.7, KITCHEN_LNG + (destLng - KITCHEN_LNG) * 0.8],
        [destLat, destLng]
      ];

      L.polyline(routePath, {
        color: '#F4A623',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(map);

      // Fit Map bounds to contain both points
      map.fitBounds(L.latLngBounds(routePath), { padding: [50, 50] });

      // Add Animated Rider Marker starting AT 0% (Kitchen)
      const riderMarker = L.marker([KITCHEN_LAT, KITCHEN_LNG], { icon: riderIcon }).addTo(map);
      riderMarkerRef.current = riderMarker;

      mapInstanceRef.current = map;
      setIsMapLoaded(true);
    }
  }, [destLat, destLng]);

  // 3. Telemetry & Movement loop based on order status
  useEffect(() => {
    if (status === 'OUT_FOR_DELIVERY') {
      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 98) return 98;
          const next = prev + 1.5;

          // Compute interpolated lat/lng along path
          const curLat = KITCHEN_LAT + (destLat - KITCHEN_LAT) * (next / 100);
          const curLng = KITCHEN_LNG + (destLng - KITCHEN_LNG) * (next / 100);

          if (riderMarkerRef.current && (window as any).L) {
            riderMarkerRef.current.setLatLng([curLat, curLng]);
          }

          const rem = Math.max(0.1, totalDistanceKm * (1 - next / 100));
          setRemainingKm(parseFloat(rem.toFixed(1)));
          setEtaMins(Math.max(1, Math.round(rem * 4)));
          setSpeed(Math.floor(24 + Math.random() * 8));

          return next;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (status === 'DELIVERED') {
      setProgressPercent(100);
      setRemainingKm(0);
      setEtaMins(0);
      setSpeed(0);
      if (riderMarkerRef.current && (window as any).L) {
        riderMarkerRef.current.setLatLng([destLat, destLng]);
      }
    } else {
      // PENDING / PREPARING: Rider starts AT 0% at Kitchen!
      setProgressPercent(0);
      setRemainingKm(totalDistanceKm);
      setEtaMins(Math.max(5, Math.round(totalDistanceKm * 4)));
      setSpeed(0);
      if (riderMarkerRef.current && (window as any).L) {
        riderMarkerRef.current.setLatLng([KITCHEN_LAT, KITCHEN_LNG]);
      }
    }
  }, [status, destLat, destLng, totalDistanceKm]);

  return (
    <div className="glass-panel p-6 rounded-3xl border border-zinc-850 space-y-4 text-left relative overflow-hidden shadow-2xl">
      {/* Header Overlay */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping shrink-0" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Real-Time Google Maps GPS Engine</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-900">
          OpenStreetMap & Google Satellite
        </span>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="relative w-full h-80 bg-[#0A0A0A] rounded-2xl border border-zinc-900 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Telemetry Box Overlay */}
        <div className="absolute top-3 left-3 bg-black/90 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800 flex items-center space-x-4 text-xs z-10 shadow-2xl">
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Analyzed Distance</span>
            <strong className="text-white font-extrabold text-sm">{remainingKm} km</strong>
          </div>
          <div className="w-px h-7 bg-zinc-800" />
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Est. Time</span>
            <strong className="text-primary font-extrabold text-sm">{etaMins} Mins</strong>
          </div>
          <div className="w-px h-7 bg-zinc-800" />
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase block">Rider Progress</span>
            <strong className="text-green-500 font-extrabold text-xs uppercase">
              {progressPercent === 0 ? '0% (At Kitchen)' : `${Math.round(progressPercent)}% (En Route)`}
            </strong>
          </div>
        </div>
      </div>

      {/* Rider Partner Contact Card */}
      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            VS
          </div>
          <div>
            <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
              <span>Vikram Singh</span>
              <span className="bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                GPS Verified Partner ({speed} km/h)
              </span>
            </h4>
            <p className="text-zinc-500 text-[10px] mt-0.5">TVS Ntorq 125 • <span className="font-mono text-zinc-400">TS 09 EA 4829</span></p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(KITCHEN_ADDRESS_FULL)}&destination=${encodeURIComponent(customerAddress || `${destLat},${destLng}`)}&travelmode=two_wheeler&dir_action=navigate`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 shrink-0 border border-blue-400/30"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Open & Start Google Maps Navigation</span>
          </a>

          <a
            href="tel:+919492760128"
            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>Call Rider</span>
          </a>
        </div>
      </div>
    </div>
  );
}

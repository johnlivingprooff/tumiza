import { useState } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Package, Truck, Eye, Lock, Search, Menu, X } from "lucide-react";
import IndustrialConstellationCanvas from "@/components/effects/IndustrialConstellationCanvas";

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track/${trackingNumber.trim()}`);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const processSteps = [
    {
      num: "01 - REG",
      title: "REGISTER PARCEL",
      desc: "Officer scans QR code and generates a unique tracking number and collection PIN.",
      icon: Package,
    },
    {
      num: "02 - TRN",
      title: "AUTOMATED TRANSIT",
      desc: "SMS notifications are triggered automatically as the parcel passes through origin, transit, and destination hubs.",
      icon: Truck,
    },
    {
      num: "03 - VIS",
      title: "REAL-TIME TRACKING",
      desc: "Customers view a live timeline and estimated arrival time on the public portal.",
      icon: Eye,
    },
    {
      num: "04 - COL",
      title: "SECURE COLLECTION",
      desc: "Receiver verifies their identity with a system-generated PIN at the destination station.",
      icon: Lock,
    },
  ];

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <Link
          to="/"
          className="font-mono text-sm uppercase tracking-widest text-white hover:text-signal-red transition-colors"
        >
          TUMIZA
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="font-mono text-xs uppercase tracking-widest text-white hover:text-signal-red transition-colors"
          >
            HOW IT WORKS
          </button>
          <Link
            to="/track"
            className="font-mono text-xs uppercase tracking-widest text-white hover:text-signal-red transition-colors"
          >
            TRACK
          </Link>
          <Link
            to="/login"
            className="font-mono text-xs uppercase tracking-widest text-white hover:text-signal-red transition-colors"
          >
            SIGN IN
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-obsidian/95 flex flex-col items-center justify-center gap-8 md:hidden">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="font-mono text-lg uppercase tracking-widest text-white hover:text-signal-red"
          >
            HOW IT WORKS
          </button>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="font-mono text-lg uppercase tracking-widest text-white hover:text-signal-red"
          >
            TRACK
          </Link>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="font-mono text-lg uppercase tracking-widest text-white hover:text-signal-red"
          >
            SIGN IN
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <IndustrialConstellationCanvas />

        <div className="relative z-10 text-center px-6" style={{ mixBlendMode: "exclusion" }}>
          <h1 className="font-sans text-[40px] md:text-[80px] uppercase font-normal tracking-[0.05em] text-white leading-tight">
            TRACK WITH PRECISION
          </h1>
          <p className="font-mono text-sm text-cool-grey uppercase tracking-[0.1em] mt-4 max-w-[400px] mx-auto">
            Real-time visibility for parcels moving across Malawi
          </p>

          <form onSubmit={handleTrack} className="mt-10 flex flex-col sm:flex-row items-center gap-3 justify-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter Tracking Number"
                className="w-full bg-transparent border border-white/30 text-white font-mono text-sm uppercase tracking-wider py-3 pl-10 pr-4 rounded-full focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all placeholder:text-white/30"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 border border-white/30 rounded-full font-mono text-xs uppercase tracking-widest text-white hover:bg-signal-red hover:border-signal-red transition-all active:scale-[0.98]"
            >
              TRACK
            </button>
          </form>
        </div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-cool-grey py-20 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs text-signal-red tracking-[0.2em] uppercase mb-2">
            OPERATIONAL FLOW
          </p>
          <h2 className="font-sans text-2xl md:text-[32px] uppercase tracking-tight mb-12">
            FROM DROP OFF TO DELIVERY
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {processSteps.map((step) => (
              <div
                key={step.num}
                className="group border border-black/10 bg-white/50 p-6 hover:shadow-harsh hover:-translate-y-1 transition-all duration-200 cursor-default"
              >
                <div className="flex justify-between items-start mb-4">
                  <step.icon size={20} className="text-signal-red" />
                  <span className="font-mono text-[10px] text-black/40 tracking-wider">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-mono text-sm uppercase tracking-wider mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-black/60 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Stream Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>
              STATUS: IN_TRANSIT /// PARCEL_ID: TMZ-260001 /// NODE: LILONGWE
              &nbsp;&nbsp;&nbsp;&nbsp;
              STATUS: DISPATCHED /// PARCEL_ID: TMZ-258442 /// NODE: KASUNGU
              &nbsp;&nbsp;&nbsp;&nbsp;
              STATUS: COLLECTED /// PARCEL_ID: TMZ-189221 /// NODE: MZUZU
              &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Status Visualization Section */}
      <section className="relative bg-obsidian py-20 md:py-32 px-6 md:px-12 overflow-hidden">
        <div className="scanline-grid" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <h2 className="font-mono text-xs text-white/60 tracking-[0.2em] uppercase text-center mb-16">
            LIVE NETWORK STATUS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { label: "ACTIVE PARCELS", value: "1,240" },
              { label: "STATIONS ONLINE", value: "15" },
              { label: "DELIVERY SUCCESS RATE", value: "98.6%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-sans text-5xl md:text-6xl text-white font-normal tracking-tight mb-2">
                  {stat.value}
                </div>
                <div className="font-mono text-xs text-white/40 tracking-[0.15em] uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Malawi Stations Map */}
          <div className="relative max-w-2xl mx-auto">
            <svg viewBox="0 0 400 600" className="w-full h-auto">
              {/* Simplified Malawi outline */}
              <path
                d="M 120 50 L 200 45 L 260 55 L 280 80 L 290 120 L 285 160 L 270 200 L 260 250 L 250 300 L 245 350 L 240 400 L 235 450 L 230 500 L 200 540 L 180 560 L 160 570 L 150 560 L 140 530 L 135 480 L 130 420 L 125 360 L 120 300 L 115 240 L 110 180 L 105 120 L 110 80 Z"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
              {/* Station dots */}
              {[
                { cx: 180, cy: 250, name: "Lilongwe" },
                { cx: 220, cy: 80, name: "Mzuzu" },
                { cx: 190, cy: 450, name: "Blantyre" },
                { cx: 200, cy: 500, name: "Zomba" },
                { cx: 150, cy: 180, name: "Kasungu" },
                { cx: 170, cy: 350, name: "Dedza" },
              ].map((station) => (
                <g key={station.name}>
                  <circle
                    cx={station.cx}
                    cy={station.cy}
                    r="4"
                    fill="#FF2A00"
                    className="animate-pulse"
                  />
                  <text
                    x={station.cx + 10}
                    y={station.cy + 4}
                    fill="rgba(255,255,255,0.5)"
                    fontSize="10"
                    fontFamily="Geist Mono, monospace"
                  >
                    {station.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/track"
              className="inline-block px-8 py-3 border border-white/30 font-mono text-xs uppercase tracking-widest text-white hover:bg-signal-red hover:border-signal-red transition-all active:scale-[0.98]"
            >
              TRACK A PARCEL
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-obsidian border-t border-white/10 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-mono text-sm uppercase tracking-widest text-white">
            TUMIZA
          </div>
          <div className="font-mono text-xs text-white/40 tracking-wider">
            PARCEL TRACKING & VISIBILITY PLATFORM
          </div>
          <div className="font-mono text-xs text-white/30">
            &copy; 2025 Tumiza. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

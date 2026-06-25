import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Plus,
  Search,
  QrCode,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChevronRight,
  Clock,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  registered: { label: "REGISTERED", color: "text-gray-600", bg: "bg-gray-50" },
  received: { label: "RECEIVED", color: "text-blue-600", bg: "bg-blue-50" },
  dispatched: { label: "DISPATCHED", color: "text-amber-600", bg: "bg-amber-50" },
  in_transit: { label: "IN TRANSIT", color: "text-orange-600", bg: "bg-orange-50" },
  arrived: { label: "ARRIVED", color: "text-teal-600", bg: "bg-teal-50" },
  ready_for_collection: { label: "READY", color: "text-signal-red", bg: "bg-red-50" },
  collected: { label: "COLLECTED", color: "text-green-600", bg: "bg-green-50" },
  delayed: { label: "DELAYED", color: "text-red-600", bg: "bg-red-50" },
  returned: { label: "RETURNED", color: "text-purple-600", bg: "bg-purple-50" },
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recentParcels, isLoading: parcelsLoading } = trpc.parcel.list.useQuery(
    { limit: 10, offset: 0 },
    { enabled: !!user }
  );

  const { data: searchResults } = trpc.parcel.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 3 && !!user }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cool-grey flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-signal-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayParcels = searchQuery.length >= 3 ? searchResults : recentParcels;

  return (
    <div className="min-h-screen bg-cool-grey">
      {/* Header */}
      <header className="bg-white border-b border-black/10 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-mono text-sm uppercase tracking-widest text-black hover:text-signal-red transition-colors"
          >
            TUMIZA
          </Link>
          <span className="hidden md:inline text-black/20">|</span>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider text-black/40">
            OFFICER DASHBOARD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-black/50 hidden sm:inline">
            {user.name ?? "Officer"}
          </span>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className="font-mono text-[10px] uppercase tracking-wider text-signal-red hover:underline"
            >
              ADMIN
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-black/40 hover:text-signal-red transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">EXIT</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            {
              icon: Plus,
              label: "REGISTER PARCEL",
              path: "/parcels/register",
              color: "bg-signal-red text-white hover:bg-signal-red/90",
            },
            {
              icon: Search,
              label: "SEARCH PARCEL",
              action: () => document.getElementById("search-input")?.focus(),
              color: "bg-white text-black border border-black/10 hover:border-signal-red",
            },
            {
              icon: QrCode,
              label: "SCAN QR CODE",
              path: "/parcels/scan",
              color: "bg-white text-black border border-black/10 hover:border-signal-red",
            },
            {
              icon: Package,
              label: "UPDATE STATUS",
              action: () => document.getElementById("search-input")?.focus(),
              color: "bg-white text-black border border-black/10 hover:border-signal-red",
            },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() => {
                if (card.path) navigate(card.path);
                else if (card.action) card.action();
              }}
              className={`group flex flex-col items-center gap-3 p-6 ${card.color} transition-all active:scale-[0.98] shadow-harsh hover:shadow-harsh-red`}
            >
              <card.icon size={24} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-center">
                {card.label}
              </span>
            </button>
          ))}
        </div>

        {/* Search Section */}
        <div className="bg-white border border-black/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={16} />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tracking number, phone, or name..."
              className="w-full pl-10 pr-4 py-3 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "IN TRANSIT", value: "0", icon: Truck },
            { label: "ARRIVED", value: "0", icon: CheckCircle },
            { label: "READY", value: "0", icon: Package },
            { label: "DELAYED", value: "0", icon: AlertCircle },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-black/10 p-4 flex items-center gap-3">
              <stat.icon size={18} className="text-signal-red" />
              <div>
                <p className="font-mono text-lg font-semibold">{stat.value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Parcels Table */}
        <div className="bg-white border border-black/10">
          <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-wider">
              {searchQuery.length >= 3 ? "SEARCH RESULTS" : "RECENT PARCELS"}
            </h2>
            <span className="font-mono text-[10px] text-black/40">
              {displayParcels?.length ?? 0} found
            </span>
          </div>

          {parcelsLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-signal-red border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : displayParcels && displayParcels.length > 0 ? (
            <div className="divide-y divide-black/5">
              {displayParcels.map((parcel) => {
                const status = statusConfig[parcel.status] ?? statusConfig.registered;
                return (
                  <button
                    key={parcel.id}
                    onClick={() => navigate(`/parcels/${parcel.id}`)}
                    className="w-full px-4 py-4 flex items-center gap-4 hover:bg-black/[0.02] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-mono text-sm text-signal-red tracking-tight">
                          {parcel.trackingNumber}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${status.color} ${status.bg}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-black/40">
                        <span>{parcel.senderName}</span>
                        <span className="text-black/20">&rarr;</span>
                        <span>{parcel.receiverName}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-black/30">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(parcel.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-black/20" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package size={32} className="mx-auto mb-3 text-black/10" />
              <p className="font-mono text-xs uppercase tracking-wider text-black/30">
                No parcels found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, MapPin, Truck, Package, CheckCircle, Clock, AlertCircle, RotateCcw } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  registered: { label: "REGISTERED", icon: Package, color: "text-gray-600" },
  received: { label: "RECEIVED", icon: Package, color: "text-blue-600" },
  dispatched: { label: "DISPATCHED", icon: Truck, color: "text-amber-600" },
  in_transit: { label: "IN TRANSIT", icon: Truck, color: "text-orange-600" },
  arrived: { label: "ARRIVED", icon: MapPin, color: "text-teal-600" },
  ready_for_collection: { label: "READY FOR COLLECTION", icon: CheckCircle, color: "text-signal-red" },
  collected: { label: "COLLECTED", icon: CheckCircle, color: "text-green-600" },
  delayed: { label: "DELAYED", icon: AlertCircle, color: "text-red-600" },
  returned: { label: "RETURNED", icon: RotateCcw, color: "text-purple-600" },
};

const statusOrder = [
  "registered",
  "received",
  "dispatched",
  "in_transit",
  "arrived",
  "ready_for_collection",
  "collected",
];

export default function TrackingPage() {
  const { trackingNumber: urlTrackingNumber } = useParams<{ trackingNumber?: string }>();
  const [searchInput, setSearchInput] = useState(urlTrackingNumber ?? "");
  const [activeSearch, setActiveSearch] = useState(urlTrackingNumber ?? "");
  const navigate = useNavigate();

  const { data: parcel, isLoading } = trpc.parcel.track.useQuery(
    { trackingNumber: activeSearch },
    { enabled: activeSearch.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveSearch(searchInput.trim());
      navigate(`/track/${searchInput.trim()}`, { replace: true });
    }
  };

  const getStatusIndex = (status: string) => statusOrder.indexOf(status);

  return (
    <div className="min-h-screen bg-cool-grey">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-black/10 px-4 md:px-8 py-3 flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-black/60 hover:text-signal-red transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <Link
          to="/"
          className="font-mono text-sm uppercase tracking-widest text-black hover:text-signal-red transition-colors"
        >
          TUMIZA
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="font-sans text-2xl md:text-3xl uppercase tracking-tight mb-6">
            TRACK YOUR PARCEL
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Tracking Number"
              className="flex-1 px-4 py-3 border border-black/10 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all"
            >
              TRACK
            </button>
          </form>
        </div>

        {/* Loading */}
        {isLoading && activeSearch && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-signal-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-xs uppercase tracking-wider text-black/40">
              Searching...
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && activeSearch && !parcel && (
          <div className="text-center py-16 border border-black/10 bg-white">
            <AlertCircle size={32} className="mx-auto mb-4 text-black/20" />
            <p className="font-mono text-sm uppercase tracking-wider text-black/40 mb-2">
              No parcel found
            </p>
            <p className="text-sm text-black/30">
              Please check your tracking number and try again
            </p>
          </div>
        )}

        {/* Results */}
        {parcel && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white border border-black/10 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">
                    TRACKING NUMBER
                  </p>
                  <p className="font-mono text-3xl md:text-4xl text-signal-red tracking-tight">
                    {parcel.trackingNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = statusConfig[parcel.status] ?? statusConfig.registered;
                    const Icon = config.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-wider ${config.color} border-current`}
                      >
                        <Icon size={14} />
                        {config.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Route Card */}
              <div className="flex items-center gap-4 py-4 border-t border-black/5">
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40 mb-1">
                    FROM
                  </p>
                  <p className="font-sans text-lg">{parcel.originStation?.name ?? "Unknown"}</p>
                </div>

                {/* Route Line with Animated Dot */}
                <div className="flex-[2] relative h-px bg-black/10 mx-4">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-signal-red rounded-full"
                    style={{
                      left: `${Math.min(
                        (getStatusIndex(parcel.status) / (statusOrder.length - 1)) * 100,
                        100
                      )}%`,
                      transition: "left 0.5s ease",
                    }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full">
                    {statusOrder.slice(0, -1).map((s, i) => (
                      <div
                        key={s}
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{
                          left: `${(i / (statusOrder.length - 1)) * 100}%`,
                          backgroundColor:
                            getStatusIndex(parcel.status) >= i
                              ? "#FF2A00"
                              : "rgba(0,0,0,0.1)",
                          transition: "background-color 0.3s",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40 mb-1">
                    TO
                  </p>
                  <p className="font-sans text-lg">{parcel.destinationStation?.name ?? "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                PARCEL INFORMATION
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">SENDER</p>
                  <p className="text-sm">{parcel.senderName}</p>
                  <p className="text-sm text-black/50">{parcel.senderPhone}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">RECEIVER</p>
                  <p className="text-sm">{parcel.receiverName}</p>
                  <p className="text-sm text-black/50">{parcel.receiverPhone}</p>
                  {(parcel as any).receiverLandmark && (
                    <p className="text-xs text-black/40 mt-1 italic">{(parcel as any).receiverLandmark}</p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">CATEGORY</p>
                  <p className="text-sm capitalize">{parcel.category}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">DATE SENT</p>
                  <p className="text-sm">{new Date(parcel.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
                {(parcel as any).weightKg && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">WEIGHT</p>
                    <p className="text-sm">{(parcel as any).weightKg} kg</p>
                  </div>
                )}
                {(parcel as any).declaredValueMwk && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">DECLARED VALUE</p>
                    <p className="text-sm">MWK {Number((parcel as any).declaredValueMwk).toLocaleString()}</p>
                  </div>
                )}
              </div>
              {parcel.description && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">DESCRIPTION</p>
                  <p className="text-sm text-black/70">{parcel.description}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">
                PARCEL JOURNEY
              </p>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-black/10" />

                <div className="space-y-0">
                  {[...parcel.events].reverse().map((event, idx) => {
                    const config = statusConfig[event.status] ?? statusConfig.registered;
                    const Icon = config.icon;
                    const isLatest = idx === 0;
                    return (
                      <div
                        key={event.id}
                        className={`relative flex items-start gap-4 py-4 ${
                          isLatest ? "border-l-2 border-l-signal-red -ml-0 pl-[18px]" : "pl-5"
                        }`}
                      >
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border ${
                            isLatest
                              ? "bg-signal-red border-signal-red text-white"
                              : "bg-white border-black/10 text-black/40"
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-mono text-xs uppercase tracking-wider ${isLatest ? "text-signal-red" : "text-black/60"}`}>
                              {config.label}
                            </p>
                            <p className="font-mono text-[10px] text-black/30 whitespace-nowrap">
                              {new Date(event.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <p className="text-sm text-black/50 mt-1">
                            {event.stationId === parcel.originStationId
                              ? parcel.originStation?.name
                              : event.stationId === parcel.destinationStationId
                              ? parcel.destinationStation?.name
                              : parcel.currentStation?.name}
                            {" — "}
                            {event.notes}
                          </p>
                          <p className="text-[10px] text-black/30 mt-1">
                            by {event.officerName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Estimated Arrival */}
            {parcel.estimatedArrival && parcel.status !== "collected" && (
              <div className="bg-white border border-black/10 p-6 flex items-center gap-4">
                <Clock size={20} className="text-signal-red" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">
                    EXPECTED ARRIVAL
                  </p>
                  <p className="font-sans text-lg">
                    {new Date(parcel.estimatedArrival).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

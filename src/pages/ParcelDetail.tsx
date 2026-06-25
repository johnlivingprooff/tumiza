import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Printer,
  QrCode,
  Shield,
} from "lucide-react";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string; nextStatuses: string[] }> = {
  registered: {
    label: "REGISTERED",
    icon: Package,
    color: "text-gray-600",
    nextStatuses: ["received", "delayed"],
  },
  received: {
    label: "RECEIVED",
    icon: Package,
    color: "text-blue-600",
    nextStatuses: ["dispatched", "delayed"],
  },
  dispatched: {
    label: "DISPATCHED",
    icon: Truck,
    color: "text-amber-600",
    nextStatuses: ["in_transit", "delayed"],
  },
  in_transit: {
    label: "IN TRANSIT",
    icon: Truck,
    color: "text-orange-600",
    nextStatuses: ["arrived", "delayed"],
  },
  arrived: {
    label: "ARRIVED",
    icon: MapPin,
    color: "text-teal-600",
    nextStatuses: ["ready_for_collection", "delayed"],
  },
  ready_for_collection: {
    label: "READY FOR COLLECTION",
    icon: CheckCircle,
    color: "text-signal-red",
    nextStatuses: ["collected", "delayed"],
  },
  collected: {
    label: "COLLECTED",
    icon: CheckCircle,
    color: "text-green-600",
    nextStatuses: [],
  },
  delayed: {
    label: "DELAYED",
    icon: AlertCircle,
    color: "text-red-600",
    nextStatuses: ["in_transit", "dispatched"],
  },
  returned: {
    label: "RETURNED",
    icon: RotateCcw,
    color: "text-purple-600",
    nextStatuses: [],
  },
};

export default function ParcelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();

  const parcelId = Number(id);
  const { data: parcel, isLoading } = trpc.parcel.getById.useQuery(
    { id: parcelId },
    { enabled: !!parcelId && !!user }
  );

  const { data: stations } = trpc.station.list.useQuery();

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [selectedStation, setSelectedStation] = useState<number | undefined>();
  const [pinInput, setPinInput] = useState("");
  const [showPinVerify, setShowPinVerify] = useState(false);

  const updateStatusMutation = trpc.parcel.updateStatus.useMutation({
    onSuccess: () => {
      utils.parcel.getById.invalidate({ id: parcelId });
      setSelectedStatus("");
      setStatusNotes("");
    },
  });

  const verifyCollectionMutation = trpc.parcel.verifyCollection.useMutation({
    onSuccess: () => {
      utils.parcel.getById.invalidate({ id: parcelId });
      setPinInput("");
      setShowPinVerify(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cool-grey flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-signal-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="min-h-screen bg-cool-grey flex flex-col items-center justify-center">
        <p className="font-mono text-sm uppercase text-black/40 mb-4">Parcel not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  const currentStatus = statusConfig[parcel.status] ?? statusConfig.registered;
  const StatusIcon = currentStatus.icon;
  const availableNextStatuses = currentStatus.nextStatuses;

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateStatusMutation.mutate({
      id: parcelId,
      status: selectedStatus as "registered" | "received" | "dispatched" | "in_transit" | "arrived" | "ready_for_collection" | "collected" | "delayed" | "returned",
      stationId: selectedStation,
      notes: statusNotes || undefined,
    });
  };

  const handleVerifyPin = () => {
    verifyCollectionMutation.mutate({ parcelId, pin: pinInput });
  };

  return (
    <div className="min-h-screen bg-cool-grey">
      {/* Header */}
      <header className="bg-white border-b border-black/10 px-4 md:px-8 py-3 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-black/60 hover:text-signal-red transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <Link
          to="/"
          className="font-mono text-sm uppercase tracking-widest text-black hover:text-signal-red transition-colors"
        >
          TUMIZA
        </Link>
        <span className="text-black/20">|</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-black/40">
          PARCEL DETAILS
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Tracking Number & Status */}
        <div className="bg-white border border-black/10 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-1">
                TRACKING NUMBER
              </p>
              <p className="font-mono text-3xl text-signal-red tracking-tight">
                {parcel.trackingNumber}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-wider ${currentStatus.color} border-current`}
            >
              <StatusIcon size={14} />
              {currentStatus.label}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-black/5">
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">FROM</p>
              <p className="font-sans">{parcel.originStation?.name ?? "Unknown"}</p>
            </div>
            <Truck size={16} className="text-black/20" />
            <div className="flex-1 text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">TO</p>
              <p className="font-sans">{parcel.destinationStation?.name ?? "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white border border-black/10 p-6 flex items-center gap-6">
          <div className="w-24 h-24 bg-black/5 flex items-center justify-center flex-shrink-0">
            <QrCode size={36} className="text-black/30" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-black/40 mb-1">
              QR CODE
            </p>
            <p className="text-sm text-black/60">Scan to quickly access this parcel</p>
            <p className="font-mono text-xs text-black/30 mt-1">{parcel.qrCodeData ?? parcel.trackingNumber}</p>
          </div>
        </div>

        {/* Sender / Receiver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-3">
              SENDER
            </p>
            <p className="font-sans text-lg">{parcel.senderName}</p>
            <p className="text-sm text-black/50">{parcel.senderPhone}</p>
          </div>
          <div className="bg-white border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-3">
              RECEIVER
            </p>
            <p className="font-sans text-lg">{parcel.receiverName}</p>
            <p className="text-sm text-black/50">{parcel.receiverPhone}</p>
          </div>
        </div>

        {/* Update Status */}
        {availableNextStatuses.length > 0 && (
          <div className="bg-white border border-black/10 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
              UPDATE STATUS
            </p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {availableNextStatuses.map((status) => {
                  const config = statusConfig[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-all ${
                        selectedStatus === status
                          ? "bg-signal-red text-white border-signal-red"
                          : "border-black/10 text-black/60 hover:border-signal-red hover:text-signal-red"
                      }`}
                    >
                      {config?.label ?? status}
                    </button>
                  );
                })}
              </div>

              {selectedStatus && (
                <div className="space-y-3 pt-3 border-t border-black/5">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                      CURRENT STATION (optional)
                    </label>
                    <select
                      value={selectedStation ?? ""}
                      onChange={(e) => setSelectedStation(Number(e.target.value) || undefined)}
                      className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red transition-all bg-white"
                    >
                      <option value="">Select station</option>
                      {stations?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                      NOTES (optional)
                    </label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red transition-all"
                      placeholder="Add notes about this status update..."
                    />
                  </div>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updateStatusMutation.isPending}
                    className="px-6 py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? "UPDATING..." : "UPDATE STATUS"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collection PIN Verification */}
        {parcel.status === "ready_for_collection" && (
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={18} className="text-signal-red" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">
                COLLECTION VERIFICATION
              </p>
            </div>

            {!showPinVerify ? (
              <button
                onClick={() => setShowPinVerify(true)}
                className="px-6 py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all"
              >
                VERIFY COLLECTION PIN
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    ENTER COLLECTION PIN
                  </label>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    maxLength={4}
                    className="w-full px-4 py-2 border border-black/10 font-mono text-lg tracking-[0.3em] focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                    placeholder="----"
                  />
                </div>
                {verifyCollectionMutation.error && (
                  <p className="text-sm text-red-600">
                    {verifyCollectionMutation.error.message}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyPin}
                    disabled={pinInput.length !== 4 || verifyCollectionMutation.isPending}
                    className="px-6 py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {verifyCollectionMutation.isPending ? "VERIFYING..." : "VERIFY & COLLECT"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPinVerify(false);
                      setPinInput("");
                    }}
                    className="px-6 py-2 border border-black/10 font-mono text-xs uppercase tracking-widest hover:border-signal-red transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-black/10 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-6">
            MOVEMENT HISTORY
          </p>
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-black/10" />
            <div className="space-y-0">
              {[...parcel.events].reverse().map((event, idx) => {
                const config = statusConfig[event.status];
                const Icon = config?.icon ?? Package;
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
                          {config?.label ?? event.status}
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
                      <p className="text-sm text-black/50 mt-1">{event.notes}</p>
                      <p className="text-[10px] text-black/30 mt-1">by {event.officerName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Print Receipt */}
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-black/10 font-mono text-xs uppercase tracking-widest hover:border-signal-red hover:text-signal-red active:scale-[0.98] transition-all"
        >
          <Printer size={14} />
          PRINT RECEIPT
        </button>
      </div>
    </div>
  );
}

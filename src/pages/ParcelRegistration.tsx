import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, CheckCircle, Copy, Printer, QrCode } from "lucide-react";

const categories = [
  { value: "documents", label: "Documents" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "food", label: "Food" },
  { value: "fragile", label: "Fragile Items" },
  { value: "other", label: "Other" },
] as const;

export default function ParcelRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { data: stations } = trpc.station.list.useQuery();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    description: "",
    category: "documents" as (typeof categories)[number]["value"],
    originStationId: 0,
    destinationStationId: 0,
    receiverLandmark: "",
    weightKg: "",
    declaredValueMwk: "",
  });

  const [registeredParcel, setRegisteredParcel] = useState<{
    id: number;
    trackingNumber: string;
    collectionPin: string;
    qrCodeData: string | null;
    senderName: string;
    senderPhone: string;
    receiverName: string;
    receiverPhone: string;
    category: string;
    originStationId: number;
    destinationStationId: number;
    createdAt: Date;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const registerMutation = trpc.parcel.register.useMutation({
    onSuccess: (data) => {
      setRegisteredParcel(data as typeof registeredParcel);
      utils.parcel.list.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.senderName ||
      !formData.senderPhone ||
      !formData.receiverName ||
      !formData.receiverPhone ||
      !formData.originStationId ||
      !formData.destinationStationId
    )
      return;

    registerMutation.mutate({
      ...formData,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      declaredValueMwk: formData.declaredValueMwk ? parseFloat(formData.declaredValueMwk) : undefined,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

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
          REGISTER PARCEL
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        {registeredParcel ? (
          /* Success / Receipt View */
          <div className="space-y-6">
            <div className="bg-white border border-black/10 p-6 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-600" />
              <p className="font-mono text-xs uppercase tracking-wider text-black/40 mb-2">
                PARCEL REGISTERED SUCCESSFULLY
              </p>
              <h1 className="font-mono text-4xl text-signal-red tracking-tight mb-4">
                {registeredParcel.trackingNumber}
              </h1>
              <p className="text-sm text-black/60">
                Share this tracking number with the sender
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white border border-black/10 p-6 text-center">
              <div className="w-48 h-48 mx-auto bg-black/5 flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode size={48} className="mx-auto mb-2 text-black/40" />
                  <p className="font-mono text-[10px] text-black/30">
                    {registeredParcel.qrCodeData ?? registeredParcel.trackingNumber}
                  </p>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">
                SCAN TO TRACK
              </p>
            </div>

            {/* Collection PIN */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-black/40 mb-2">
                COLLECTION PIN
              </p>
              <div className="flex items-center gap-4">
                <p className="font-mono text-3xl tracking-tight flex-1">
                  {registeredParcel.collectionPin}
                </p>
                <button
                  onClick={() => handleCopy(registeredParcel.collectionPin)}
                  className="flex items-center gap-2 px-4 py-2 border border-black/10 font-mono text-[10px] uppercase tracking-wider hover:border-signal-red hover:text-signal-red transition-all"
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? "COPIED" : "COPY"}
                </button>
              </div>
              <p className="text-xs text-black/40 mt-2">
                This PIN will be sent to the receiver via SMS when the parcel is ready for collection
              </p>
            </div>

            {/* Parcel Details Summary */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                PARCEL SUMMARY
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-mono text-[10px] text-black/40 uppercase">SENDER</p>
                  <p>{registeredParcel.senderName}</p>
                  <p className="text-black/50">{registeredParcel.senderPhone}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-black/40 uppercase">RECEIVER</p>
                  <p>{registeredParcel.receiverName}</p>
                  <p className="text-black/50">{registeredParcel.receiverPhone}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-black/40 uppercase">CATEGORY</p>
                  <p className="capitalize">{registeredParcel.category}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-black/40 uppercase">DATE</p>
                  <p>{new Date(registeredParcel.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setRegisteredParcel(null);
                  setFormData({
                    senderName: "",
                    senderPhone: "",
                    receiverName: "",
                    receiverPhone: "",
                    description: "",
                    category: "documents",
                    originStationId: 0,
                    destinationStationId: 0,
                    receiverLandmark: "",
                    weightKg: "",
                    declaredValueMwk: "",
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all"
              >
                <PlusIcon />
                REGISTER ANOTHER
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-black/10 font-mono text-xs uppercase tracking-widest hover:border-signal-red hover:text-signal-red active:scale-[0.98] transition-all"
              >
                <Printer size={14} />
                PRINT RECEIPT
              </button>
              <button
                onClick={() => navigate(`/parcels/${registeredParcel.id}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-black/10 font-mono text-xs uppercase tracking-widest hover:border-signal-red hover:text-signal-red active:scale-[0.98] transition-all"
              >
                VIEW DETAILS
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender Information */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                SENDER INFORMATION
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                    placeholder="Enter sender's full name"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.senderPhone}
                    onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                    placeholder="+265..."
                  />
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                RECEIVER INFORMATION
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.receiverName}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                    placeholder="Enter receiver's full name"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.receiverPhone}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                    placeholder="+265..."
                  />
                </div>
              </div>
            </div>

            {/* Parcel Information */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                PARCEL INFORMATION
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    CATEGORY *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as (typeof categories)[number]["value"],
                      })
                    }
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all bg-white capitalize"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    RECEIVER LANDMARK / DELIVERY LOCATION
                  </label>
                  <input
                    type="text"
                    value={formData.receiverLandmark}
                    onChange={(e) => setFormData({ ...formData, receiverLandmark: e.target.value })}
                    placeholder="e.g. Next to Shoprite, Old Town — Gate 3"
                    className="w-full px-4 py-3 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                  />
                  <p className="text-[10px] text-black/40 mt-1">
                    Help the receiver locate the station easily. Use a known landmark.
                  </p>
                </div>
              </div>

              {/* Physical Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    WEIGHT (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    placeholder="e.g. 1.5"
                    className="w-full px-4 py-3 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    DECLARED VALUE (MWK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.declaredValueMwk}
                    onChange={(e) => setFormData({ ...formData, declaredValueMwk: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full px-4 py-3 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                  />
                </div>
              </div>

              <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all resize-none"
                    placeholder="Brief description of the parcel contents..."
                  />
                </div>
              </div>

            {/* Route Information */}
            <div className="bg-white border border-black/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4">
                ROUTE INFORMATION
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    ORIGIN STATION *
                  </label>
                  <select
                    required
                    value={formData.originStationId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, originStationId: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all bg-white"
                  >
                    <option value="">Select origin station</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                    DESTINATION STATION *
                  </label>
                  <select
                    required
                    value={formData.destinationStationId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, destinationStationId: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-black/10 focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all bg-white"
                  >
                    <option value="">Select destination station</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-4 bg-signal-red text-white font-mono text-sm uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {registerMutation.isPending ? "REGISTERING..." : "REGISTER PARCEL"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

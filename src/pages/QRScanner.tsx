import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, QrCode, ScanLine, CheckCircle, AlertCircle } from "lucide-react";

export default function QRScanner() {
  const navigate = useNavigate();
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [scannedCode, setScannedCode] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: parcel, isLoading } = trpc.parcel.track.useQuery(
    { trackingNumber: scannedCode },
    { enabled: scannedCode.length > 0 }
  );

  const simulateScan = () => {
    setIsSimulating(true);
    // Simulate scan delay
    setTimeout(() => {
      setIsSimulating(false);
      // Focus input for manual entry after "scan"
      inputRef.current?.focus();
    }, 1500);
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputRef.current?.value.trim() ?? "";
    if (code) {
      setScannedCode(code);
    }
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
          QR SCANNER
        </span>
      </header>

      <div className="max-w-lg mx-auto px-4 md:px-8 py-8">
        {/* Scanner Viewport */}
        <div className="bg-obsidian border border-black/10 p-8 mb-6 relative overflow-hidden">
          {/* Scanline Grid Effect */}
          <div className="scanline-grid opacity-50" />

          <div className="relative z-10">
            <div className="aspect-square max-w-[280px] mx-auto border-2 border-white/20 relative flex items-center justify-center">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-signal-red" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-signal-red" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-signal-red" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-signal-red" />

              {/* Scanning animation */}
              {isSimulating && (
                <div className="absolute inset-0">
                  <div
                    className="w-full h-0.5 bg-signal-red animate-[scan_1.5s_ease-in-out_infinite]"
                    style={{
                      boxShadow: "0 0 10px #FF2A00, 0 0 20px #FF2A00",
                    }}
                  />
                </div>
              )}

              {isSimulating ? (
                <ScanLine size={48} className="text-white/20" />
              ) : (
                <QrCode size={48} className="text-white/20" />
              )}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 text-center mt-6">
              POSITION QR CODE WITHIN FRAME
            </p>
          </div>

          {/* CSS scan animation */}
          <style>{`
            @keyframes scan {
              0% { transform: translateY(0); }
              50% { transform: translateY(280px); }
              100% { transform: translateY(0); }
            }
          `}</style>
        </div>

        {/* Simulate Scan Button */}
        <button
          onClick={simulateScan}
          disabled={isSimulating}
          className="w-full py-3 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all disabled:opacity-50 mb-6"
        >
          {isSimulating ? "SCANNING..." : "SIMULATE SCAN"}
        </button>

        {/* Manual Entry */}
        <div className="bg-white border border-black/10 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/40 mb-4 text-center">
            OR ENTER TRACKING NUMBER MANUALLY
          </p>
          <form onSubmit={handleManualEntry} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="TMZ-XXXXXX"
              className="flex-1 px-4 py-2 border border-black/10 font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-widest hover:bg-black/80 active:scale-[0.98] transition-all"
            >
              FIND
            </button>
          </form>
        </div>

        {/* Results */}
        {isLoading && scannedCode && (
          <div className="mt-6 text-center py-8">
            <div className="w-6 h-6 border-2 border-signal-red border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {parcel && (
          <div className="mt-6 bg-white border border-black/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-green-600" />
              <p className="font-mono text-xs uppercase tracking-wider text-green-600">
                PARCEL FOUND
              </p>
            </div>

            <p className="font-mono text-2xl text-signal-red tracking-tight mb-1">
              {parcel.trackingNumber}
            </p>
            <p className="font-mono text-xs uppercase tracking-wider text-black/40 mb-4">
              {parcel.status.replace(/_/g, " ")}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="font-mono text-[10px] text-black/40 uppercase">SENDER</p>
                <p>{parcel.senderName}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-black/40 uppercase">RECEIVER</p>
                <p>{parcel.receiverName}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-black/40 uppercase">FROM</p>
                <p>{parcel.originStation?.name ?? "Unknown"}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-black/40 uppercase">TO</p>
                <p>{parcel.destinationStation?.name ?? "Unknown"}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/parcels/${parcel.id}`)}
              className="w-full py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all"
            >
              VIEW FULL DETAILS & UPDATE STATUS
            </button>
          </div>
        )}

        {!isLoading && scannedCode && !parcel && (
          <div className="mt-6 bg-white border border-black/10 p-6 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-black/20" />
            <p className="font-mono text-xs uppercase tracking-wider text-black/40">
              No parcel found for code: {scannedCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

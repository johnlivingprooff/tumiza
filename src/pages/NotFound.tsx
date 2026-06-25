import { Link } from "react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cool-grey flex items-center justify-center">
      <div className="text-center px-6">
        <AlertCircle size={40} className="mx-auto mb-4 text-signal-red" />
        <h1 className="font-mono text-6xl text-black/10 mb-2">404</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-black/40 mb-6">
          PAGE NOT FOUND
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all"
        >
          <ArrowLeft size={14} />
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}

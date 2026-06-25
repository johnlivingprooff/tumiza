import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Package, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // essential — sends/receives the session cookie
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      // Invalidate auth cache so useAuth() picks up the new session
      await utils.auth.me.invalidate();

      // Route based on role
      const role = data.user?.role;
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "officer") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center relative">
      {/* Scanline background */}
      <div className="scanline-grid opacity-30" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Back */}
        <Link
          to="/"
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-signal-red transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          BACK TO HOME
        </Link>

        {/* Card */}
        <div className="bg-white p-8">
          <div className="text-center mb-8">
            <Package size={32} className="mx-auto mb-4 text-signal-red" />
            <h1 className="font-mono text-lg uppercase tracking-widest text-black mb-2">
              TUMIZA
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-wider text-black/40">
              OFFICER & ADMIN SIGN IN
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tumiza.mw"
                autoComplete="email"
                className="w-full px-4 py-3 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-black/60 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 border border-black/10 font-mono text-sm focus:outline-none focus:border-signal-red focus:shadow-[0_0_0_2px_rgba(255,42,0,0.2)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-signal-red/5 border border-signal-red/20">
                <p className="font-mono text-[10px] uppercase tracking-wider text-signal-red">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-signal-red text-white font-mono text-xs uppercase tracking-widest hover:bg-signal-red/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black/10">
            <Link
              to="/track"
              className="block text-center font-mono text-[10px] uppercase tracking-wider text-black/40 hover:text-signal-red transition-colors"
            >
              TRACK A PARCEL — NO SIGN IN REQUIRED
            </Link>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] text-white/20 tracking-wider mt-6">
          PARCEL TRACKING & VISIBILITY PLATFORM
        </p>
      </div>
    </div>
  );
}

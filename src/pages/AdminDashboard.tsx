import { useNavigate, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import {
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  LogOut,
  BarChart3,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";



export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const { data: stats } = trpc.dashboard.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: dailyVolume } = trpc.dashboard.getDailyVolume.useQuery(
    { days: 30 },
    { enabled: user?.role === "admin" }
  );

  const { data: monthlyVolume } = trpc.dashboard.getMonthlyVolume.useQuery(
    { months: 12 },
    { enabled: user?.role === "admin" }
  );

  const { data: activeRoutes } = trpc.dashboard.getActiveRoutes.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: ratings } = trpc.dashboard.getRatings.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cool-grey flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-signal-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-cool-grey flex flex-col items-center justify-center">
        <p className="font-mono text-sm uppercase text-black/40 mb-4">
          Admin access required
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2 bg-signal-red text-white font-mono text-xs uppercase tracking-widest"
        >
          GO TO DASHBOARD
        </button>
      </div>
    );
  }

  const chartData = dailyVolume?.map((d) => ({
    date: d.date,
    count: d.count,
  })) ?? [];

  const monthlyChartData = monthlyVolume?.map((m) => ({
    month: m.month,
    count: m.count,
  })) ?? [];

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
            ADMIN DASHBOARD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="font-mono text-[10px] uppercase tracking-wider text-black/40 hover:text-signal-red"
          >
            OFFICER VIEW
          </Link>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            {
              label: "TOTAL PARCELS",
              value: stats?.totalParcels ?? 0,
              icon: Package,
              color: "text-black",
            },
            {
              label: "IN TRANSIT",
              value: stats?.inTransit ?? 0,
              icon: Truck,
              color: "text-orange-600",
            },
            {
              label: "ARRIVED",
              value: stats?.arrived ?? 0,
              icon: CheckCircle,
              color: "text-teal-600",
            },
            {
              label: "COLLECTED",
              value: stats?.collected ?? 0,
              icon: CheckCircle,
              color: "text-green-600",
            },
            {
              label: "READY",
              value: stats?.readyForCollection ?? 0,
              icon: Clock,
              color: "text-signal-red",
            },
            {
              label: "DELAYED",
              value: stats?.delayed ?? 0,
              icon: AlertCircle,
              color: "text-red-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-black/10 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-black/40">
                  {stat.label}
                </span>
              </div>
              <p className="font-sans text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Volume */}
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={16} className="text-signal-red" />
              <p className="font-mono text-xs uppercase tracking-wider">
                DAILY PARCEL VOLUME (30 DAYS)
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fontFamily: "Geist Mono" }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 10, fontFamily: "Geist Mono" }} />
                <Tooltip
                  contentStyle={{
                    fontFamily: "Geist Mono",
                    fontSize: 12,
                    border: "1px solid #e5e5e5",
                    borderRadius: 0,
                  }}
                />
                <Bar dataKey="count" fill="#FF2A00" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Volume */}
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} className="text-signal-red" />
              <p className="font-mono text-xs uppercase tracking-wider">
                MONTHLY PARCEL VOLUME
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fontFamily: "Geist Mono" }}
                  tickFormatter={(v: string) => {
                    const parts = v.split("-");
                    return `${parts[1]}/${parts[0].slice(2)}`;
                  }}
                />
                <YAxis tick={{ fontSize: 10, fontFamily: "Geist Mono" }} />
                <Tooltip
                  contentStyle={{
                    fontFamily: "Geist Mono",
                    fontSize: 12,
                    border: "1px solid #e5e5e5",
                    borderRadius: 0,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#FF2A00"
                  strokeWidth={2}
                  dot={{ fill: "#FF2A00", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Routes & Ratings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Routes */}
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Truck size={16} className="text-signal-red" />
              <p className="font-mono text-xs uppercase tracking-wider">
                MOST ACTIVE ROUTES
              </p>
            </div>
            {activeRoutes && activeRoutes.length > 0 ? (
              <div className="space-y-3">
                {activeRoutes.map((route, idx) => (
                  <div
                    key={`${route.origin}-${route.destination}`}
                    className="flex items-center gap-3"
                  >
                    <span className="font-mono text-xs text-black/30 w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 flex items-center gap-2 text-sm">
                      <span className="truncate">{route.origin}</span>
                      <span className="text-black/20">&rarr;</span>
                      <span className="truncate">{route.destination}</span>
                    </div>
                    <span className="font-mono text-xs text-signal-red">
                      {route.count} parcels
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/30 text-center py-8">
                No route data available
              </p>
            )}
          </div>

          {/* Ratings */}
          <div className="bg-white border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star size={16} className="text-signal-red" />
              <p className="font-mono text-xs uppercase tracking-wider">
                BRANCH RATINGS
              </p>
            </div>
            {ratings && ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.map((rating) => (
                  <div key={rating.branch} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{rating.branch}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < Math.round(rating.avgRating)
                              ? "text-technical-amber fill-technical-amber"
                              : "text-black/10"
                          }
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-black/50 w-12 text-right">
                      {rating.avgRating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/30 text-center py-8">
                No ratings yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

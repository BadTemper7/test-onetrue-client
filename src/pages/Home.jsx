import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiTruck,
} from "react-icons/fi";
import { useAuthStore } from "../stores/authStore";
import { useBookingStore } from "../stores/bookingStore";

const statusLabels = {
  pending_admin_approval: "Pending admin approval",
  approved_area_assigned: "Approved and assigned",
  rejected: "Rejected",
  gate_in_approved: "Gate-in approved",
  stored_in_assigned_area: "Stored in yard",
  gate_out_requested: "Gate-out requested",
  gate_out_approved: "Gate-out approved",
  completed_gate_out_done: "Completed",
  cancelled: "Cancelled",
};

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { bookings, loading, error, fetchBookings } = useBookingStore();
  const isVerified = ["active", "verified"].includes(user?.status);

  useEffect(() => {
    if (isVerified) fetchBookings().catch(() => {});
  }, [fetchBookings, isVerified]);

  useEffect(() => {
    if (!isVerified) return undefined;
    const refresh = () => fetchBookings().catch(() => {});
    window.addEventListener("otli:realtime", refresh);
    return () => window.removeEventListener("otli:realtime", refresh);
  }, [fetchBookings, isVerified]);

  const stats = useMemo(() => {
    const pending = bookings.filter((booking) =>
      ["pending_admin_approval", "approved_area_assigned"].includes(booking.status),
    ).length;
    const inYard = bookings.filter((booking) =>
      ["gate_in_approved", "stored_in_assigned_area", "gate_out_requested", "gate_out_approved"].includes(booking.status),
    ).length;
    const completed = bookings.filter(
      (booking) => booking.status === "completed_gate_out_done",
    ).length;

    return [
      { label: "Total bookings", value: bookings.length, icon: FiPackage, className: "bg-emerald-500" },
      { label: "Pending review", value: pending, icon: FiClock, className: "bg-amber-500" },
      { label: "Containers in yard", value: inYard, icon: FiTruck, className: "bg-blue-500" },
      { label: "Completed", value: completed, icon: FiCheckCircle, className: "bg-blue-500" },
    ];
  }, [bookings]);

  if (!isVerified) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-700 p-6 text-white shadow-lg md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">One True Logistics</p>
          <h1 className="mt-3 text-3xl font-bold">Welcome, {user?.name || "Client"}</h1>
          <p className="mt-2 max-w-2xl text-emerald-100">
            Your registration is saved. Admin verification is required before you can submit container bookings.
          </p>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <FiAlertCircle className="mt-1 h-6 w-6 text-amber-600" />
            <div>
              <h2 className="text-lg font-semibold text-amber-900">Account status: {user?.status || "pending"}</h2>
              <p className="mt-1 text-sm text-amber-800">
                Review your submitted company details and documents while waiting for admin approval.
              </p>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                View account status
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.name || "Client"}</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor your container bookings and latest status changes.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchBookings().catch(() => {})}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`${stat.className} rounded-xl p-3 text-white`}><stat.icon className="h-6 w-6" /></div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">Recent bookings</h2>
              <p className="text-xs text-slate-500">Latest container activity from your account</p>
            </div>
            <button onClick={() => navigate("/booking-history")} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all</button>
          </div>
          <div className="divide-y divide-slate-100">
            {bookings.slice(0, 6).map((booking) => (
              <button
                type="button"
                key={booking.id}
                onClick={() => navigate("/booking-history")}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600"><FiPackage /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{booking.bookingReference}</p>
                  <p className="truncate text-sm text-slate-500">{booking.containerNumber} • {booking.shippingLine}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {statusLabels[booking.status] || booking.status}
                </span>
              </button>
            ))}
            {!loading && bookings.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-slate-500">No bookings yet.</div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <button onClick={() => navigate("/booking")} className="flex w-full items-center gap-3 rounded-lg bg-emerald-600 p-4 text-left text-white hover:bg-emerald-700">
              <FiPackage className="h-5 w-5" />
              <span><strong className="block">Create booking</strong><small className="text-emerald-100">Automatically submitted as pre-advice for admin review</small></span>
            </button>
            <button onClick={() => navigate("/booking-history")} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-4 text-left text-slate-700 hover:bg-slate-50">
              <FiClock className="h-5 w-5 text-emerald-600" />
              <span><strong className="block">View booking history</strong><small className="text-slate-500">Track verification and container status</small></span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

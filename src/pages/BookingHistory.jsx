import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import InputDate from "../components/ui/InputDate";
import InputFile from "../components/ui/InputFile";
import InputText from "../components/ui/InputText";
import Pagination from "../components/ui/Pagination";
import { api, getApiError, resolveFileUrl } from "../lib/api";
import { useBookingStore } from "../stores/bookingStore";
import { usePagination } from "../hooks/usePagination";

const statusConfig = {
  pending_admin_approval: ["Pending approval", "bg-amber-100 text-amber-700", FiClock],
  approved_area_assigned: ["Area assigned", "bg-blue-100 text-blue-700", FiCheckCircle],
  rejected: ["Rejected", "bg-red-100 text-red-700", FiX],
  gate_in_approved: ["Gate-in approved", "bg-emerald-100 text-emerald-700", FiTruck],
  stored_in_assigned_area: ["Stored in yard", "bg-blue-100 text-blue-700", FiPackage],
  gate_out_requested: ["Gate-out requested", "bg-emerald-100 text-emerald-700", FiClock],
  gate_out_approved: ["Gate-out approved", "bg-blue-100 text-blue-700", FiCheckCircle],
  completed_gate_out_done: ["Completed", "bg-slate-100 text-slate-700", FiCheckCircle],
  cancelled: ["Cancelled", "bg-slate-100 text-slate-500", FiX],
};


const toDateOnlyString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const billingLabels = {
  unpaid: "Unpaid",
  payment_submitted: "Payment submitted",
  payment_under_review: "Under review",
  payment_rejected: "Payment rejected",
  paid_approved: "Paid",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const BillingBreakdown = ({ booking, className = "" }) => {
  const lineItems = booking?.billingLineItems || [];
  if (lineItems.length === 0) return null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Billing breakdown</p>
      <div className="mt-3 space-y-2">
        {lineItems.map((item, index) => (
          <div key={`${item.chargeCode || item.description}-${index}`} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-slate-700">{String(item.chargeCode || "").startsWith("LIFT_ON") ? "Lift On Charge" : String(item.chargeCode || "").startsWith("LIFT_OFF") ? "Lift Off Charge" : item.description || item.chargeCode}</p>
              <p className="text-xs text-slate-500">{Number(item.quantity || 0).toLocaleString()} x PHP {Number(item.rateAmount || 0).toLocaleString()}</p>
            </div>
            <p className="shrink-0 font-bold text-slate-900">PHP {Number(item.amount || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span>Subtotal</span>
          <span>PHP {Number(booking.billingSubtotal || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span>VAT ({Math.round(Number(booking.vatRate || 0.12) * 100)}%)</span>
          <span>PHP {Number(booking.vatAmount || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between font-black text-slate-900">
          <span>Total</span>
          <span>PHP {Number(booking.billingTotal || booking.paymentAmount || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const BookingHistory = () => {
  const {
    bookings,
    loading,
    submitting,
    error,
    fetchBookings,
    requestGateOut,
    submitPayment,
  } = useBookingStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTypesLoaded, setPaymentTypesLoaded] = useState(false);
  const [modal, setModal] = useState("");

  const availablePaymentTypes = paymentTypes;
  const [actionError, setActionError] = useState("");
  const [gateOut, setGateOut] = useState({ outDate: "", remarks: "" });
  const [payment, setPayment] = useState({
    paymentTypeId: "",
    paymentReferenceNumber: "",
    paymentRemarks: "",
    paymentProof: null,
  });

  useEffect(() => {
    fetchBookings().catch(() => {});
    api.get("/client/payment-types")
      .then(({ data }) => setPaymentTypes((data.paymentTypes || []).filter((item) => item.type !== "cash")))
      .catch(() => setPaymentTypes([]))
      .finally(() => setPaymentTypesLoaded(true));
  }, [fetchBookings]);

  useEffect(() => {
    const refresh = () => fetchBookings().catch(() => {});
    window.addEventListener("otli:realtime", refresh);
    return () => window.removeEventListener("otli:realtime", refresh);
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch = !term || [
        booking.bookingReference,
        booking.containerNumber,
        booking.driverName,
        booking.shippingLine,
      ].some((value) => String(value || "").toLowerCase().includes(term));
      const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, filterStatus, searchTerm]);

  const bookingPagination = usePagination(
    filteredBookings,
    10,
    `${searchTerm}|${filterStatus}`,
  );

  const openModal = (type, booking) => {
    setSelectedBooking(booking);
    setModal(type);
    setActionError("");
    setGateOut({ outDate: "", remarks: "" });
    setPayment({
      paymentTypeId: availablePaymentTypes[0]?.id || "",
        paymentReferenceNumber: "",
      paymentRemarks: "",
      paymentProof: null,
    });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal("");
    setSelectedBooking(null);
    setActionError("");
  };

  const submitGateOutRequest = async () => {
    if (!gateOut.outDate) {
      setActionError("Please select a Date Out.");
      return;
    }
    try {
      await requestGateOut(selectedBooking.id, gateOut);
      closeModal();
    } catch (requestError) {
      setActionError(getApiError(requestError));
    }
  };

  const submitPaymentProof = async () => {
    if (!payment.paymentTypeId) {
      setActionError("Please select a payment type.");
      return;
    }
    if (!payment.paymentReferenceNumber.trim() && !payment.paymentProof) {
      setActionError("Enter the payment reference number or upload proof of payment.");
      return;
    }
    try {
      await submitPayment(selectedBooking.id, payment);
      closeModal();
    } catch (requestError) {
      setActionError(getApiError(requestError));
    }
  };

  const StatusBadge = ({ booking }) => {
    const [label, className, Icon] = statusConfig[booking.status] || [booking.status, "bg-slate-100 text-slate-700", FiClock];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
    );
  };

  const renderAction = (booking) => {
    if (booking.status === "stored_in_assigned_area" && booking.billingStatus === "unpaid") {
      return (
        <button onClick={() => openModal("gateOut", booking)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
          Submit Date Out
        </button>
      );
    }

    if (
      ["gate_out_requested", "gate_out_approved"].includes(booking.status) &&
      ["unpaid", "payment_rejected"].includes(booking.billingStatus) &&
      paymentTypesLoaded &&
      availablePaymentTypes.length > 0
    ) {
      return (
        <button onClick={() => openModal("payment", booking)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
          Submit Non-Cash Payment
        </button>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Booking history</h1>
          <p className="mt-1 text-sm text-slate-500">Track booking approval, yard storage, payment, and release status.</p>
        </div>
        <button onClick={() => fetchBookings().catch(() => {})} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {(error || actionError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError || error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search booking, container, driver, or shipping line" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none">
              <option value="all">All statuses</option>
              {Object.entries(statusConfig).map(([value, config]) => <option key={value} value={value}>{config[0]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Container</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Date in</th>
                <th className="px-4 py-3">Date out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookingPagination.paginatedItems.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-semibold text-emerald-600">{booking.bookingReference}</p><p className="text-xs text-slate-400">{booking.shippingLine}</p></td>
                  <td className="px-4 py-3"><p className="font-medium text-slate-700">{booking.containerNumber}</p><p className="text-xs capitalize text-slate-500">{booking.containerSize} ft • {String(booking.containerType || "").replaceAll("_", " ")}</p></td>
                  <td className="px-4 py-3"><p className="text-slate-700">{booking.driverName || "—"}</p><p className="text-xs text-slate-500">{booking.truckPlateNumber || "—"}</p></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(booking.inDate || booking.expectedArrivalDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(booking.outDate)}</td>
                  <td className="px-4 py-3"><StatusBadge booking={booking} /></td>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-700">PHP {Number(booking.billingTotal || booking.paymentAmount || 0).toLocaleString()}</p><p className="text-xs text-slate-500">{billingLabels[booking.billingStatus] || booking.billingStatus}</p></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal("details", booking)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" aria-label="View booking"><FiEye /></button>
                      {renderAction(booking)}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredBookings.length === 0 && <tr><td colSpan="8" className="px-4 py-14 text-center text-slate-500">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...bookingPagination} />
      </div>

      {modal && selectedBooking && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-slate-800">{modal === "gateOut" ? "Submit Date Out" : modal === "payment" ? "Submit non-cash payment" : "Booking details"}</h2><p className="mt-1 text-sm text-slate-500">{selectedBooking.bookingReference} • {selectedBooking.containerNumber}</p></div>
              <button onClick={closeModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><FiX /></button>
            </div>

            {actionError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

            {modal === "details" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Status", (statusConfig[selectedBooking.status] || [selectedBooking.status])[0]],
                  ["Billing", billingLabels[selectedBooking.billingStatus] || selectedBooking.billingStatus],
                  ["Shipping line", selectedBooking.shippingLine],
                  ["Driver", selectedBooking.driverName],
                  ["Truck plate", selectedBooking.truckPlateNumber],
                  ["Assigned area", selectedBooking.assignedArea?.name || selectedBooking.assignedAreaName],
                  ["Assigned slot", selectedBooking.assignedSlotNumber],
                  ["Rejection reason", selectedBooking.rejectionReason],
                ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-medium text-slate-700">{value || "—"}</p></div>)}
                <BillingBreakdown booking={selectedBooking} className="sm:col-span-2" />
              </div>
            )}

            {modal === "gateOut" && (
              <div className="mt-5 space-y-4">
                <InputDate
                  label="Date Out"
                  name="outDate"
                  value={gateOut.outDate}
                  onChange={(event) =>
                    setGateOut((current) => ({
                      ...current,
                      outDate: toDateOnlyString(event.target.value),
                    }))
                  }
                  required
                />
                <InputText label="Remarks" name="remarks" value={gateOut.remarks} onChange={(event) => setGateOut((current) => ({ ...current, remarks: event.target.value }))} placeholder="Optional gate-out remarks" />
                <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">The final bill will be computed using the selected Date Out and active billing rates.</p>
              </div>
            )}

            {modal === "payment" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Final bill</p><p className="mt-1 text-2xl font-bold text-emerald-700">PHP {Number(selectedBooking.billingTotal || selectedBooking.paymentAmount || 0).toLocaleString()}</p></div>
                <BillingBreakdown booking={selectedBooking} />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Payment Type <span className="text-red-500">*</span></span>
                  <div className="relative" data-field-control>
                    <FiCreditCard className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select className="input pl-10" value={payment.paymentTypeId} onChange={(event) => setPayment((current) => ({ ...current, paymentTypeId: event.target.value }))} required>
                      <option value="">Select payment type</option>
                      {availablePaymentTypes.map((item) => <option key={item.id} value={item.id}>{item.accountNumber ? `${item.name} • ${item.bankName || item.name} • ${item.accountNumber}` : item.name}</option>)}
                    </select>
                  </div>
                </label>
                {payment.paymentTypeId && (() => {
                  const selected = availablePaymentTypes.find((item) => item.id === payment.paymentTypeId);
                  return selected ? (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
                      <p className="font-black text-emerald-900">{selected.name}</p>
                      {selected.accountNumber ? <>
                        <p className="mt-2 text-emerald-800">{selected.bankName || selected.name}</p>
                        <p className="font-black text-emerald-900">{selected.accountNumber}</p>
                        <p className="text-emerald-800">{selected.accountName}</p>
                      </> : (
                        <p className="mt-2 font-semibold text-emerald-800">{selected.instructions}</p>
                      )}
                      {selected.qrUrl && <a href={resolveFileUrl(selected.qrUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-700">View QR Code</a>}
                    </div>
                  ) : null;
                })()}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-700">
                  Provide at least one verification detail: the transaction reference number or proof of payment.
                </div>
                <InputText label="Payment Reference Number" name="paymentReferenceNumber" value={payment.paymentReferenceNumber} onChange={(event) => setPayment((current) => ({ ...current, paymentReferenceNumber: event.target.value }))} placeholder="Enter bank or e-wallet transaction reference" />
                <InputFile label="Proof of Payment (Optional)" name="paymentProof" accept="image/*,.pdf" maxSize={10} onChange={(event) => setPayment((current) => ({ ...current, paymentProof: event.target.files?.[0] || null }))} />
                <InputText label="Payment Remarks" name="paymentRemarks" value={payment.paymentRemarks} onChange={(event) => setPayment((current) => ({ ...current, paymentRemarks: event.target.value }))} placeholder="Optional notes" />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={submitting}>Close</Button>
              {modal === "gateOut" && <Button variant="primary" onClick={submitGateOutRequest} loading={submitting} disabled={submitting}>Submit Gate-out</Button>}
              {modal === "payment" && <Button variant="primary" onClick={submitPaymentProof} loading={submitting} disabled={submitting} icon={<FiDollarSign />}>Submit Payment</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;

import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowLeft, ClipboardCheck, MapPinned, QrCode, Search, Truck, UserRound } from "lucide-react"
import Alert from "../components/Alert"
import { api, getApiError } from "../lib/api"

const statusLabels = {
  pending_admin_approval: "Pending Admin Approval",
  approved_area_assigned: "Approved / Area Assigned",
  rejected: "Rejected",
  gate_in_approved: "Gate-In Approved",
  stored_in_assigned_area: "Stored in Assigned Area",
  gate_out_requested: "Gate-Out Requested",
  gate_out_approved: "Gate-Out Approved",
  completed_gate_out_done: "Completed / Gate-Out Done",
  cancelled: "Cancelled",
}

const billingLabels = {
  unpaid: "Unpaid",
  payment_submitted: "Payment Submitted",
  payment_under_review: "Payment Under Review",
  payment_rejected: "Payment Rejected",
  paid_approved: "Paid / Approved",
}

const statusClass = (status) => {
  if (["completed_gate_out_done", "stored_in_assigned_area", "paid_approved"].includes(status)) return "bg-blue-50 text-blue-700"
  if (["approved_area_assigned", "gate_in_approved", "gate_out_approved"].includes(status)) return "bg-blue-50 text-blue-700"
  if (["rejected", "cancelled", "payment_rejected"].includes(status)) return "bg-red-50 text-red-700"
  return "bg-amber-50 text-amber-700"
}

const formatDate = (value) => {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

const getBookingInDate = (booking = {}) => booking.inDate || booking.expectedArrivalDate
const getBookingOutDate = (booking = {}) => booking.outDate

const Detail = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</div>
  </div>
)

const BookingLookupPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialNumber = searchParams.get("bookingNumber") || ""
  const [bookingNumber, setBookingNumber] = useState(initialNumber)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type: "", message: "" })

  const canSearch = useMemo(() => bookingNumber.trim().length > 0, [bookingNumber])

  const lookupBooking = async (event) => {
    event?.preventDefault()
    setAlert({ type: "", message: "" })
    setBooking(null)

    if (!bookingNumber.trim()) {
      setAlert({ type: "error", message: "Enter the booking number first." })
      return
    }

    try {
      setLoading(true)
      const cleanNumber = bookingNumber.trim().toUpperCase()
      const { data } = await api.get(`/bookings/status/${encodeURIComponent(cleanNumber)}`)
      setBooking(data.booking || null)
      setSearchParams({ bookingNumber: cleanNumber })
    } catch (error) {
      setAlert({ type: "error", message: getApiError(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialNumber) lookupBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
            <img src="/images/otli-logo.webp" alt="OTLI" className="h-9 w-auto object-contain" />
          </div>
        </div>

        <div className="card p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
            <ClipboardCheck size={14} /> Booking Status Lookup
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Track Booking Details</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Type the generated booking number from your approval email to view the latest container, driver, yard, billing, Gate-In, and Gate-Out details.
          </p>

          <form onSubmit={lookupBooking} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              className="input flex-1 uppercase"
              value={bookingNumber}
              onChange={(event) => setBookingNumber(event.target.value)}
              placeholder="BN-20260701-00001"
            />
            <button className="btn-primary" disabled={loading || !canSearch}>
              <Search size={17} /> {loading ? "Searching..." : "Search Booking"}
            </button>
          </form>
        </div>

        <Alert type={alert.type}>{alert.message}</Alert>

        {booking && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-500">{booking.bookingReference}</div>
                  <h2 className="mt-1 text-3xl font-black text-slate-950">{booking.bookingNumber || "No booking number yet"}</h2>
                  <div className="mt-1 text-sm font-semibold text-slate-500">Container {booking.containerNumber}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(booking.status)}`}>{statusLabels[booking.status] || booking.status}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(booking.billingStatus)}`}>{billingLabels[booking.billingStatus] || booking.billingStatus}</span>
                </div>
              </div>

              {booking.qrCodeValue && (
                <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-700">
                    <QrCode size={18} /> Booking QR Value
                  </div>
                  <div className="mt-2 break-all text-lg font-black text-slate-950">{booking.qrCodeValue}</div>
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <div className="flex items-center gap-2 text-lg font-black text-slate-950"><Truck size={18} className="text-emerald-700" /> Container and Truck</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Container Number" value={booking.containerNumber} />
                  <Detail label="Container Size" value={`${booking.containerSize}ft`} />
                  <Detail label="Container Type" value={booking.containerType?.replace("_", " ")} />
                  <Detail label="Load Status" value={booking.containerLoadStatus} />
                  <Detail label="Shipping Line" value={booking.shippingLine} />
                  <Detail label="In Date" value={formatDate(getBookingInDate(booking))} />
                  <Detail label="Requested Date Out" value={formatDate(getBookingOutDate(booking))} />
                  <Detail label="Truck Plate" value={booking.truckPlateNumber} />
                  <Detail label="Actual Container" value={booking.actualContainerNumber || booking.containerNumber} />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 text-lg font-black text-slate-950"><UserRound size={18} className="text-emerald-700" /> Client and Driver</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Client" value={booking.clientName} />
                  <Detail label="Client Email" value={booking.clientEmail} />
                  <Detail label="Driver Name" value={booking.driverName} />
                  <Detail label="Driver License" value={booking.driverLicenseNumber} />
                  <Detail label="BL Number" value={booking.blNumber} />
                  <Detail label="Vessel / Voyage" value={booking.vesselVoyage} />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 text-lg font-black text-slate-950"><MapPinned size={18} className="text-emerald-700" /> Yard Assignment</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Area" value={booking.assignedAreaName || "Pending"} />
                  <Detail label="Slot" value={booking.assignedSlotNumber || "Pending"} />
                  <Detail label="Bay" value={booking.assignedBay} />
                  <Detail label="Row" value={booking.assignedRow} />
                  <Detail label="Tier" value={booking.assignedTier} />
                  <Detail label="Approved At" value={formatDate(booking.approvedAt)} />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 text-lg font-black text-slate-950"><ClipboardCheck size={18} className="text-emerald-700" /> Movement and Billing</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Gate-In" value={formatDate(booking.gateInApprovedAt)} />
                  <Detail label="Stored" value={formatDate(booking.storedAt)} />
                  <Detail label="Payment Submitted" value={formatDate(booking.paymentSubmittedAt)} />
                  <Detail label="Total Bill Before Payment" value={(booking.billingTotal || booking.paymentAmount) ? `PHP ${Number(booking.billingTotal || booking.paymentAmount).toLocaleString()}` : "-"} />
                  <Detail label="Gate-Out Requested" value={formatDate(booking.gateOutRequestedAt)} />
                  <Detail label="Released" value={formatDate(booking.releasedAt)} />
                </div>
              </div>
            </div>

            {(booking.rejectionReason || booking.paymentRejectionReason || booking.inspectionRemarks || booking.clientRemarks) && (
              <div className="card p-5">
                <h3 className="text-lg font-black text-slate-950">Remarks</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {booking.clientRemarks && <Detail label="Client Remarks" value={booking.clientRemarks} />}
                  {booking.inspectionRemarks && <Detail label="Inspection Remarks" value={booking.inspectionRemarks} />}
                  {booking.rejectionReason && <Detail label="Rejection Reason" value={booking.rejectionReason} />}
                  {booking.paymentRejectionReason && <Detail label="Payment Rejection Reason" value={booking.paymentRejectionReason} />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingLookupPage

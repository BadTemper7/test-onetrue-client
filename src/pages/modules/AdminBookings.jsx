import { TableToolbar, TableSearchField, TableFilterButton } from "../../components/table/TableToolbar";
import OperationalRecordCard, { RecordCardField } from "../../components/table/OperationalRecordCard"
import FilterDropdownPortal from "../../components/table/FilterDropdownPortal"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Boxes,
  Download,
  CheckCircle2,
  RefreshCw,
  Truck,
 } from "lucide-react"
import Alert from "../../components/Alert"
import ModalCloseButton from "../../components/ui/ModalCloseButton"
import Pagination from "../../components/table/Pagination"
import TableCrudActions from "../../components/table/TableCrudActions"
import { api, getApiError } from "../../lib/api"
import { downloadFilteredCsv } from "../../lib/filteredCsv"
import { useAuthStore } from "../../stores/authStore"
import { hasModulePermission } from "../../lib/permissions"
import TableLoadingRow from "../../components/table/TableLoadingRow"
import BookingDatesCell from "../../components/table/BookingDatesCell"

const statusLabels = {
  pending_admin_approval: "Pending Admin Approval",
  approved_area_assigned: "Approved / Area Assigned",
  rejected: "Rejected",
  gate_in_approved: "Gate-In Approved",
  stored_in_assigned_area: "Stored in Assigned Area",
  gate_out_requested: "Gate-Out Requested",
  gate_out_approved: "Gate-Out Approved",
  gate_out_reversal_requested: "Gate-Out Reversal Requested",
  completed_gate_out_done: "Completed / Gate-Out Done",
  cancelled: "Cancelled",
}

const billingLabels = {
  unpaid: "Unpaid",
  payment_submitted: "Payment Submitted",
  payment_under_review: "Payment Under Review",
  payment_rejected: "Payment Rejected",
  additional_payment_required: "Additional Payment Required",
  paid_approved: "Paid / Approved",
}

const statusClass = (status) => {
  if (["stored_in_assigned_area", "completed_gate_out_done", "paid_approved"].includes(status)) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
  if (["approved_area_assigned", "gate_in_approved", "gate_out_approved"].includes(status)) return "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
  if (["rejected", "cancelled", "payment_rejected"].includes(status)) return "bg-red-50 text-red-700 ring-1 ring-red-100"
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
}

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString()
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [summary, setSummary] = useState({})
  const [filters, setFilters] = useState({ status: "all", billingStatus: "all", search: "" })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 })
  const [deletingId, setDeletingId] = useState("")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [alert, setAlert] = useState({ type: "", message: "" })
  const filterRef = useRef(null)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const canDeleteBooking = hasModulePermission(user, "operations", "delete")


  const loadBookings = async () => {
    try {
      setLoading(true)
      setAlert({ type: "", message: "" })
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.billingStatus) params.set("billingStatus", filters.billingStatus)
      if (filters.search.trim()) params.set("search", filters.search.trim())
      params.set("includeSummary", "false")
      const summaryParams = new URLSearchParams(params)
      params.set("page", String(page))
      params.set("limit", String(pageSize))

      const [tableResponse, statsResponse] = await Promise.all([
        api.get(`/admin/bookings/module-data?${params.toString()}`),
        api.get(`/admin/bookings/tracking-summary?${summaryParams.toString()}`),
      ])
      const data = tableResponse.data
      setBookings(data.bookings || [])
      setPaginationMeta({ total: Number(data.pagination?.total) || 0, totalPages: Math.max(Number(data.pagination?.totalPages) || 1, 1) })
      setSummary(statsResponse.data.summary || {})
    } catch (error) {
      setAlert({ type: "error", message: getApiError(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1) }, [filters.status, filters.billingStatus])

  useEffect(() => {
    loadBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.billingStatus, page, pageSize])

  const exportAllFiltered = async () => {
    if (exporting) return
    setExporting(true)
    setAlert({ type: "", message: "" })
    try {
      await downloadFilteredCsv("/admin/bookings/export", {
        ...filters,
        search: filters.search.trim(),
      }, "container-tracking-filtered")
    } catch (error) {
      setAlert({ type: "error", message: getApiError(error) })
    } finally {
      setExporting(false)
    }
  }

  const deleteBooking = async (booking) => {
    if (!canDeleteBooking) return
    const confirmed = window.confirm(
      `Delete booking ${booking.bookingReference}? This permanently removes the booking and its uploaded documents.`,
    )
    if (!confirmed) return

    try {
      setDeletingId(booking.id)
      setAlert({ type: "", message: "" })
      const { data } = await api.delete(`/admin/bookings/${booking.id}`)
      await loadBookings()
      setAlert({ type: "success", message: data.message || "Booking deleted successfully." })
    } catch (error) {
      setAlert({ type: "error", message: getApiError(error) })
    } finally {
      setDeletingId("")
    }
  }


  const editBooking = (booking) => {
    let route = "/billing/payment-verification"

    if (["pending_admin_approval", "rejected", "cancelled"].includes(booking.status)) {
      route = "/operations/pre-advice"
    } else if (booking.status === "approved_area_assigned") {
      route = "/operations/gate-in"
    } else if (["gate_out_requested", "gate_out_approved", "gate_out_reversal_requested", "completed_gate_out_done"].includes(booking.status)) {
      route = "/billing/release-container"
    }

    navigate(route, { state: { bookingId: booking.id, openMode: "edit" } })
  }

  // Summary fields are database-wide totals; never fall back to the current page.
  const totals = useMemo(() => ({
    all: Number(summary.total) || 0,
    active: Number(summary.active) || 0,
    completed: Number(summary.completed) || 0,
  }), [summary])

  const pagination = {
    page,
    setPage,
    pageSize,
    setPageSize: (value) => { setPageSize(Number(value) || 10); setPage(1) },
    totalItems: paginationMeta.total,
    totalPages: paginationMeta.totalPages,
    startItem: paginationMeta.total === 0 ? 0 : (page - 1) * pageSize + 1,
    endItem: Math.min(page * pageSize, paginationMeta.total),
    pageSizeOptions: [10, 25, 50, 100],
    paginatedItems: bookings,
  }

  return (
    <div className="space-y-6">
      <section className="card p-5 otli-module-frame">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between otli-module-hero">
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-emerald-700">Operations Monitoring</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Container Tracking</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Track bookings, container movements, yard locations, billing statuses, and remove test records when needed.</p>
          </div>
          <button type="button" onClick={loadBookings} className="btn-secondary shrink-0" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="otli-kpi-grid mt-5 grid gap-4 md:grid-cols-3 otli-module-kpis otli-tracking-kpis">
          {[
            { label: "Total Bookings", value: totals.all, icon: Boxes, tone: "slate" },
            { label: "Active Movements", value: totals.active, icon: Truck, tone: "blue" },
            { label: "Completed", value: totals.completed, icon: CheckCircle2, tone: "emerald" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`otli-tracking-stat otli-tracking-stat--${tone} rounded-2xl border p-4`}>
              <div className="otli-tracking-stat-inner flex items-center gap-3">
                <span className="otli-tracking-stat-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl" aria-hidden="true"><Icon size={19} /></span>
                <div className="otli-tracking-stat-copy min-w-0">
                  <p className="otli-tracking-stat-label text-xs font-semibold uppercase tracking-wide">{label}</p>
                  <p className="otli-tracking-stat-number mt-1 text-3xl font-bold tabular-nums">{Number(value || 0).toLocaleString("en-US")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4"><Alert type={alert.type}>{alert.message}</Alert></div>
      </section>

      <section className="card overflow-visible">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">All Bookings and Container Status</h3>
            <p className="text-sm font-semibold text-slate-500">Search, filter, and manage the container tracking list.</p>
          </div>

          <TableToolbar className="otli-toolbar-with-export">
            <button type="button" data-export-control onClick={exportAllFiltered} className="btn-secondary order-3 shrink-0" disabled={exporting || loading} title="Export all bookings matching these filters, across every page">
              <Download size={16} /> {exporting ? "Exporting..." : "Export All Filtered"}
            </button>
            <TableSearchField
                ariaLabel="Search bookings, containers, and clients"
                placeholder="Search booking, container, client..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                onKeyDown={(event) => { if (event.key === "Enter") { if (page !== 1) setPage(1); else loadBookings() } }}
              />

            <div className="relative order-2 otli-filter-control shrink-0" ref={filterRef}>
              <TableFilterButton open={showFilters} onClick={() => setShowFilters((current) => !current)} label="Filters" />

              {showFilters && (
                <FilterDropdownPortal open={showFilters} anchorRef={filterRef} onClose={() => setShowFilters(false)} className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="text-sm font-black text-slate-950">Filter Tracking</p>
                    <button type="button" onClick={() => setFilters((current) => ({ ...current, status: "all", billingStatus: "all" }))} className="text-xs font-black text-emerald-700">Reset</button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Booking Status</span>
                      <select className="input !py-3" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                        <option value="all">All booking statuses</option>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Billing Status</span>
                      <select className="input !py-3" value={filters.billingStatus} onChange={(event) => setFilters((current) => ({ ...current, billingStatus: event.target.value }))}>
                        <option value="all">All billing statuses</option>
                        {Object.entries(billingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </FilterDropdownPortal>
              )}
            </div>
          </TableToolbar>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">{loading && bookings.length === 0 ? "Loading container tracking data..." : `Showing ${bookings.length} of ${paginationMeta.total || 0} matching bookings`}</div>
        <div className="space-y-3 p-3 md:hidden" aria-label="Container tracking records">
          {!loading && bookings.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No bookings found for the selected filters.</p>}
          {bookings.map((booking) => (
            <OperationalRecordCard
              key={booking.id}
              eyebrow={booking.bookingReference}
              title={booking.containerNumber}
              subtitle={booking.clientName || "Client"}
              onOpen={() => setSelectedBooking(booking)}
              ariaLabel={`View details for ${booking.bookingReference}`}
              actions={(<TableCrudActions
                recordLabel={booking.bookingReference}
                onView={() => setSelectedBooking(booking)}
                onEdit={() => editBooking(booking)}
                onDelete={() => deleteBooking(booking)}
                deleteDisabled={!canDeleteBooking}
                deleteLabel={canDeleteBooking ? `Delete ${booking.bookingReference}` : "You do not have permission to delete bookings"}
                deleting={deletingId === booking.id}
              />)}
              status={
                <>
                  <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(booking.status)}`}>{statusLabels[booking.status] || booking.status}</span>
                  <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(booking.billingStatus)}`}>{billingLabels[booking.billingStatus] || booking.billingStatus}</span>
                  {booking.isOverstaying && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">Overstaying</span>}
                </>
              }
            >
              <RecordCardField label="Client email">{booking.clientEmail || "Not provided"}</RecordCardField>
              <RecordCardField label="Size / type">{booking.containerSize}ft · {String(booking.containerType || "").replaceAll("_", " ")}</RecordCardField>
              <RecordCardField label="Classification">{String(booking.containerLoadStatus || "Unknown").replaceAll("_", " ")} · {String(booking.rateType || "Unknown").replaceAll("_", " ")}</RecordCardField>
              <RecordCardField label="Billing">PHP {Number(booking.billingTotal || booking.paymentAmount || 0).toLocaleString("en-US")}</RecordCardField>
              <RecordCardField label="Yard location">{booking.assignedAreaName ? [booking.assignedAreaName, booking.assignedSlotNumber ? `Slot ${booking.assignedSlotNumber}` : "No slot"].join(" · ") : "Not assigned"}</RecordCardField>
              <RecordCardField label="Gate dates"><BookingDatesCell inDate={booking.inDate} expectedArrivalDate={booking.expectedArrivalDate} outDate={booking.outDate} /></RecordCardField>
              <RecordCardField label="Last updated">{formatDate(booking.updatedAt)}</RecordCardField>
            </OperationalRecordCard>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table data-mobile-view="scroll" className="otli-data-table min-w-[1250px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Booking / Client</th>
                <th className="px-5 py-4">Container</th>
                <th className="px-5 py-4">Booking Status</th>
                <th className="px-5 py-4">Billing</th>
                <th className="px-5 py-4">Yard Location</th>
                <th className="px-5 py-4">Gate Dates</th>
                <th className="px-5 py-4">Last Updated</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && bookings.length === 0 && <TableLoadingRow colSpan={8} rows={7} actionColumn label="Loading container tracking data" />}
              {(!loading || bookings.length > 0) && pagination.paginatedItems.map((booking) => (
                <tr key={booking.id} className="align-top transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <p className="font-black text-emerald-700">{booking.bookingReference}</p>
                    <p className="mt-1 font-bold text-slate-800">{booking.clientName || "Client"}</p>
                    {booking.clientEmail && <p className="text-xs text-slate-500">{booking.clientEmail}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-950">{booking.containerNumber}</p>
                    <p className="mt-1 text-xs font-bold capitalize text-slate-500">{booking.containerSize}ft • {String(booking.containerType || "").replaceAll("_", " ")}</p>
                    {booking.shippingLine && <p className="text-xs text-slate-500">{booking.shippingLine}</p>}
                  </td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(booking.status)}`}>{statusLabels[booking.status] || booking.status}</span></td>
                  <td className="px-5 py-4">
                    <p className="font-black text-slate-900">PHP {Number(booking.billingTotal || booking.paymentAmount || 0).toLocaleString()}</p>
                    {booking.billingStatus === "unpaid" ? (
                      <p className="mt-1 text-xs font-medium text-slate-500">Unpaid</p>
                    ) : (
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass(booking.billingStatus)}`}>{billingLabels[booking.billingStatus] || booking.billingStatus}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {booking.assignedAreaName ? (
                      <>
                        <p className="font-bold text-slate-800">{booking.assignedAreaName}</p>
                        {(booking.assignedBlockName || booking.assignedBlockCode) && <p className="mt-1 text-xs text-slate-500">{booking.assignedBlockName || booking.assignedBlockCode}</p>}
                        {booking.assignedSlotNumber && <p className="text-xs text-slate-500">Slot {booking.assignedSlotNumber}</p>}
                      </>
                    ) : <span className="text-xs font-semibold text-slate-600">Not assigned</span>}
                  </td>
                  <td className="px-5 py-4">
                    <BookingDatesCell inDate={booking.inDate} expectedArrivalDate={booking.expectedArrivalDate} outDate={booking.outDate} />
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(booking.updatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <TableCrudActions
                      recordLabel={booking.bookingReference}
                      onView={() => setSelectedBooking(booking)}
                      onEdit={() => editBooking(booking)}
                      onDelete={() => deleteBooking(booking)}
                      deleteDisabled={!canDeleteBooking}
                      deleteLabel={canDeleteBooking ? `Delete ${booking.bookingReference}` : "You do not have permission to delete bookings"}
                      deleting={deletingId === booking.id}
                    />
                  </td>
                </tr>
              ))}
              {!loading && bookings.length === 0 && (
                <tr><td colSpan="8" className="px-5 py-16 text-center font-semibold text-slate-500">No bookings found for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(!loading || bookings.length > 0) && <Pagination {...pagination} />}
      </section>

      {selectedBooking && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Container Tracking Details</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedBooking.bookingReference}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedBooking.clientName} • {selectedBooking.containerNumber}</p>
              </div>
              <ModalCloseButton onClick={() => setSelectedBooking(null)} label="Close booking details" />
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Client Email" value={selectedBooking.clientEmail} />
              <Detail label="Booking Status" value={statusLabels[selectedBooking.status] || selectedBooking.status} />
              <Detail label="Billing Status" value={billingLabels[selectedBooking.billingStatus] || selectedBooking.billingStatus} />
              <Detail label="Container" value={`${selectedBooking.containerSize}ft • ${String(selectedBooking.containerType || "").replaceAll("_", " ")}`} />
              <Detail label="Shipping Line" value={selectedBooking.shippingLine} />
              <Detail label="Billing Total" value={`PHP ${Number(selectedBooking.billingTotal || selectedBooking.paymentAmount || 0).toLocaleString()}`} />
              <Detail label="Yard Area" value={selectedBooking.assignedAreaName} />
              <Detail label="Block" value={selectedBooking.assignedBlockName || selectedBooking.assignedBlockCode} />
              <Detail label="Slot" value={selectedBooking.assignedSlotNumber} />
              <Detail label="Date In" value={formatDate(selectedBooking.inDate || selectedBooking.expectedArrivalDate)} />
              <Detail label="Date Out" value={formatDate(selectedBooking.outDate)} />
              <Detail label="Last Updated" value={formatDate(selectedBooking.updatedAt)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Detail = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-words text-sm font-bold text-slate-800">{value || "N/A"}</div>
  </div>
)

export default AdminBookings

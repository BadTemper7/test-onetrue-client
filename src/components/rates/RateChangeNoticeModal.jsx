import { useEffect, useState } from "react"
import { ArrowRight, BellRing, CalendarDays } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api"

const formatMoney = (value) => Number(value || 0).toLocaleString("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const getChargeLabel = (change) => {
  if (change?.chargeType === "lift_on") return "Lift On"
  if (change?.chargeType === "lift_off") return "Lift Off"
  if (change?.chargeType === "storage") return "Storage"
  if (change?.chargeType === "congestion") return "Congestion Surcharge"
  if (change?.chargeType === "total_handling") return "Total Handling"
  return change?.description || "Billing Rate"
}

const getLoadLabel = (value) => value === "empty" ? "Empty" : value === "laden" ? "Loaded" : "All loads"

const RateChangeNoticeModal = ({ enabled = true }) => {
  const navigate = useNavigate()
  const [notice, setNotice] = useState(null)
  const [changes, setChanges] = useState([])
  const [effectiveDate, setEffectiveDate] = useState("")
  const [rateType, setRateType] = useState("local")
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    const loadNotice = async () => {
      try {
        const { data } = await api.get("/client/rate-change-notice")
        if (cancelled) return
        if (!data?.notice) return
        setNotice(data.notice)
        setChanges(Array.isArray(data.changes) ? data.changes : [])
        setEffectiveDate(data.effectiveDate || "")
        setRateType(data.rateType === "international" ? "international" : "local")
      } catch {
        // The notice is supplementary and must never block the client portal.
      }
    }

    loadNotice()
    const handleFocus = () => loadNotice()
    const intervalId = window.setInterval(loadNotice, 15 * 60 * 1000)
    window.addEventListener("focus", handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleFocus)
    }
  }, [enabled])

  if (!notice) return null

  const acknowledge = async ({ viewRates = false } = {}) => {
    if (acknowledging) return
    setAcknowledging(true)
    try {
      await api.patch(`/client/notifications/${notice.id}/read`)
    } catch {
      // Close locally even if acknowledgement fails; a later login can retry.
    } finally {
      setNotice(null)
      setAcknowledging(false)
      if (viewRates) navigate("/rates")
    }
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation">
      <section
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-change-title"
      >
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-6 text-white md:px-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <BellRing size={24} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Rate Update Notice</p>
              <h2 id="rate-change-title" className="mt-1 text-2xl font-black md:text-3xl">New {rateType === "international" ? "International" : "Local"} rates are effective today</h2>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/15">
                <CalendarDays size={14} /> Effective {effectiveDate}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-900">
            For ongoing transactions, charges before the effectivity date keep the previous rate. Charges or service days from the effectivity date onward use the new rate. This applies to storage and other rate-based transactions.
          </div>

          {changes.length > 0 && (
            <div className="mt-5 max-h-[42vh] space-y-3 overflow-y-auto pr-1">
              {changes.map((change) => (
                <div key={change.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{getChargeLabel(change)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {getLoadLabel(change.loadStatus)} • {change.containerSize === "all" ? "All sizes" : `${change.containerSize}ft`} • Version {change.version || 1}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-black">
                      {change.previousRateAmount !== null && change.previousRateAmount !== undefined && (
                        <>
                          <span className="rounded-xl bg-white px-3 py-2 text-slate-500 ring-1 ring-slate-200">PHP {formatMoney(change.previousRateAmount)}</span>
                          <ArrowRight size={16} className="text-slate-400" />
                        </>
                      )}
                      <span className="rounded-xl bg-emerald-100 px-3 py-2 text-emerald-800">PHP {formatMoney(change.rateAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => acknowledge()} disabled={acknowledging}>
              {acknowledging ? "Saving..." : "Got it"}
            </button>
            <button type="button" className="btn-primary" onClick={() => acknowledge({ viewRates: true })} disabled={acknowledging}>
              View Updated Rates <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default RateChangeNoticeModal

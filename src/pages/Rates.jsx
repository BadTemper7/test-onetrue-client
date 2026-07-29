import { useEffect, useMemo, useState } from "react"
import { Banknote, Building2, Calculator, CircleDollarSign, QrCode, Smartphone } from "lucide-react"
import { api, getApiError, resolveFileUrl } from "../lib/api"

const scopeLabels = {
  base: "Fixed handling",
  storage: "Storage per day",
  display_only: "Reference only",
}

const unitLabels = {
  per_container: "per container",
  per_teu: "per 20ft equivalent",
  per_day: "per day",
  storage_day: "per container per day",
  fixed: "fixed charge",
}

const formatMoney = (value) => `PHP ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const Rates = () => {
  const [rates, setRates] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [ratesResponse, paymentResponse] = await Promise.all([
          api.get("/client/rates"),
          api.get("/client/payment-types"),
        ])
        setRates(ratesResponse.data.rates || [])
        setPaymentTypes(paymentResponse.data.paymentTypes || [])
      } catch (requestError) {
        setError(getApiError(requestError))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const groupedRates = useMemo(() => {
    const visibleRates = rates.filter((rate) => rate.billingScope !== "optional_stripping_stuffing")
    return {
      handling: visibleRates.filter((rate) => ["base", "display_only"].includes(rate.billingScope)),
      storage: visibleRates.filter((rate) => rate.billingScope === "storage"),
      total: visibleRates.length,
    }
  }, [rates])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-blue-800 p-7 text-white md:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ring-white/15"><Calculator size={14} /> Rates and Payment Options</div>
          <h1 className="mt-4 text-3xl font-black md:text-4xl">Container Yard Rates</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/75 md:text-base">Review the active Lift In, Lift Out, and storage charges used by automatic billing.</p>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <div className="grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" /></div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {[
              ["Configured rates", groupedRates.total, CircleDollarSign, "bg-emerald-50 text-emerald-700"],
              ["Payment options", paymentTypes.length, Building2, "bg-blue-50 text-blue-700"],
            ].map(([label, value, Icon, className]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div><span className={`grid h-12 w-12 place-items-center rounded-2xl ${className}`}><Icon size={20} /></span></div>
            ))}
          </section>

          {groupedRates.total === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-black text-slate-900">No rates configured yet</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">The administrator must add billing rates in Rate Setup before they can be used.</p>
            </section>
          ) : (
            <section className="space-y-5">
              {[
                ["Lift In and Lift Out", "Fixed charges applied to each booking based on container size.", groupedRates.handling],
                ["Storage", "The daily rate is multiplied by the actual number of billable storage days.", groupedRates.storage],
              ].map(([title, description, items]) => items.length > 0 && (
                <div key={title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                    <h2 className="text-xl font-black text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                  </div>
                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((rate) => (
                      <article key={rate.id} className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-200 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><p className="text-xs font-black uppercase tracking-wide text-emerald-700">{scopeLabels[rate.billingScope] || rate.billingScope}</p><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">{rate.rateType || "local"}</span></div><h3 className="mt-1 font-black text-slate-900">{rate.chargeCode?.startsWith("LIFT_ON_") ? "Lift On Charge" : rate.chargeCode?.startsWith("LIFT_OFF_") ? "Lift Off Charge" : rate.description}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{rate.containerSize === "all" ? "All sizes" : `${rate.containerSize}ft`}</span></div>
                        <p className="mt-4 text-2xl font-black text-slate-950">{formatMoney(rate.rateAmount)}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{rate.unitLabel || unitLabels[rate.unit] || rate.unit}</p>
                        {rate.freeDays > 0 && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Includes {rate.freeDays} free day{rate.freeDays === 1 ? "" : "s"}</p>}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-5"><h2 className="text-xl font-black text-slate-900">Available Payment Types</h2><p className="mt-1 text-sm text-slate-500">Select one of these accounts when uploading your payment proof.</p></div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {paymentTypes.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.type === "cash" ? "bg-emerald-50 text-emerald-700" : item.type === "bank" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>{item.type === "cash" ? <Banknote size={19} /> : item.type === "bank" ? <Building2 size={19} /> : <Smartphone size={19} />}</span><div><h3 className="font-black text-slate-900">{item.name}</h3><p className="text-xs font-bold capitalize text-slate-500">{item.type === "cash" ? "Cash payment" : item.type === "ewallet" ? "eWallet" : "Bank transfer"}</p></div></div>
                  {item.type === "cash" ? <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Pay at the authorized cashier and keep the official receipt for verification.</div> : <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm"><p><span className="font-bold text-slate-500">Institution:</span> <span className="font-black text-slate-800">{item.bankName || item.name}</span></p><p><span className="font-bold text-slate-500">Account:</span> <span className="font-black text-slate-800">{item.accountNumber}</span></p><p><span className="font-bold text-slate-500">Owner:</span> <span className="font-black text-slate-800">{item.accountName}</span></p></div>}
                  {item.qrUrl && <a href={resolveFileUrl(item.qrUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><QrCode size={16} /> View QR</a>}
                  {item.instructions && <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{item.instructions}</p>}
                </article>
              ))}
              {paymentTypes.length === 0 && <div className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">No payment types are available yet.</div>}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="font-black text-emerald-900">How the final bill is computed</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">Final billing is generated after Date Out is submitted and includes the matching Lift In, Lift Out, storage, and admin-added charges.</p>
          </section>
        </>
      )}
    </div>
  )
}

export default Rates

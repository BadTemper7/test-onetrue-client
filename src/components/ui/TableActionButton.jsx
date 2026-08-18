import { useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { LoaderCircle } from "lucide-react"

const variantClasses = {
  neutral:
    "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  dark:
    "border-slate-900 bg-slate-950 text-white hover:border-slate-800 hover:bg-slate-800",
  info:
    "border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100",
  success:
    "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100",
  warning:
    "border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100",
  danger:
    "border-red-100 bg-red-50 text-red-700 hover:border-red-200 hover:bg-red-100",
}

const sizeClasses = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-10 w-10 rounded-xl",
}

const TableActionButton = ({
  label,
  children,
  variant = "neutral",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...buttonProps
}) => {
  const buttonRef = useRef(null)
  const tooltipId = useId()
  const [tooltip, setTooltip] = useState(null)

  const showTooltip = () => {
    const button = buttonRef.current
    if (!button || !label) return

    const rect = button.getBoundingClientRect()
    const showBelow = rect.top < 54

    setTooltip({
      left: rect.left + rect.width / 2,
      top: showBelow ? rect.bottom + 8 : rect.top - 8,
      showBelow,
    })
  }

  const hideTooltip = () => setTooltip(null)
  const isDisabled = disabled || loading

  return (
    <>
      <span
        className="inline-flex shrink-0"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        <button
          ref={buttonRef}
          type={type}
          aria-label={label}
          aria-describedby={tooltip ? tooltipId : undefined}
          disabled={isDisabled}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className={`inline-flex shrink-0 items-center justify-center border transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
          {...buttonProps}
        >
          {loading ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : children}
        </button>
      </span>

      {tooltip && typeof document !== "undefined" && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none fixed z-[9999] max-w-[220px] -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl ${tooltip.showBelow ? "" : "-translate-y-full"}`}
          style={{ left: tooltip.left, top: tooltip.top }}
        >
          {label}
        </span>,
        document.body,
      )}
    </>
  )
}

export default TableActionButton

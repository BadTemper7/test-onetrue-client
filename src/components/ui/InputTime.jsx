// components/ui/InputTime.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiEdit2,
  FiRotateCcw,
  FiX,
} from "react-icons/fi";

const InputTime = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "Select time",
  required = false,
  disabled = false,
  error = "",
  className = "",
  labelClassName = "",
  helperText = "",
  size = "md",
  clearable = false,
  minuteStep = 1,
  hourlyOnly = false,
  use24Hour = false,
  ...props
}) => {
  const wrapperRef = useRef(null);
  const manualHourRef = useRef(null);
  const manualMinuteRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualError, setManualError] = useState("");
  const [pickerPlacement, setPickerPlacement] = useState("bottom");

  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState("AM");

  const [manualHour, setManualHour] = useState("12");
  const [manualMinute, setManualMinute] = useState("00");
  const [manualPeriod, setManualPeriod] = useState("AM");

  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 text-sm sm:text-base",
    lg: "h-14 px-5 text-base sm:text-lg",
  };

  const normalizedMinuteStep = Math.min(
    60,
    Math.max(1, Number(minuteStep) || 1),
  );

  const isHourlyOnly = hourlyOnly || normalizedMinuteStep >= 60;

  const minuteOptions = useMemo(
    () =>
      isHourlyOnly
        ? [0]
        : Array.from(
            { length: Math.ceil(60 / normalizedMinuteStep) },
            (_, index) => index * normalizedMinuteStep,
          ).filter((minute) => minute < 60),
    [isHourlyOnly, normalizedMinuteStep],
  );

  const hourOptions = useMemo(
    () =>
      use24Hour
        ? Array.from({ length: 24 }, (_, index) => index)
        : Array.from({ length: 12 }, (_, index) => index + 1),
    [use24Hour],
  );

  const parseValue = (incomingValue) => {
    if (!incomingValue) return null;

    if (incomingValue instanceof Date) {
      return Number.isNaN(incomingValue.getTime()) ? null : incomingValue;
    }

    const parsed = new Date(incomingValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const to12HourParts = (date) => {
    const hour24 = date.getHours();

    return {
      hour: hour24 % 12 || 12,
      minute: date.getMinutes(),
      period: hour24 >= 12 ? "PM" : "AM",
    };
  };

  const syncTemporaryValues = (hour, minute, period) => {
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
    setManualHour(String(hour).padStart(2, "0"));
    setManualMinute(String(minute).padStart(2, "0"));
    setManualPeriod(period);
    setManualError("");
  };

  useEffect(() => {
    const parsedDate = parseValue(value);

    if (!parsedDate) {
      setSelectedHour(12);
      setSelectedMinute(0);
      setSelectedPeriod("AM");
      syncTemporaryValues(12, 0, "AM");
      return;
    }

    if (use24Hour) {
      const hour = parsedDate.getHours();
      const minute = isHourlyOnly ? 0 : parsedDate.getMinutes();

      setSelectedHour(hour);
      setSelectedMinute(minute);
      setSelectedPeriod("");
      syncTemporaryValues(hour, minute, "");
      return;
    }

    const { hour, minute: parsedMinute, period } = to12HourParts(parsedDate);
    const minute = isHourlyOnly ? 0 : parsedMinute;

    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    syncTemporaryValues(hour, minute, period);
  }, [value, use24Hour, isHourlyOnly]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, selectedHour, selectedMinute, selectedPeriod]);

  useEffect(() => {
    if (isOpen && isManualInput && manualHourRef.current) {
      const timeout = window.setTimeout(() => {
        manualHourRef.current?.focus();
        manualHourRef.current?.select();
      }, 50);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isOpen, isManualInput]);

  const createTimeDate = (hour, minute, period) => {
    const date = parseValue(value) || new Date();
    let hour24 = hour;

    if (!use24Hour) {
      if (period === "PM" && hour !== 12) {
        hour24 = hour + 12;
      }

      if (period === "AM" && hour === 12) {
        hour24 = 0;
      }
    }

    date.setHours(hour24, isHourlyOnly ? 0 : minute, 0, 0);
    return date;
  };

  const emitChange = (date) => {
    onChange?.({
      target: {
        name,
        value: date,
      },
    });
  };

  const openPicker = () => {
    if (disabled) return;

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedPickerHeight = isHourlyOnly ? 430 : 620;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPickerPlacement(spaceBelow < estimatedPickerHeight && spaceAbove > spaceBelow ? "top" : "bottom");
    }

    syncTemporaryValues(selectedHour, isHourlyOnly ? 0 : selectedMinute, selectedPeriod);
    setIsManualInput(false);
    setIsOpen(true);
  };

  const handleSelect = () => {
    const date = createTimeDate(tempHour, tempMinute, tempPeriod);

    setSelectedHour(tempHour);
    setSelectedMinute(tempMinute);
    setSelectedPeriod(tempPeriod);
    syncTemporaryValues(tempHour, tempMinute, tempPeriod);

    emitChange(date);
    setIsOpen(false);
    setIsManualInput(false);
  };

  const handleCancel = () => {
    syncTemporaryValues(selectedHour, selectedMinute, selectedPeriod);
    setIsOpen(false);
    setIsManualInput(false);
  };

  const handleClear = (event) => {
    event.stopPropagation();

    setSelectedHour(12);
    setSelectedMinute(0);
    setSelectedPeriod(use24Hour ? "" : "AM");
    syncTemporaryValues(12, 0, use24Hour ? "" : "AM");
    emitChange(null);
    setIsOpen(false);
  };

  const handleNow = () => {
    const now = new Date();

    if (use24Hour) {
      const hour = now.getHours();
      const minute = isHourlyOnly ? 0 : now.getMinutes();

      setTempHour(hour);
      setTempMinute(minute);
      setManualHour(String(hour).padStart(2, "0"));
      setManualMinute(String(minute).padStart(2, "0"));
      return;
    }

    const { hour, minute: currentMinute, period } = to12HourParts(now);
    const minute = isHourlyOnly ? 0 : currentMinute;

    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
    setManualHour(String(hour).padStart(2, "0"));
    setManualMinute(String(minute).padStart(2, "0"));
    setManualPeriod(period);
  };

  const toggleManualInput = () => {
    syncTemporaryValues(tempHour, tempMinute, tempPeriod);
    setIsManualInput((current) => !current);
  };

  const handleManualHourChange = (event) => {
    const input = event.target.value.replace(/\D/g, "").slice(0, 2);
    setManualHour(input);
    setManualError("");
  };

  const handleManualMinuteChange = (event) => {
    if (isHourlyOnly) {
      setManualMinute("00");
      setManualError("");
      return;
    }
    const input = event.target.value.replace(/\D/g, "").slice(0, 2);
    setManualMinute(input);
    setManualError("");
  };

  const handleManualConfirm = () => {
    const hour = Number(manualHour);
    const minute = isHourlyOnly ? 0 : Number(manualMinute);

    const minimumHour = use24Hour ? 0 : 1;
    const maximumHour = use24Hour ? 23 : 12;

    if (
      manualHour.trim() === "" ||
      manualMinute.trim() === "" ||
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < minimumHour ||
      hour > maximumHour ||
      minute < 0 ||
      minute > 59 ||
      (isHourlyOnly && minute !== 0)
    ) {
      setManualError(
        use24Hour
          ? "Enter a valid time from 00:00 to 23:59."
          : "Enter a valid time from 01:00 to 12:59.",
      );
      return;
    }

    const date = createTimeDate(hour, minute, manualPeriod);

    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(manualPeriod);
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(manualPeriod);
    setManualHour(String(hour).padStart(2, "0"));
    setManualMinute(String(minute).padStart(2, "0"));
    setManualError("");

    emitChange(date);
    setIsOpen(false);
    setIsManualInput(false);
  };

  const handleManualKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleManualConfirm();
    }

    if (event.key === "Tab" && event.currentTarget === manualHourRef.current) {
      event.preventDefault();
      manualMinuteRef.current?.focus();
      manualMinuteRef.current?.select();
    }
  };

  const formatDisplay = () => {
    const date = parseValue(value);
    if (!date) return "";

    if (use24Hour) {
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const displayValue = formatDisplay();

  const optionButtonClass = (isSelected) =>
    [
      "flex h-11 w-full items-center justify-center rounded-xl",
      "text-sm font-semibold transition-all duration-200",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
      isSelected
        ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
    ].join(" ");

  return (
    <div className={`w-full ${className}`} ref={wrapperRef}>
      {label && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor={name}
            className={`text-sm font-semibold text-slate-700 ${labelClassName}`}
          >
            {label}
            {required && (
              <span className="ml-1 text-rose-500" aria-hidden="true">
                *
              </span>
            )}
          </label>

          {displayValue && !disabled && (
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 sm:inline-flex">
              Time selected
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <button
          id={name}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              handleCancel();
            } else {
              openPicker();
            }
          }}
          onBlur={onBlur}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
          className={[
            "group relative flex w-full items-center rounded-2xl border text-left",
            "outline-none transition-all duration-200",
            "focus-visible:ring-4",
            sizes[size] || sizes.md,
            error
              ? "border-rose-300 bg-rose-50/60 focus-visible:border-rose-500 focus-visible:ring-rose-100"
              : "border-slate-200 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md focus-visible:border-emerald-500 focus-visible:ring-emerald-100",
            disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70 shadow-none"
              : "cursor-pointer",
          ].join(" ")}
          {...props}
        >
          <span
            className={[
              "mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "transition-all duration-200",
              error
                ? "bg-rose-100 text-rose-500"
                : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
            ].join(" ")}
          >
            <FiClock className="h-4.5 w-4.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={[
                "block truncate",
                displayValue
                  ? "font-semibold text-slate-800"
                  : "font-normal text-slate-400",
              ].join(" ")}
            >
              {displayValue || placeholder}
            </span>
          </span>

          <span className="ml-3 flex items-center gap-1">
            {clearable && displayValue && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected time"
                onClick={handleClear}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    handleClear(event);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
              >
                <FiX className="h-4 w-4" />
              </span>
            )}

            {error ? (
              <FiAlertCircle className="h-5 w-5 text-rose-500" />
            ) : (
              <FiChevronDown
                className={[
                  "h-5 w-5 text-slate-400 transition-transform duration-200",
                  isOpen ? "rotate-180 text-emerald-600" : "",
                ].join(" ")}
              />
            )}
          </span>
        </button>

        {isOpen && !disabled && (
          <div
            role="dialog"
            aria-label="Choose time"
            className={[
              "absolute left-0 z-50 w-full min-w-[290px]",
              pickerPlacement === "top" ? "bottom-full mb-3" : "top-full mt-3",
              "overflow-hidden rounded-3xl border border-slate-200",
              "bg-white shadow-2xl shadow-slate-300/50",
              "sm:w-[390px]",
            ].join(" ")}
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">
                    Time picker
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-800">
                    {isManualInput ? "Enter the time" : "Select a time"}
                  </h3>
                </div>

                {!isHourlyOnly && <button
                  type="button"
                  onClick={toggleManualInput}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 text-xs font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  {isManualInput ? (
                    <>
                      <FiClock className="h-4 w-4" />
                      Picker
                    </>
                  ) : (
                    <>
                      <FiEdit2 className="h-4 w-4" />
                      Manual
                    </>
                  )}
                </button>}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-200">
                <span className="text-xs font-medium text-slate-300">
                  Selected time
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {String(tempHour).padStart(2, "0")}:
                  {String(tempMinute).padStart(2, "0")}
                  {!use24Hour && (
                    <span className="ml-2 text-sm font-semibold text-emerald-300">
                      {tempPeriod}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {isManualInput ? (
                <div>
                  <div className="flex items-start justify-center gap-2 sm:gap-3">
                    <div className="flex-1">
                      <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Hour
                      </label>
                      <input
                        ref={manualHourRef}
                        type="text"
                        inputMode="numeric"
                        value={manualHour}
                        onChange={handleManualHourChange}
                        onKeyDown={handleManualKeyDown}
                        maxLength={2}
                        placeholder={use24Hour ? "00" : "12"}
                        className={[
                          "h-16 w-full rounded-2xl border bg-slate-50 text-center",
                          "text-2xl font-bold text-slate-800 outline-none transition",
                          manualError
                            ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
                        ].join(" ")}
                      />
                    </div>

                    <span className="mt-10 text-2xl font-bold text-slate-300">
                      :
                    </span>

                    <div className="flex-1">
                      <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Minute
                      </label>
                      <input
                        ref={manualMinuteRef}
                        type="text"
                        inputMode="numeric"
                        value={manualMinute}
                        onChange={handleManualMinuteChange}
                        onKeyDown={handleManualKeyDown}
                        maxLength={2}
                        placeholder="00"
                        className={[
                          "h-16 w-full rounded-2xl border bg-slate-50 text-center",
                          "text-2xl font-bold text-slate-800 outline-none transition",
                          manualError
                            ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100",
                        ].join(" ")}
                      />
                    </div>

                    {!use24Hour && (
                      <div className="w-[84px]">
                        <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Period
                        </label>
                        <div className="grid h-16 grid-cols-1 rounded-2xl bg-slate-100 p-1">
                          {["AM", "PM"].map((period) => (
                            <button
                              key={period}
                              type="button"
                              onClick={() => {
                                setManualPeriod(period);
                                setTempPeriod(period);
                              }}
                              className={[
                                "rounded-xl text-xs font-bold transition",
                                manualPeriod === period
                                  ? "bg-white text-emerald-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-700",
                              ].join(" ")}
                            >
                              {period}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {manualError ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
                      <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{manualError}</span>
                    </div>
                  ) : (
                    <p className="mt-4 text-center text-xs text-slate-400">
                      Press Enter to confirm the selected time.
                    </p>
                  )}
                </div>
              ) : isHourlyOnly ? (
                <div>
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Select Hour</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {hourOptions.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => {
                          setTempHour(hour);
                          setTempMinute(0);
                          setManualHour(String(hour).padStart(2, "0"));
                          setManualMinute("00");
                        }}
                        className={optionButtonClass(tempHour === hour)}
                      >
                        {String(hour).padStart(2, "0")}:00
                      </button>
                    ))}
                  </div>

                  {!use24Hour && (
                    <div className="mt-4">
                      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Period</p>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                        {["AM", "PM"].map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => {
                              setTempPeriod(period);
                              setManualPeriod(period);
                            }}
                            className={[
                              "h-11 rounded-xl text-sm font-bold transition-all",
                              tempPeriod === period
                                ? "bg-white text-emerald-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700",
                            ].join(" ")}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-center text-xs font-semibold text-slate-400">Appointments are available in one-hour intervals only.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Hour
                    </p>
                    <div className="h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5 [scrollbar-width:thin]">
                      <div className="space-y-1">
                        {hourOptions.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setTempHour(hour);
                              setManualHour(String(hour).padStart(2, "0"));
                            }}
                            className={optionButtonClass(tempHour === hour)}
                          >
                            {String(hour).padStart(2, "0")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Minute
                    </p>
                    <div className="h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-1.5 [scrollbar-width:thin]">
                      <div className="space-y-1">
                        {minuteOptions.map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => {
                              setTempMinute(minute);
                              setManualMinute(String(minute).padStart(2, "0"));
                            }}
                            className={optionButtonClass(tempMinute === minute)}
                          >
                            {String(minute).padStart(2, "0")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!use24Hour && (
                    <div className="col-span-2">
                      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Period
                      </p>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                        {["AM", "PM"].map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => {
                              setTempPeriod(period);
                              setManualPeriod(period);
                            }}
                            className={[
                              "h-11 rounded-xl text-sm font-bold transition-all",
                              tempPeriod === period
                                ? "bg-white text-emerald-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700",
                            ].join(" ")}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={handleNow}
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-emerald-600 hover:shadow-sm"
              >
                <FiRotateCcw className="h-4 w-4" />
                Now
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-white hover:shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={isManualInput ? handleManualConfirm : handleSelect}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <FiCheck className="h-4 w-4" />
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          id={`${name}-error`}
          className="mt-2 flex items-start gap-2 text-sm text-rose-600"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p
          id={`${name}-helper`}
          className="mt-2 text-sm leading-5 text-slate-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default InputTime;

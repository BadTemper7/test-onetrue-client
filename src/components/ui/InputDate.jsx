// components/ui/InputDate.jsx
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiX,
} from "react-icons/fi";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SIZE_CLASSES = {
  sm: "h-10 text-sm",
  md: "h-12 text-sm sm:text-base",
  lg: "h-14 text-base sm:text-lg",
};

const formatDateForDisplay = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const year = parsedDate.getFullYear();

  return `${month}/${day}/${year}`;
};

const normalizeDate = (date) => {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
  );
};

const parseDateFromString = (dateString) => {
  const value = dateString.trim();
  const usFormat = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const isoFormat = value.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);

  let month;
  let day;
  let year;

  if (usFormat) {
    month = Number(usFormat[1]);
    day = Number(usFormat[2]);
    year = Number(usFormat[3]);
  } else if (isoFormat) {
    year = Number(isoFormat[1]);
    month = Number(isoFormat[2]);
    day = Number(isoFormat[3]);
  } else {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  const isValidDate =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return isValidDate ? parsedDate : null;
};

const PickerInput = forwardRef(
  (
    {
      value,
      onClick,
      placeholder,
      disabled,
      error,
      clearable,
      onClear,
      size,
      name,
    },
    ref,
  ) => (
    <div className="group relative w-full">
      <button
        ref={ref}
        id={name}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`
          ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
          flex w-full items-center rounded-2xl border bg-white px-4 text-left
          shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200
          ${clearable && value && !disabled ? "pr-20" : "pr-12"}
          ${
            error
              ? "border-red-300 ring-4 ring-red-50 hover:border-red-400 focus:border-red-500"
              : "border-slate-200 hover:border-emerald-300 hover:shadow-md focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          }
          ${
            disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
              : "cursor-pointer text-slate-800"
          }
        `}
      >
        <span
          className={`mr-3 grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
            error
              ? "bg-red-50 text-red-500"
              : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
          }`}
        >
          <FiCalendar className="h-4 w-4" />
        </span>

        <span
          className={`min-w-0 flex-1 truncate ${
            value ? "font-medium text-slate-800" : "text-slate-400"
          }`}
        >
          {value || placeholder}
        </span>
      </button>

      <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(event) => {
              event.stopPropagation();
              onClear(event);
            }}
            className="pointer-events-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}

        {error ? (
          <FiAlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <FiChevronDown className="h-4 w-4 text-slate-400 transition-transform group-focus-within:rotate-180" />
        )}
      </div>
    </div>
  ),
);

PickerInput.displayName = "PickerInput";

const InputDate = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "Select date",
  required = false,
  disabled = false,
  error = "",
  className = "",
  labelClassName = "",
  minDate = null,
  maxDate = null,
  includeDates = null,
  excludeDates = null,
  dateFormat = "MM/dd/yyyy",
  showTimeSelect = false,
  timeFormat = "HH:mm",
  timeIntervals = 30,
  helperText = "",
  size = "md",
  clearable = false,
  todayButton = "Today",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualError, setManualError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const manualInputRef = useRef(null);

  const normalizedMinDate = useMemo(() => normalizeDate(minDate), [minDate]);
  const normalizedMaxDate = useMemo(() => normalizeDate(maxDate), [maxDate]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = normalizedMinDate
      ? normalizedMinDate.getFullYear()
      : currentYear - 100;
    const endYear = normalizedMaxDate
      ? normalizedMaxDate.getFullYear()
      : currentYear + 20;

    return Array.from(
      { length: Math.max(endYear - startYear + 1, 1) },
      (_, index) => startYear + index,
    );
  }, [normalizedMinDate, normalizedMaxDate]);

  useEffect(() => {
    if (!value) {
      setSelectedDate(null);
      setManualDate("");
      return;
    }

    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      setSelectedDate(parsedDate);
      setManualDate(formatDateForDisplay(parsedDate));
    }
  }, [value]);

  useEffect(() => {
    if (!isManualInput || !manualInputRef.current) return undefined;

    const focusTimer = window.setTimeout(() => {
      manualInputRef.current?.focus();
      manualInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, [isManualInput]);

  const emitChange = (nextDate) => {
    onChange?.({
      target: {
        name,
        value: nextDate,
      },
    });
  };

  const validateDate = (date) => {
    const normalizedDate = normalizeDate(date);

    if (!normalizedDate) return "Invalid date format. Use MM/DD/YYYY";

    if (normalizedMinDate && normalizedDate < normalizedMinDate) {
      return `Date must be on or after ${formatDateForDisplay(normalizedMinDate)}`;
    }

    if (normalizedMaxDate && normalizedDate > normalizedMaxDate) {
      return `Date must be on or before ${formatDateForDisplay(normalizedMaxDate)}`;
    }

    if (includeDates?.length) {
      const isIncluded = includeDates.some(
        (includedDate) =>
          normalizeDate(includedDate)?.getTime() === normalizedDate.getTime(),
      );

      if (!isIncluded) return "Selected date is not available";
    }

    if (excludeDates?.length) {
      const isExcluded = excludeDates.some(
        (excludedDate) =>
          normalizeDate(excludedDate)?.getTime() === normalizedDate.getTime(),
      );

      if (isExcluded) return "Selected date is not available";
    }

    return "";
  };

  const handleManualChange = (event) => {
    const numbersOnly = event.target.value.replace(/\D/g, "").slice(0, 8);
    let formattedValue = numbersOnly;

    if (numbersOnly.length > 4) {
      formattedValue = `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2, 4)}/${numbersOnly.slice(4)}`;
    } else if (numbersOnly.length > 2) {
      formattedValue = `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`;
    }

    setManualDate(formattedValue);
    setManualError("");
  };

  const cancelManualInput = () => {
    setIsManualInput(false);
    setManualError("");
    setManualDate(selectedDate ? formatDateForDisplay(selectedDate) : "");
  };

  const handleManualConfirm = () => {
    if (!manualDate.trim()) {
      setManualError("Please enter a date");
      return;
    }

    const parsedDate = parseDateFromString(manualDate);
    const validationMessage = validateDate(parsedDate);

    if (validationMessage) {
      setManualError(validationMessage);
      return;
    }

    setSelectedDate(parsedDate);
    setManualDate(formatDateForDisplay(parsedDate));
    setManualError("");
    setIsManualInput(false);
    emitChange(parsedDate);
  };

  const handleManualKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleManualConfirm();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelManualInput();
    }
  };

  const handleClear = (event) => {
    event?.stopPropagation?.();
    setSelectedDate(null);
    setManualDate("");
    setManualError("");
    setIsOpen(false);
    emitChange(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setManualDate(formatDateForDisplay(date));
    setManualError("");

    if (!showTimeSelect) {
      setIsOpen(false);
    }

    emitChange(date);
  };

  const openManualInput = () => {
    setIsOpen(false);
    setManualError("");
    setManualDate(selectedDate ? formatDateForDisplay(selectedDate) : "");
    setIsManualInput(true);
  };

  const renderCustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => (
    <div className="border-b border-slate-100 bg-white px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          aria-label="Previous month"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="relative min-w-0">
            <select
              value={date.getMonth()}
              onChange={(event) => changeMonth(Number(event.target.value))}
              className="h-9 max-w-[140px] appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={date.getFullYear()}
              onChange={(event) => changeYear(Number(event.target.value))}
              className="h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          aria-label="Next month"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        ...(showTimeSelect && {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    : "";

  const activeError = manualError || error;

  return (
    <div className={`w-full ${className}`}>
      <style>{`
        .modern-date-picker-popper {
          z-index: 9999 !important;
        }

        .modern-date-picker-popper .react-datepicker {
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
          font-family: inherit;
        }

        .modern-date-picker-popper .react-datepicker__header {
          border: 0;
          background: #ffffff;
          padding: 0;
        }

        .modern-date-picker-popper .react-datepicker__month-container {
          width: 320px;
        }

        .modern-date-picker-popper .react-datepicker__day-names {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin: 0;
          padding: 12px 14px 6px;
        }

        .modern-date-picker-popper .react-datepicker__day-name {
          width: auto;
          margin: 0;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          line-height: 28px;
          text-transform: uppercase;
        }

        .modern-date-picker-popper .react-datepicker__month {
          margin: 0;
          padding: 4px 14px 14px;
        }

        .modern-date-picker-popper .react-datepicker__week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .modern-date-picker-popper .react-datepicker__day {
          display: inline-grid;
          width: 36px;
          height: 36px;
          margin: 3px auto;
          place-items: center;
          border-radius: 12px;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
          transition: all 150ms ease;
        }

        .modern-date-picker-popper .react-datepicker__day:hover {
          border-radius: 12px;
          background: #eef2ff;
          color: #087A55;
        }

        .modern-date-picker-popper .react-datepicker__day--keyboard-selected {
          background: #eef2ff;
          color: #087A55;
        }

        .modern-date-picker-popper .react-datepicker__day--selected,
        .modern-date-picker-popper .react-datepicker__day--in-selecting-range,
        .modern-date-picker-popper .react-datepicker__day--in-range {
          background: linear-gradient(135deg, #0F1D73, #087A55);
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(8, 122, 85, 0.28);
        }

        .modern-date-picker-popper .react-datepicker__day--today:not(.react-datepicker__day--selected) {
          border: 1px solid #a5b4fc;
          background: #f5f3ff;
          color: #087A55;
        }

        .modern-date-picker-popper .react-datepicker__day--outside-month {
          color: #cbd5e1;
        }

        .modern-date-picker-popper .react-datepicker__day--disabled {
          cursor: not-allowed;
          color: #dbe2ea;
          opacity: 0.75;
        }

        .modern-date-picker-popper .react-datepicker__day--disabled:hover {
          background: transparent;
          color: #dbe2ea;
        }

        .modern-date-picker-popper .react-datepicker__today-button {
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
          padding: 12px;
          color: #087A55;
          font-size: 13px;
          font-weight: 700;
          transition: background 150ms ease;
        }

        .modern-date-picker-popper .react-datepicker__today-button:hover {
          background: #f8fafc;
        }

        .modern-date-picker-popper .react-datepicker__time-container {
          border-left: 1px solid #f1f5f9;
        }

        .modern-date-picker-popper .react-datepicker__time-container,
        .modern-date-picker-popper .react-datepicker__time-box {
          width: 110px;
        }

        .modern-date-picker-popper .react-datepicker__time-list-item {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px 8px;
          border-radius: 10px;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
        }

        .modern-date-picker-popper .react-datepicker__time-list-item:hover {
          background: #eef2ff !important;
          color: #087A55;
        }

        .modern-date-picker-popper .react-datepicker__time-list-item--selected {
          background: #087A55 !important;
          color: #ffffff !important;
        }

        @media (max-width: 420px) {
          .modern-date-picker-popper .react-datepicker__month-container {
            width: min(320px, calc(100vw - 32px));
          }

          .modern-date-picker-popper .react-datepicker__day {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>

      {label && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor={name}
            className={`text-sm font-semibold text-slate-700 ${labelClassName}`}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {!disabled && (
            <button
              type="button"
              onClick={isManualInput ? cancelManualInput : openManualInput}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
            >
              {isManualInput ? (
                <>
                  <FiCalendar className="h-3.5 w-3.5" />
                  Use calendar
                </>
              ) : (
                <>
                  <FiEdit3 className="h-3.5 w-3.5" />
                  Type date
                </>
              )}
            </button>
          )}
        </div>
      )}

      {isManualInput ? (
        <div>
          <div className="relative">
            <span
              className={`absolute left-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl ${
                manualError
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <FiEdit3 className="h-4 w-4" />
            </span>

            <input
              ref={manualInputRef}
              id={name}
              name={name}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={manualDate}
              onChange={handleManualChange}
              onKeyDown={handleManualKeyDown}
              onBlur={onBlur}
              placeholder="MM/DD/YYYY"
              disabled={disabled}
              aria-invalid={Boolean(manualError)}
              aria-describedby={
                manualError ? `${name}-manual-error` : undefined
              }
              className={`
                ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
                w-full rounded-2xl border bg-white pl-14 pr-24 font-medium text-slate-800
                shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-200
                placeholder:font-normal placeholder:text-slate-400
                ${
                  manualError
                    ? "border-red-300 ring-4 ring-red-50 focus:border-red-500"
                    : "border-slate-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                }
                ${
                  disabled
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
                    : ""
                }
              `}
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                onClick={cancelManualInput}
                aria-label="Cancel manual date entry"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleManualConfirm}
                aria-label="Confirm manual date"
                className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
              >
                <FiCheck className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!manualError && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-400">
              <span>Format: MM/DD/YYYY</span>
              <span>Enter to save, Esc to cancel</span>
            </div>
          )}
        </div>
      ) : (
        <DatePicker
          selected={selectedDate}
          onChange={handleDateSelect}
          onBlur={onBlur}
          dateFormat={dateFormat}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          includeDates={includeDates}
          excludeDates={excludeDates}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          timeIntervals={timeIntervals}
          customInput={
            <PickerInput
              name={name}
              value={displayValue}
              placeholder={placeholder}
              disabled={disabled}
              error={error}
              clearable={clearable}
              onClear={handleClear}
              size={size}
            />
          }
          open={isOpen}
          onInputClick={() => !disabled && setIsOpen(true)}
          onClickOutside={() => setIsOpen(false)}
          onCalendarOpen={() => setIsOpen(true)}
          onCalendarClose={() => setIsOpen(false)}
          shouldCloseOnSelect={!showTimeSelect}
          renderCustomHeader={renderCustomHeader}
          todayButton={todayButton}
          wrapperClassName="w-full"
          calendarClassName="modern-date-picker-calendar"
          popperClassName="modern-date-picker-popper"
          popperPlacement="bottom-start"
          showPopperArrow={false}
          {...props}
        />
      )}

      {activeError && (
        <div
          id={manualError ? `${name}-manual-error` : `${name}-error`}
          className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{activeError}</p>
        </div>
      )}

      {helperText && !activeError && (
        <p className="mt-2 text-sm leading-5 text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default InputDate;

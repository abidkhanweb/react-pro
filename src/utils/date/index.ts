import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addHours,
  subDays,
  subHours,
  isBefore,
  isAfter,
  isSameDay,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
} from "date-fns"

/* -------------------------------------------------
 * Constants (Min / Max / Defaults)
 * ------------------------------------------------- */

// Minimum selectable hour (e.g. 00:00)
export const MIN_HOUR = 0

// Maximum selectable hour (e.g. 23:59)
export const MAX_HOUR = 23

// Default time values
export const DEFAULT_START_HOUR = 9
export const DEFAULT_END_HOUR = 18

/* -------------------------------------------------
 * Day Boundaries
 * ------------------------------------------------- */

export const getStartOfDay = (date = new Date()) => startOfDay(date)
export const getEndOfDay = (date = new Date()) => endOfDay(date)

/* -------------------------------------------------
 * Week / Month / Year Boundaries
 * ------------------------------------------------- */

export const getStartOfWeek = (date = new Date()) =>
  startOfWeek(date, { weekStartsOn: 1 }) // Monday

export const getEndOfWeek = (date = new Date()) =>
  endOfWeek(date, { weekStartsOn: 1 })

export const getStartOfMonth = (date = new Date()) => startOfMonth(date)
export const getEndOfMonth = (date = new Date()) => endOfMonth(date)

export const getStartOfYear = (date = new Date()) => startOfYear(date)
export const getEndOfYear = (date = new Date()) => endOfYear(date)

/* -------------------------------------------------
 * Relative Date Helpers (Dashboards love these)
 * ------------------------------------------------- */

export const getLast7Days = () => ({
  from: startOfDay(subDays(new Date(), 6)),
  to: endOfDay(new Date()),
})

export const getLast30Days = () => ({
  from: startOfDay(subDays(new Date(), 29)),
  to: endOfDay(new Date()),
})

export const getNext24Hours = () => ({
  from: new Date(),
  to: addHours(new Date(), 24),
})

/* -------------------------------------------------
 * Comparison Helpers
 * ------------------------------------------------- */

export const isDateBefore = (a: Date, b: Date) => isBefore(a, b)
export const isDateAfter = (a: Date, b: Date) => isAfter(a, b)
export const isSameCalendarDay = (a: Date, b: Date) => isSameDay(a, b)

/* -------------------------------------------------
 * Difference Helpers
 * ------------------------------------------------- */

export const diffInMinutes = (a: Date, b: Date) =>
  differenceInMinutes(a, b)

export const diffInHours = (a: Date, b: Date) =>
  differenceInHours(a, b)

export const diffInDays = (a: Date, b: Date) =>
  differenceInDays(a, b)

/* -------------------------------------------------
 * Formatting (standardize formats)
 * ------------------------------------------------- */

export const DATE_FORMAT = "yyyy-MM-dd"
export const TIME_FORMAT = "HH:mm"
export const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm"

export const formatDate = (date: Date, fmt = DATE_FORMAT) =>
  format(date, fmt)

// Booking a tow for later. Mirrors the API timings in config/schedulingConfig.
// For local testing the EXPO_PUBLIC_SCHEDULE_* vars shorten them; set the
// matching SCHEDULE_* vars on the API too (see docs/ScheduledTows.md).
const envMinutes = (value, fallback) => {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : fallback;
};

export const SCHEDULE_MIN_LEAD_MS = envMinutes(process.env.EXPO_PUBLIC_SCHEDULE_MIN_LEAD_MIN, 60) * 60 * 1000;
export const SCHEDULE_MAX_DAYS = 7;
export const MINUTE_STEP = envMinutes(process.env.EXPO_PUBLIC_SCHEDULE_MINUTE_STEP, 15);
// The API dispatches a booking this long before its time.
export const SCHEDULE_DISPATCH_LEAD_MIN = envMinutes(process.env.EXPO_PUBLIC_SCHEDULE_DISPATCH_LEAD_MIN, 45);
// Longest a dispatched booking can wait for a driver: the lead plus the API's
// 10-minute grace after the booked time.
export const SCHEDULED_SEARCH_MAX_S = (SCHEDULE_DISPATCH_LEAD_MIN + 10) * 60;

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Earliest bookable moment, rounded up to the next slot. Rounds from the exact
// time, seconds included: 15:45:30 + 1h must give 17:00, not 16:45.
export const earliestSlot = (now = new Date()) => {
  const stepMs = MINUTE_STEP * 60 * 1000;
  const t = new Date(now.getTime() + SCHEDULE_MIN_LEAD_MS);
  const sinceHour = t.getTime() - new Date(t).setMinutes(0, 0, 0);
  return new Date(t.getTime() - sinceHour + Math.ceil(sinceHour / stepMs) * stepMs);
};

// Days offered in the picker, starting from the day of the earliest slot.
export const scheduleDays = (now = new Date()) => {
  const first = startOfDay(earliestSlot(now));
  const today = startOfDay(now).getTime();
  return Array.from({ length: SCHEDULE_MAX_DAYS }, (_, i) => {
    const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    const offset = Math.round((day.getTime() - today) / 86400000);
    const label = offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : `${WEEKDAYS[day.getDay()]} ${day.getDate()}`;
    return { date: day, label };
  });
};

export const isBookable = (date, now = new Date()) =>
  date.getTime() >= now.getTime() + SCHEDULE_MIN_LEAD_MS &&
  date.getTime() <= now.getTime() + SCHEDULE_MAX_DAYS * 86400000;

// "amanhã às 09:00", "sex 19 às 14:30"
export const formatScheduledFor = (value, now = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
  const day = offset === 0 ? 'hoje' : offset === 1 ? 'amanhã' : `${WEEKDAYS[date.getDay()].toLowerCase()} ${date.getDate()}`;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${day} às ${time}`;
};

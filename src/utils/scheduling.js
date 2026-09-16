// Booking a tow for later. Mirrors the API window in ScheduledServiceService.
export const SCHEDULE_MIN_LEAD_MS = 60 * 60 * 1000;
export const SCHEDULE_MAX_DAYS = 7;
export const MINUTE_STEP = 15;

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Earliest bookable moment, rounded up to the next 15-minute slot.
export const earliestSlot = (now = new Date()) => {
  const t = new Date(now.getTime() + SCHEDULE_MIN_LEAD_MS);
  const minutes = Math.ceil(t.getMinutes() / MINUTE_STEP) * MINUTE_STEP;
  t.setMinutes(minutes, 0, 0);
  return t;
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
  date.getTime() >= now.getTime() + SCHEDULE_MIN_LEAD_MS - 60 * 1000 &&
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

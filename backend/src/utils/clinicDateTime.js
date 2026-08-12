const CLINIC_TIMEZONE = 'Europe/Rome';

function getFormatter() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function getParts(date) {
  const parts = getFormatter().formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function getOffsetMinutes(utcDate) {
  const parts = getParts(utcDate);
  const clinicTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return Math.round((clinicTime - utcDate.getTime()) / 60000);
}

export function getIsoWeekday(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const jsWeekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();

  return jsWeekday === 0 ? 7 : jsWeekday;
}

export function getClinicDateParts(date) {
  const parts = getParts(date);

  return {
    date: `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    time: `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`,
    weekday: getIsoWeekday(
      `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
    )
  };
}

export function clinicDateTimeToUtc(dateString, timeString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
  const targetUtcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  const firstGuess = new Date(targetUtcMs);
  const firstOffset = getOffsetMinutes(firstGuess);
  const secondGuess = new Date(targetUtcMs - firstOffset * 60000);
  const secondOffset = getOffsetMinutes(secondGuess);

  return new Date(targetUtcMs - secondOffset * 60000);
}

export function getClinicNow() {
  const now = new Date();
  const parts = getParts(now);

  return {
    date: `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    time: `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`,
    dateTime: now
  };
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

export function formatTime(date) {
  const parts = getParts(date);

  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}`;
}

export function getClinicTimezone() {
  return CLINIC_TIMEZONE;
}

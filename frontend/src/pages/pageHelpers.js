import dayjs from 'dayjs';

export function getStatusValue(isActive) {
  if (isActive === true) {
    return 'ACTIVE';
  }

  if (isActive === false) {
    return 'INACTIVE';
  }

  return '-';
}

export function toBooleanFilter(value) {
  return value === 'all' ? undefined : value;
}

export function toDatePickerValue(value) {
  return value ? dayjs(value) : null;
}

export function toApiDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '';
}

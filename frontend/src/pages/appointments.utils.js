const APPOINTMENT_STATUS_LABELS = {
  SCHEDULED: 'Programmato',
  CONFIRMED: 'Confermato',
  COMPLETED: 'Completato',
  CANCELLED: 'Annullato',
  NO_SHOW: 'No show'
};

const BASE_TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['SCHEDULED'],
  NO_SHOW: ['SCHEDULED']
};

const DOCTOR_ALLOWED_STATUSES = ['CONFIRMED', 'COMPLETED', 'NO_SHOW'];

export function getAppointmentStatusLabel(status) {
  return APPOINTMENT_STATUS_LABELS[status] || status;
}

export function getAllowedAppointmentTransitions(status, role) {
  const transitions = BASE_TRANSITIONS[status] || [];

  if (role === 'DOCTOR') {
    return transitions.filter((item) => DOCTOR_ALLOWED_STATUSES.includes(item));
  }

  return transitions;
}

export function shouldConfirmAppointmentStatus(status) {
  return ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(status);
}

export function canEditAppointment(status) {
  return status !== 'COMPLETED';
}

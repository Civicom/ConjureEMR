import { AppointmentInformation } from '@/types/types';
import { Appointment, Patient } from 'fhir/r4';

export function getPatientNameFromAppointment(appointment: AppointmentInformation): string {
  const firstName = appointment.patient?.[0]?.name?.[0]?.given?.[0] || '-';
  const lastName = appointment.patient?.[0]?.name?.[0]?.family || '-';
  return `${firstName} ${lastName}`;
}

export function getAvatarName(appointment: AppointmentInformation): string {
  const firstName = appointment.patient?.[0]?.name?.[0]?.given?.[0] || '-';
  const lastName = appointment.patient?.[0]?.name?.[0]?.family || '-';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

export function getLocationFromAppointment(appointment: AppointmentInformation): string {
  return appointment.location?.[0]?.name || 'Unknown Location';
}

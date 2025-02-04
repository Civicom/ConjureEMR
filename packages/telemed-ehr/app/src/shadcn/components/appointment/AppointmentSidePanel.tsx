import { DateTime } from 'luxon';
import { FC, useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  getQuestionnaireResponseByLinkId,
  mapStatusToTelemed,
  ApptStatus,
  AppointmentMessaging,
  UCAppointmentInformation,
  QuestionnaireLinkIds,
  getStatusFromExtension,
} from 'ehr-utils';
import ChatModal from '../../../features/chat/ChatModal';
import { calculatePatientAge, formatISODateToLocaleDate } from '@/helpers/formatDateTime';
import useOttehrUser from '@/hooks/useOttehrUser';
import { getSelectors } from '../../../shared/store/getSelectors';
import EditPatientDialog from '../../../telemed/components/EditPatientDialog';
import { useGetAppointmentAccessibility } from '../../../telemed/hooks';
import { useAppointmentStore } from '@/state/appointment/appointment.store';
import { useGetTelemedAppointmentWithSMSModel } from '../../../telemed/state';
import { getPatientName, quickTexts } from '../../../telemed/utils';
// import { ERX } from './ERX';
import { PastVisits } from './PastVisits';
import { addSpacesAfterCommas } from '../../../helpers/formatString';
import { INTERPRETER_PHONE_NUMBER } from 'ehr-utils';
import { Appointment, Resource } from 'fhir/r4';
import AppointmentStatusSwitcher from '../../../components/AppointmentStatusSwitcher';
import { getTelemedAppointmentStatusChip } from '../../../telemed/utils/getTelemedAppointmentStatusChip';
import { getInPersonAppointmentStatusChip } from '../../../components/AppointmentTableRow';

import { PatientInfoCard } from '../PatientInfoCard';




import {
  Cake,
  Calendar,
  CalendarPlus2,
  Clock1,
  EllipsisVertical,
  File,
  Home,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Video,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton, } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';


enum Gender {
  'male' = 'Male',
  'female' = 'Female',
  'other' = 'Other',
  'unknown' = 'Unknown',
}

interface AppointmentSidePanelProps {
  appointmentType: 'telemedicine' | 'in-person';
}

const isInPersonStatusCancelable = (status: string | undefined): boolean => {
  if (!status) {
    return false;
  }
  return status === 'proposed' || status === 'pending' || status === 'booked' || status === 'arrived';
};

const isTelemedStatusCancelable = (status: ApptStatus): boolean => {
  return status !== ApptStatus.complete && status !== ApptStatus.cancelled && status !== ApptStatus.unsigned;
};

export const AppointmentSidePanel: FC<AppointmentSidePanelProps> = ({ appointmentType }) => {

  const { appointment, isAppointmentLoading, encounter, patient, location, isReadOnly, questionnaireResponse } = getSelectors(
    useAppointmentStore,
    ['appointment', 'isAppointmentLoading', 'patient', 'encounter', 'location', 'isReadOnly', 'questionnaireResponse'],
  );

  const user = useOttehrUser();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isERXOpen, setIsERXOpen] = useState(false);
  const [isERXLoading, setIsERXLoading] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);
  const [isInviteParticipantOpen, setIsInviteParticipantOpen] = useState(false);

  const reasonForVisit = getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.REASON_FOR_VISIT, questionnaireResponse)
    ?.answer?.[0].valueString;
  const preferredLanguage = getQuestionnaireResponseByLinkId(
    QuestionnaireLinkIds.PREFERRED_LANGUAGE,
    questionnaireResponse,
  )?.answer?.[0].valueString;
  const relayPhone = getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.RELAY_PHONE, questionnaireResponse)
    ?.answer?.[0].valueString;
  const number =
    getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.PATIENT_NUMBER, questionnaireResponse)?.answer?.[0]
      .valueString ||
    getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.GUARDIAN_NUMBER, questionnaireResponse)?.answer?.[0]
      .valueString;
  const knownAllergies = getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.ALLERGIES, questionnaireResponse)
    ?.answer[0].valueArray;
  const address1 = getQuestionnaireResponseByLinkId(QuestionnaireLinkIds.PATIENT_STREET_ADDRESS, questionnaireResponse)
    ?.answer?.[0].valueString;

  const handleERXLoadingStatusChange = useCallback<(status: boolean) => void>(
    (status) => setIsERXLoading(status),
    [setIsERXLoading],
  );

  const appointmentAccessibility = useGetAppointmentAccessibility(appointmentType);

  let isCancellableStatus =
    appointmentType === 'telemedicine'
      ? isTelemedStatusCancelable(appointmentAccessibility.status as ApptStatus)
      : isInPersonStatusCancelable(appointmentAccessibility.status as string);

  const [isPractitionerAllowedToCancelThisVisit, setIsPractitionerAllowedToCancelThisVisit] = useState<boolean>(
    // appointmentAccessibility.isPractitionerLicensedInState &&
    // appointmentAccessibility.isEncounterAssignedToCurrentPractitioner &&
    isCancellableStatus || false,
  );

  const onStatusChange = (status: string): void => {
    isCancellableStatus = isInPersonStatusCancelable(status);
    setIsPractitionerAllowedToCancelThisVisit(isCancellableStatus);
  };

  useEffect(() => {
    setIsPractitionerAllowedToCancelThisVisit(isCancellableStatus);
  }, [isCancellableStatus]);

  const { data: appointmentMessaging, isFetching } = useGetTelemedAppointmentWithSMSModel(
    {
      appointmentId: appointment?.id,
      patientId: patient?.id,
    },
    (data) => {
      setHasUnread(data.smsModel?.hasUnreadMessages || false);
    },
  );

  const [hasUnread, setHasUnread] = useState<boolean>(appointmentMessaging?.smsModel?.hasUnreadMessages || false);

  if (!patient) {
    return null;
  }

  const weight = patient.extension?.find(
    (extension) => extension.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/weight',
  )?.valueString;
  const weightLastUpdated = patient.extension?.find(
    (extension) => extension.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/weight-last-updated',
  )?.valueString;

  const weightString =
    weight &&
    weightLastUpdated &&
    `${Math.round(+weight * 0.45359237 * 100) / 100} kg (updated ${DateTime.fromFormat(
      weightLastUpdated,
      'yyyy-MM-dd',
    ).toFormat('MM/dd/yyyy')})`;

  function isSpanish(language: string): boolean {
    return language.toLowerCase() === 'Spanish'.toLowerCase();
  }

  const delimeterString = preferredLanguage && isSpanish(preferredLanguage) ? `\u00A0|\u00A0` : '';
  const interpreterString =
    preferredLanguage && isSpanish(preferredLanguage) ? `Interpreter: ${INTERPRETER_PHONE_NUMBER}` : '';


  // MC Code Here

  //const [loading, setLoading] = useState<boolean>(false);

  const patientName = getPatientName(patient.name).lastFirstName;

  const address = patient?.address?.[0];
  const addressStr = address
    ? `${address.line?.[0] || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`
    : '-';

  return (
    <div id="appointment-side-panel" className="m-8">
        <PatientInfoCard patient={patient} loading={isAppointmentLoading} lastAppointment={''} />

        {isEditDialogOpen && (
            <EditPatientDialog modalOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
        )}
    </div>
  );
};

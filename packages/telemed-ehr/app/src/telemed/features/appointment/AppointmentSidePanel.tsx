import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ChatOutlineIcon from '@mui/icons-material/ChatOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Link,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
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
import { calculatePatientAge, formatISODateToLocaleDate } from '../../../helpers/formatDateTime';
import useOttehrUser from '../../../hooks/useOttehrUser';
import { getSelectors } from '../../../shared/store/getSelectors';
import CancelVisitDialog from '../../components/CancelVisitDialog';
import EditPatientDialog from '../../components/EditPatientDialog';
import InviteParticipant from '../../components/InviteParticipant';
import { useGetAppointmentAccessibility } from '../../hooks';
import { useAppointmentStore, useGetTelemedAppointmentWithSMSModel } from '../../state';
import { getPatientName, quickTexts } from '../../utils';
// import { ERX } from './ERX';
import { PastVisits } from './PastVisits';
import { addSpacesAfterCommas } from '../../../helpers/formatString';
import { INTERPRETER_PHONE_NUMBER } from 'ehr-utils';
import { Appointment, Resource } from 'fhir/r4';
import AppointmentStatusSwitcher from '../../../components/AppointmentStatusSwitcher';
import { getTelemedAppointmentStatusChip } from '../../utils/getTelemedAppointmentStatusChip';
import { getInPersonAppointmentStatusChip } from '../../../components/AppointmentTableRow';




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
  const theme = useTheme();

  const { appointment, encounter, patient, location, isReadOnly, questionnaireResponse } = getSelectors(
    useAppointmentStore,
    ['appointment', 'patient', 'encounter', 'location', 'isReadOnly', 'questionnaireResponse'],
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


  const patientInfoFields = [
    {
      label: 'Name',
      icon: UserRound,
      value: getPatientName(patient.name).lastFirstName,
    },
    {
      label: 'DOB',
      icon: Cake,
      value: DateTime.fromFormat(patient.birthDate!, 'yyyy-MM-dd').toFormat('MM/dd/yyyy'),
    },
    {
      label: 'Age',
      icon: Clock1,
      value: calculatePatientAge(patient.birthDate!),
    },
    {
    label: 'Visits',
      icon: Calendar,
      value: <PastVisits />,
    },
  ];

  const contactInfoFields = [
    {
      label: 'Phone',
      icon: Phone,
      value: patient?.telecom?.find((t) => t.system === 'phone')?.value || 'N/A',
    },
    {
      label: 'Email',
      icon: Mail,
      value: patient?.telecom?.find((t) => t.system === 'email')?.value || 'N/A',
    },
    {
      label: 'Address',
      icon: Home,
      value: addressStr,
    },
  ];

  const sections = [
    { title: 'Patient Information', fields: patientInfoFields },
    { title: 'Contact Information', fields: contactInfoFields },
  ];

  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: '350px',
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: '350px', boxSizing: 'border-box' },
      }}
    >
      <Toolbar />

      <Card className="pb-2 xs:w-full lg:w-auto">
        <CardHeader className="flex items-center justify-center">
          {false ? (
            <Skeleton className="bg-gray-200 w-16 h-16 rounded-full mb-2" />
          ) : (
            <Avatar className="w-16 h-16 mb-2">
              <AvatarImage src={`https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`} />
              <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
            </Avatar>
          )}
          {false ? (
            <Skeleton className="bg-gray-200 flex w-48 h-8" />
          ) : (
            <CardTitle className="flex items-center gap-2">
              {patientName}
              {patient?.active ? (
                <Badge className="bg-teal-500 text-white hover:bg-teal-500">Active</Badge>
              ) : (
                <Badge className="bg-red-500 text-white hover:bg-red-500">Inactive</Badge>
              )}
            </CardTitle>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {sections.map((section) => (
              <div className="flex flex-col gap-2 border-t pt-4">
                {false && section.title ? (
                  <Skeleton className="bg-gray-200 w-48 h-8" />
                ) : section.title ? (
                  <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold py-1">{section.title}</h1>
                    {section.title === 'Patient Information' && !isReadOnly && (                
                      <Button variant="outline" size="icon" className="border border-blue-500">
                        <Pencil className="text-blue-500" />
                      </Button>
                    )}
                  </div>
                ) : (
                  ''
                )}
                {section.fields.map((field) =>
                  false ? (
                    <div className="flex justify-between items-center gap-2">
                      <Skeleton
                        className="bg-gray-200 flex h-5"
                        style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
                      />
                      <Skeleton
                        className="bg-gray-200 flex h-5"
                        style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
                      />
                    </div>
                  ) : (
                    <CardDescription className="flex justify-between items-center cursor-pointers group/item rounded-md">
                      <div className="flex items-center gap-2 ">
                        <field.icon className="w-4 h-4" /> {field.label}
                      </div>
                      <div className="text-gray-700 font-bold text-right group-hover/item:sbg-gray-100 p-1 rounded-md">
                        {field.value}
                      </div>
                    </CardDescription>
                  ),
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Old Code*/}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3, overflow: 'auto', display: 'none' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {appointmentType === 'telemedicine' &&
              getTelemedAppointmentStatusChip(mapStatusToTelemed(encounter.status, appointment?.status))}

            {appointment?.id && (
              <Tooltip title={appointment.id}>
                <Typography
                  sx={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  variant="body2"
                >
                  VID: {appointment.id}
                </Typography>
              </Tooltip>
            )}
          </Box>

          {appointmentType === 'in-person' && appointmentAccessibility.isStatusEditable && (
            <AppointmentStatusSwitcher
              appointment={appointment as Appointment}
              encounter={encounter}
              onStatusChange={onStatusChange}
            />
          )}
          {appointmentType === 'in-person' &&
            !appointmentAccessibility.isStatusEditable &&
            !!appointment &&
            getInPersonAppointmentStatusChip(getStatusFromExtension(appointment as Appointment) as ApptStatus)}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" color="primary.dark">
              {getPatientName(patient.name).lastFirstName}
            </Typography>

            {!isReadOnly && (
              <IconButton onClick={() => setIsEditDialogOpen(true)}>
                <EditOutlinedIcon sx={{ color: theme.palette.primary.main }} />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          

          <Tooltip title={patient.id}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Typography variant="body2">PID:</Typography>
              <Link
                component={RouterLink}
                to={`/patient/${patient.id}`}
                target="_blank"
                sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  display: 'inline',
                  color: 'inherit',
                }}
                variant="body2"
              >
                {patient.id}
              </Link>
            </Box>
          </Tooltip>

          <Typography variant="body2"><b>Name:</b> {getPatientName(patient.name).lastFirstName}</Typography>

          <PastVisits />

          <Typography variant="body2">{Gender[patient.gender!]}</Typography>

          <Typography variant="body2">
            DOB: {DateTime.fromFormat(patient.birthDate!, 'yyyy-MM-dd').toFormat('MM/dd/yyyy')}, Age:{' '}
            {calculatePatientAge(patient.birthDate!)}
          </Typography>

          {weightString && <Typography variant="body2">Wt: {weightString}</Typography>}

          {knownAllergies && (
            <Typography variant="body2" fontWeight={700}>
              Allergies: {knownAllergies.map((answer: any) => answer['allergies-form-agent-substance']).join(', ')}
            </Typography>
          )}

          {/* <Typography variant="body2">Location: {location.address?.state}</Typography> */}

          <Typography variant="body2">Address: {addressStr}</Typography>

          <Typography variant="body2">{reasonForVisit && addSpacesAfterCommas(reasonForVisit)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <LoadingButton
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 10,
              minWidth: 'auto',
              '& .MuiButton-startIcon': {
                m: 0,
              },
            }}
            startIcon={
              hasUnread ? (
                <Badge
                  variant="dot"
                  color="warning"
                  sx={{
                    '& .MuiBadge-badge': {
                      width: '14px',
                      height: '14px',
                      borderRadius: '10px',
                      border: '2px solid white',
                      top: '-4px',
                      right: '-4px',
                    },
                  }}
                >
                  <ChatOutlineIcon />
                </Badge>
              ) : (
                <ChatOutlineIcon />
              )
            }
            onClick={() => setChatModalOpen(true)}
            loading={isFetching && !appointmentMessaging}
          />

          <Button
            size="small"
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: 10,
            }}
            startIcon={<DateRangeOutlinedIcon />}
            onClick={() => window.open('/visits/add', '_blank')}
          >
            Book visit
          </Button>

          {/* {user?.isPractitionerEnrolledInPhoton && (
            <LoadingButton
              size="small"
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: 10,
              }}
              startIcon={<MedicationOutlinedIcon />}
              onClick={() => setIsERXOpen(true)}
              loading={isERXLoading}
              disabled={appointmentAccessibility.isAppointmentReadOnly}
            >
              RX
            </LoadingButton>
          )} */}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box>
            <Typography variant="subtitle2" color="primary.dark">
              Preferred Language
            </Typography>
            <Typography variant="body2">
              {preferredLanguage} {delimeterString} {interpreterString}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="primary.dark">
              Hearing Impaired Relay Service? (711)
            </Typography>
            <Typography variant="body2">{relayPhone}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="primary.dark">
              Patient number
            </Typography>
            <Link sx={{ color: 'inherit' }} component={RouterLink} to={`tel:${number}`} variant="body2">
              {number}
            </Link>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'start' }}>
          {appointmentType === 'telemedicine' &&
            appointmentAccessibility.status &&
            [ApptStatus['pre-video'], ApptStatus['on-video']].includes(
              appointmentAccessibility.status as ApptStatus,
            ) && (
              <Button
                size="small"
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: 10,
                }}
                startIcon={<PersonAddAltOutlinedIcon />}
                onClick={() => setIsInviteParticipantOpen(true)}
              >
                Invite participant
              </Button>
            )}
          {isPractitionerAllowedToCancelThisVisit && (
            <Button
              size="small"
              color="error"
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: 10,
              }}
              startIcon={<CancelOutlinedIcon />}
              onClick={() => setIsCancelDialogOpen(true)}
            >
              Cancel this visit
            </Button>
          )}
        </Box>

        {isCancelDialogOpen && (
          <CancelVisitDialog onClose={() => setIsCancelDialogOpen(false)} appointmentType={appointmentType} />
        )}
        {/* {isERXOpen && <ERX onClose={() => setIsERXOpen(false)} onLoadingStatusChange={handleERXLoadingStatusChange} />} */}
        {isEditDialogOpen && (
          <EditPatientDialog modalOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
        )}
        {chatModalOpen && appointmentMessaging && (
          <ChatModal
            appointment={appointmentMessaging}
            onClose={() => setChatModalOpen(false)}
            onMarkAllRead={() => setHasUnread(false)}
            patient={patient}
            quickTexts={quickTexts}
          />
        )}
        {isInviteParticipantOpen && (
          <InviteParticipant modalOpen={isInviteParticipantOpen} onClose={() => setIsInviteParticipantOpen(false)} />
        )}
      </Box>
      <Toolbar />
    </Drawer>
  );
};

import { FC, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppointmentHeader } from '@/shadcn/components/appointment/AppointmentHeader';
import { AppointmentTabs } from '@/shadcn/components/appointment/AppointmentTabs';
import { AppointmentSidePanel } from '@/shadcn/components/appointment/AppointmentSidePanel';
import { PATIENT_PHOTO_CODE, getQuestionnaireResponseByLinkId } from 'ehr-utils';
import { useAppointmentStore } from '../state/appointment/appointment.store';
import { useGetAppointmentInformation } from '../state/appointment/appointment.queries';
import { getSelectors } from '@/shared/store/getSelectors';
import {
  useExamObservationsStore,
  EXAM_OBSERVATIONS_INITIAL,
  useIsReadOnly,
} from '../telemed';
import { useExamCardsStore, EXAM_CARDS_INITIAL } from '../telemed/state/appointment/exam-cards.store';
import {
  FhirResource,
  Location,
  QuestionnaireResponse,
  Appointment,
  Patient,
  Encounter,
  DocumentReference,
} from 'fhir/r4';

export const AppointmentPage: FC = () => {
  const { id } = useParams();
  // TODO: Review and modify setter for read only mode
  //useIsReadOnly();

  const navigate = useNavigate();

  const { patient } = getSelectors(useAppointmentStore, ['patient']);

  const { isFetching } = useGetAppointmentInformation(
    {
      appointmentId: id,
    },
    (data) => {
      const questionnaireResponse = data?.find(
        (resource: FhirResource) => resource.resourceType === 'QuestionnaireResponse',
      ) as unknown as QuestionnaireResponse;

      useAppointmentStore.setState({
        appointment: data?.find(
          (resource: FhirResource) => resource.resourceType === 'Appointment',
        ) as unknown as Appointment,
        patient: data?.find((resource: FhirResource) => resource.resourceType === 'Patient') as unknown as Patient,
        location: data?.find((resource: FhirResource) => resource.resourceType === 'Location') as unknown as Location,
        encounter: data?.find(
          (resource: FhirResource) => resource.resourceType === 'Encounter',
        ) as unknown as Encounter,
        questionnaireResponse,
        patientPhotoUrls:
          (data
            ?.filter(
              (resource: FhirResource) =>
                resource.resourceType === 'DocumentReference' &&
                resource.status === 'current' &&
                resource.type?.coding?.[0].code === PATIENT_PHOTO_CODE,
            )
            .flatMap((docRef: FhirResource) => (docRef as DocumentReference).content.map((cnt) => cnt.attachment.url))
            .filter(Boolean) as string[]) || [],
      });
    },
  );

  useEffect(() => {
    useAppointmentStore.setState({
      appointment: undefined,
      patient: undefined,
      location: undefined,
      encounter: {} as Encounter,
      questionnaireResponse: undefined,
      patientPhotoUrls: [],
      chartData: undefined,
      currentTab: 'notes',
      isAppointmentLoading: false,
    });
    useExamObservationsStore.setState(EXAM_OBSERVATIONS_INITIAL);
    useExamCardsStore.setState(EXAM_CARDS_INITIAL);
  }, []);

  useEffect(() => {
    useAppointmentStore.setState({ isAppointmentLoading: isFetching });
  }, [isFetching]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-1 w-full">
        <AppointmentSidePanel appointmentType="in-person" />

        <div className="w-full py-3">          
          <AppointmentHeader onClose={() => navigate(`/patient/${patient?.id}`)} />
          <AppointmentTabs />
        </div>
      </div>
    </div>
  );
};

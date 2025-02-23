import { useAuth0 } from '@auth0/auth0-react';
import { Bundle, FhirResource, Patient } from 'fhir/r4';
import { DateTime } from 'luxon';
import { useMutation, useQuery } from 'react-query';
import {
  ChartDataFields,
  createSmsModel,
  filterResources,
  InstructionType,
  MeetingData,
  relatedPersonAndCommunicationMaps,
  SaveChartDataRequest,
  SchoolWorkNoteExcuseDocFileDTO,
  TelemedAppointmentInformation,
} from 'ehr-utils';
import { useApiClients } from '@/hooks/useAppClients';
import { useAppointmentStore } from './appointment.store';
import useOttehrUser from '@/hooks/useOttehrUser';
import { getSelectors } from '@/shared/store/getSelectors';
import { CHAT_REFETCH_INTERVAL } from '@/constants';
import { useAuthToken } from '@/hooks/useAuthToken';

// TODO: Move these outside the telemed folder, since goal is to remove the telemed folder
import { PromiseReturnType, ZapEHRTelemedAPIClient } from '@/telemed/data';
import { useZapEHRAPIClient } from '@/telemed/hooks/useZapEHRAPIClient';
import { extractPhotoUrlsFromAppointmentData } from '@/telemed/utils';

export type RefreshableAppointmentData = {
  patientConditionPhotoUrs: string[];
};

const createRefreshableAppointmentData = (originalData: Bundle<FhirResource>[]): RefreshableAppointmentData => {
  const photoUrls = extractPhotoUrlsFromAppointmentData(originalData);
  return {
    patientConditionPhotoUrs: photoUrls,
  };
};

const APPOINTMENT_REFRESH_INTERVAL = 15000;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useRefreshableAppointmentData = (
  {
    appointmentId,
  }: {
    appointmentId: string | undefined;
  },
  onSuccess: (data: RefreshableAppointmentData) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return useGetTelemedAppointmentPeriodicRefresh(
    {
      appointmentId: appointmentId,
      refreshIntervalMs: APPOINTMENT_REFRESH_INTERVAL,
    },
    (originalData) => {
      const refreshedData = createRefreshableAppointmentData(originalData);
      onSuccess(refreshedData);
    },
  );
};

export const useGetTelemedAppointmentWithSMSModel = (
  {
    appointmentId,
    patientId,
  }: {
    appointmentId: string | undefined;
    patientId: string | undefined;
  },
  onSuccess: (data: TelemedAppointmentInformation) => void,
): { data: TelemedAppointmentInformation | undefined; isFetching: boolean } => {
  const { fhirClient } = useApiClients();

  return useQuery(
    ['telemed-appointment-messaging', { appointmentId }],
    async () => {
      if (fhirClient && appointmentId) {
        const appointmentResources = await fhirClient.searchResources<Bundle>({
          resourceType: 'Appointment',
          searchParams: [
            { name: '_id', value: appointmentId },
            {
              name: '_include',
              value: 'Appointment:patient',
            },
            {
              name: '_revinclude:iterate',
              value: 'RelatedPerson:patient',
            },
          ],
        });

        const appointment = filterResources(appointmentResources, 'Appointment')[0];

        const allRelatedPersonMaps = await relatedPersonAndCommunicationMaps(fhirClient, appointmentResources);

        const smsModel = createSmsModel(patientId!, allRelatedPersonMaps);

        return { ...appointment, smsModel };
      }
      throw new Error('fhir client is not defined or appointmentId and patientId are not provided');
    },
    {
      refetchInterval: CHAT_REFETCH_INTERVAL,
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching appointment or creating SMS model: ', err);
      },
      enabled: !!fhirClient && !!appointmentId,
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useGetTelemedAppointmentPeriodicRefresh = (
  {
    appointmentId,
    refreshIntervalMs,
  }: {
    appointmentId: string | undefined;
    refreshIntervalMs: number | undefined;
  },
  onSuccess: (data: Bundle<FhirResource>[]) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const { fhirClient } = useApiClients();
  const refetchOptions = refreshIntervalMs ? { refetchInterval: refreshIntervalMs } : {};
  return useQuery(
    ['telemed-appointment-periodic-refresh', { appointmentId }],
    () => {
      if (fhirClient && appointmentId) {
        return fhirClient.searchResources<Bundle>({
          resourceType: 'Appointment',
          searchParams: [
            { name: '_id', value: appointmentId },
            { name: '_revinclude', value: 'DocumentReference:related' },
          ],
        });
      }
      throw new Error('fhir client not defined or appointmentId not provided');
    },
    {
      ...refetchOptions,
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get telemed appointment periodic: ', err);
      },
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useGetTelemedAppointment = (
  {
    appointmentId,
  }: {
    appointmentId: string | undefined;
  },
  onSuccess: (data: Bundle<FhirResource>[]) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const { fhirClient } = useApiClients();
  return useQuery(
    ['telemed-appointment', { appointmentId }],
    () => {
      if (fhirClient && appointmentId) {
        return fhirClient.searchResources<Bundle>({
          resourceType: 'Appointment',
          searchParams: [
            { name: '_id', value: appointmentId },
            {
              name: '_include',
              value: 'Appointment:patient',
            },
            {
              name: '_include',
              value: 'Appointment:location',
            },
            {
              name: '_revinclude:iterate',
              value: 'Encounter:appointment',
            },
            {
              name: '_revinclude:iterate',
              value: 'QuestionnaireResponse:encounter',
            },
            { name: '_revinclude', value: 'DocumentReference:related' },
          ],
        });
      }
      throw new Error('fhir client not defined or appointmentId not provided');
    },
    {
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get telemed appointment: ', err);
      },
    },
  );
};

export const useGetAppointmentInformation = (
  {
    appointmentId,
  }: {
    appointmentId: string | undefined;
  },
  onSuccess: (data: Bundle<FhirResource>[]) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const { fhirClient } = useApiClients();
  return useQuery(
    ['telemed-appointment', { appointmentId }],
    () => {
      if (fhirClient && appointmentId) {
        return fhirClient.searchResources<Bundle>({
          resourceType: 'Appointment',
          searchParams: [
            { name: '_id', value: appointmentId },
            {
              name: '_include',
              value: 'Appointment:patient',
            },
            {
              name: '_include',
              value: 'Appointment:location',
            },
            {
              name: '_revinclude:iterate',
              value: 'Encounter:appointment',
            },
            {
              name: '_revinclude:iterate',
              value: 'QuestionnaireResponse:encounter',
            },
            { name: '_revinclude', value: 'DocumentReference:related' },
          ],
        });
      }
      throw new Error('fhir client not defined or appointmentId not provided');
    },
    {
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get telemed appointment: ', err);
      },
    },
  );
};

export const useGetQuestionnaireDetails = (
  {
    questionnaireName,
  }: {
    questionnaireName: string | undefined;
  },
  onSuccess: (data: Bundle<FhirResource>[]) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const { fhirClient } = useApiClients();
  return useQuery(
    ['telemed-questionnaire', { questionnaireName }],
    () => {
      if (fhirClient && questionnaireName) {
        const questionnaireId = questionnaireName.split('/').pop();
        if (questionnaireId) {
          return fhirClient.searchResources<Bundle>({
            resourceType: 'Questionnaire',
            searchParams: [{ name: '_id', value: questionnaireId }],
          });
        }
        throw new Error('questionnaireName not valid');
      }
      throw new Error('fhir client not defined or questionnaireName not provided');
    },
    {
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get telemed appointment: ', err);
      },
      enabled: !!questionnaireName,
    },
  );
};

export const useGetMeetingData = (
  getAccessTokenSilently: () => Promise<string>,
  onSuccess: (data: MeetingData) => void,
  onError: (error: Error) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return useQuery(
    ['meeting-data'],
    async () => {
      const appointment = useAppointmentStore.getState();
      const token = await getAccessTokenSilently();

      if (appointment.encounter.id && token) {
        const videoTokenResp = await fetch(
          `${import.meta.env.VITE_APP_PROJECT_API_URL}/telemed/v2/meeting/${appointment.encounter.id}/join`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            method: 'GET',
          },
        );
        const data = await videoTokenResp.json();
        if (!videoTokenResp.ok) {
          throw new Error('Error trying to get meeting data for appointment: ' + JSON.stringify(data));
        }
        return data as MeetingData;
      }

      throw new Error('token or encounterId not provided');
    },
    {
      enabled: false,
      onSuccess,
      onError,
    },
  );
};

export const useGetChartData = (
  { apiClient, encounterId }: { apiClient: ZapEHRTelemedAPIClient | null; encounterId?: string },
  onSuccess: (data: PromiseReturnType<ReturnType<ZapEHRTelemedAPIClient['getChartData']>>) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const user = useOttehrUser();
  const { isReadOnly, isAppointmentLoading } = getSelectors(useAppointmentStore, [
    'isReadOnly',
    'isAppointmentLoading',
  ]);

  return useQuery(
    ['telemed-get-chart-data', { apiClient, encounterId, user, isReadOnly, isAppointmentLoading }],
    () => {
      if (apiClient && encounterId) {
        return apiClient.getChartData({
          encounterId,
        });
      }
      throw new Error('api client not defined or encounterId not provided');
    },
    {
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get telemed appointments: ', err);
      },
      enabled: !!apiClient && !!encounterId && !!user && !isAppointmentLoading,
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useSaveChartData = () => {
  const apiClient = useZapEHRAPIClient();
  const { encounter, isReadOnly } = getSelectors(useAppointmentStore, ['encounter', 'isReadOnly']);

  return useMutation({
    mutationFn: (chartDataFields: Omit<SaveChartDataRequest, 'encounterId'>) => {
      if (isReadOnly) {
        throw new Error('update disabled in read only mode');
      }

      if (apiClient && encounter.id) {
        return apiClient.saveChartData({
          encounterId: encounter.id,
          ...chartDataFields,
        });
      }
      throw new Error('api client not defined or encounterId not provided');
    },
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeleteChartData = () => {
  const apiClient = useZapEHRAPIClient();
  const { encounter } = useAppointmentStore.getState();

  return useMutation({
    mutationFn: (chartDataFields: ChartDataFields & { schoolWorkNotes?: SchoolWorkNoteExcuseDocFileDTO[] }) => {
      if (apiClient && encounter.id) {
        return apiClient.deleteChartData({
          encounterId: encounter.id,
          ...chartDataFields,
        });
      }
      throw new Error('api client not defined or encounterId not provided');
    },
  });
};

export type MedicationSearchResponse = {
  medications: {
    brandName: string;
    codes: {
      HCPCS: string;
      SKU: string;
      packageNDC: string;
      productNDC: string;
      rxcui: string;
    };
    concept: 'DRUG' | 'NON-DRUG';
    controlled: boolean;
    description: string;
    form: string;
    genericName: string;
    id: string;
    manufacturer: string;
    name: string;
    strength: string;
    type: string;
  }[];
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useGetMedicationsSearch = (medicationSearchTerm: string) => {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery(
    ['medications-search', { medicationSearchTerm }],
    async () => {
      const token = await getAccessTokenSilently();
      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const resp = await fetch(
        `${import.meta.env.VITE_APP_PROJECT_API_URL}/erx/medication/search?first=10&name=${medicationSearchTerm}`,
        {
          method: 'GET',
          headers: headers,
        },
      );
      return resp.json() as Promise<MedicationSearchResponse>;
    },
    {
      onError: (err) => {
        console.error('Error during fetching medications: ', err);
      },
      enabled: Boolean(medicationSearchTerm),
    },
  );
};

export type AllergiesSearchResponse = {
  allergens: {
    id: string;
    name: string;
    rxcui: string;
  }[];
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useGetAllergiesSearch = (allergiesSearchTerm: string) => {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery(
    ['allergies-search', { allergiesSearchTerm }],
    async () => {
      const token = await getAccessTokenSilently();
      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const resp = await fetch(
        `${import.meta.env.VITE_APP_PROJECT_API_URL}/erx/allergy/search?first=10&name=${allergiesSearchTerm}`,
        {
          method: 'GET',
          headers: headers,
        },
      );
      return resp.json() as Promise<AllergiesSearchResponse>;
    },
    {
      onError: (err) => {
        console.error('Error during fetching allergies: ', err);
      },
      enabled: Boolean(allergiesSearchTerm),
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useGetIcd10Search = (searchTerm: string) => {
  const apiClient = useZapEHRAPIClient();

  return useQuery(
    ['icd-search', { searchTerm }],
    async () => {
      return apiClient?.icdSearch({ search: searchTerm });
    },
    {
      onError: (err) => {
        console.error('Error during fetching icd-10 codes: ', err);
      },
      enabled: Boolean(apiClient && searchTerm),
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useUpdatePaperwork = () => {
  const { zambdaIntakeClient } = useApiClients();

  return useMutation({
    mutationFn: async ({
      appointmentID,
      paperwork = {},
    }: {
      appointmentID: string;
      paperwork: Record<string, string>;
    }) => {
      const UPDATE_PAPERWORK_ZAMBDA_ID = import.meta.env.VITE_APP_UPDATE_PAPERWORK_ZAMBDA_ID;

      if (!zambdaIntakeClient) {
        throw new Error('api client not defined');
      }
      if (!UPDATE_PAPERWORK_ZAMBDA_ID) {
        throw new Error('update paperwork zambda id not defined');
      }

      const response = await zambdaIntakeClient.invokePublicZambda({
        zambdaId: UPDATE_PAPERWORK_ZAMBDA_ID,
        payload: {
          appointmentID,
          paperwork,
          timezone: DateTime.now().zoneName,
        },
      });
      return import.meta.env.VITE_APP_IS_LOCAL === 'true' ? response : response.output;
    },
  });
};

export const useGetPatientInstructions = (
  { type }: { type: InstructionType },
  onSuccess?: (data: PromiseReturnType<ReturnType<ZapEHRTelemedAPIClient['getPatientInstructions']>>) => void,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const apiClient = useZapEHRAPIClient();

  return useQuery(
    ['telemed-get-patient-instructions', { apiClient, type }],
    () => {
      if (apiClient) {
        return apiClient.getPatientInstructions({
          type,
        });
      }
      throw new Error('api client not defined');
    },
    {
      onSuccess,
      onError: (err) => {
        console.error('Error during fetching get patient instructions: ', err);
      },
      enabled: !!apiClient,
    },
  );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useSavePatientInstruction = () => {
  const apiClient = useZapEHRAPIClient();

  return useMutation({
    mutationFn: (instruction: { text: string }) => {
      if (apiClient) {
        return apiClient.savePatientInstruction(instruction);
      }
      throw new Error('api client not defined');
    },
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeletePatientInstruction = () => {
  const apiClient = useZapEHRAPIClient();

  return useMutation({
    mutationFn: (instruction: { id: string }) => {
      if (apiClient) {
        return apiClient.deletePatientInstruction(instruction);
      }
      throw new Error('api client not defined');
    },
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useSyncERXPatient = () => {
  const token = useAuthToken();

  return useMutation(
    ['sync-erx-patient'],
    async (patient: Patient) => {
      if (token) {
        console.log(`Start syncing eRx patient ${patient.id}`);
        const resp = await fetch(`${import.meta.env.VITE_APP_PROJECT_API_URL}/erx/sync-patient/${patient.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: 'POST',
        });
        if (!resp.ok) {
          throw { ...(await resp.json()), status: resp.status };
        }
        console.log('Successfuly synced eRx patient');
        return (await resp.json()) as { photonPatientId: string };
      }
      throw new Error('auth token is not defined');
    },
    {
      retry: 2,
    },
  );
};

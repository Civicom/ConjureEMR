import { useQuery } from 'react-query';
import { useApiClients } from '@/hooks/useAppClients';
import { Appointment, Bundle, Patient, Location } from 'fhir/r4';
import { FhirClient } from '@zapehr/sdk';

interface UseAppointmentsParams {
  pageSize?: number;
  currentPage?: number;
  filters?: {
    searchTerm?: string;
    status?: string;
    provider?: string;
    patient?: string;
    start?: string;
    end?: string;
  };
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Patient[];
  location?: Location[];
}

// Create a type for date filter combinations
type DateFilters = {
  start?: string;
  end?: string;
};

const buildDateSearchParams = (filters: DateFilters) => {
  const searchParams = [];

  // Helper to format end date with end-of-day timestamp
  const formatEndDate = (date: string) => `le${date.split('T')[0]}T23:59:59.000-05:00`;

  // Add date filters if they exist
  if (filters.start) {
    searchParams.push({ name: 'date', value: `ge${filters.start}` });
    console.log('start ge', filters.start);
  }

  if (filters.end) {
    searchParams.push({ name: 'date', value: formatEndDate(filters.end) });
  }

  console.group('searchParams');
  console.log(searchParams);
  console.log(filters.start);
  console.log(filters.end);
  console.groupEnd();

  // Always sort by date in descending order
  searchParams.push({ name: '_sort', value: 'date' });

  return searchParams;
};

export function useAppointments({ pageSize, currentPage = 1, filters = {} }: UseAppointmentsParams) {
  const { fhirClient } = useApiClients() as { fhirClient: FhirClient };

  const totalCountQuery = useQuery({
    queryKey: ['appointments-count', filters],
    queryFn: async () => {
      try {
        if (!fhirClient) return 0;

        const response = await fhirClient.searchResourcesReturnBundle<Bundle>({
          resourceType: 'Appointment',
          searchParams: [
            ...buildDateSearchParams({
              start: filters.start,
              end: filters.end,
            }),
            { name: '_total', value: 'accurate' },
            { name: '_count', value: '10' },
            // Add filter params here when implemented
          ],
        });

        console.log('bundle', response);

        return response.total || 0;
      } catch (error) {
        console.error('Error fetching appointment count:', error);
        throw error;
      }
    },
  });

  const appointmentsQuery = useQuery(['appointments', pageSize, currentPage, filters], async () => {
    try {
      if (!fhirClient) {
        return [];
      }

      const searchParams = [];

      // Add date filters
      searchParams.push(
        ...buildDateSearchParams({
          start: filters.start,
          end: filters.end,
        }),
      );

      // Handle pagination
      if (pageSize) {
        searchParams.push(
          { name: '_count', value: pageSize.toString() },
          { name: '_offset', value: ((currentPage - 1) * pageSize).toString() },
        );
      }

      // Handle other filters
      if (filters.status) {
        searchParams.push({ name: 'status', value: filters.status });
      }

      if (filters.provider) {
        searchParams.push({ name: 'practitioner', value: filters.provider });
      }

      if (filters.patient) {
        searchParams.push({ name: 'patient', value: filters.patient });
      }

      if (filters.searchTerm) {
        searchParams.push({ name: '_content', value: filters.searchTerm });
      }

      const response = await fhirClient.searchResources<Appointment>({
        resourceType: 'Appointment',
        searchParams,
      });

      return response;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  });

  // Fetch patient details for all appointments
  const patientIds = appointmentsQuery.data
    ?.map((apt) =>
      apt.participant
        ?.find((p) => p.actor?.reference?.startsWith('Patient/'))
        ?.actor?.reference?.replace('Patient/', ''),
    )
    .filter(Boolean) as string[];

  const patientsQuery = useQuery(['patients', patientIds], async () => {
    try {
      if (!fhirClient || !patientIds?.length) return [];
      return fhirClient.searchResources<Patient>({
        resourceType: 'Patient',
        searchParams: [{ name: '_id', value: patientIds.join(',') }],
      });
    } catch (error) {
      console.error('Error fetching patient details:', error);
      throw error;
    }
  });

  // Fetch location details for all appointments
  const locationIds = appointmentsQuery.data
    ?.map(
      (apt) =>
        apt.participant?.find((p) => p.actor?.reference?.startsWith('Location/'))?.actor?.reference?.split('/')[1],
    )
    .filter(Boolean) as string[];

  const locationsQuery = useQuery(['locations', locationIds], async () => {
    try {
      if (!fhirClient || !locationIds.length) return [];
      return fhirClient.searchResources<Location>({
        resourceType: 'Location',
        searchParams: [{ name: '_id', value: locationIds.join(',') }],
      });
    } catch (error) {
      console.error('Error fetching location details:', error);
      throw error;
    }
  });

  // Combine appointment data with patient and location details
  const appointmentsWithDetails: AppointmentWithDetails[] =
    appointmentsQuery.data?.map((apt) => ({
      ...apt,
      patient: patientsQuery.data?.filter((patient) =>
        apt.participant?.[0]?.actor?.reference?.includes(patient.id || ''),
      ),
      location: locationsQuery.data?.filter((location) =>
        apt.participant?.some((p) => p.actor?.reference?.includes(location.id || '')),
      ),
    })) || [];

  const data = {
    appointments: appointmentsWithDetails,
    isLoading: appointmentsQuery.isLoading || patientsQuery.isLoading || locationsQuery.isLoading,
    error: appointmentsQuery.error || patientsQuery.error || locationsQuery.error,
    totalEntries: totalCountQuery.data || 0,
    isCountLoading: totalCountQuery.isLoading,
    countError: totalCountQuery.error,
  };

  console.log('apt hook:', data);
  console.log('apt hook:', data.appointments[0]);

  return data;
}

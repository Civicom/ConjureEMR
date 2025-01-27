import { useQuery } from 'react-query';
import { useApiClients } from '@/hooks/useAppClients';
import { FhirClient } from '@zapehr/sdk';
import { Appointment, Bundle } from 'fhir/r4';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

const RQAppointmentsPage = () => {
  // const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const { fhirClient } = useApiClients() as { fhirClient: FhirClient };

  const totalCountQuery = useQuery({
    queryKey: ['appointments-count'],
    queryFn: async () => {
      if (!fhirClient) return 0;

      const response = await fhirClient.searchResourcesReturnBundle<Bundle>({
        resourceType: 'Appointment',
        searchParams: [
          { name: '_total', value: 'accurate' },
          { name: '_count', value: '0' },
        ],
      });

      console.log('Attempting to get estimate count:', response);
      return response.total || 0;
    },
  });

  console.log('Total Count is:', totalCountQuery.data);

  const {
    data: appointments,
    isLoading,
    error,
  } = useQuery(['appointments', currentPage], async () => {
    if (!fhirClient) {
      return [];
    }

    const response = await fhirClient.searchResources<Appointment>({
      resourceType: 'Appointment',
      searchParams: [
        { name: '_count', value: pageSize.toString() },
        { name: '_offset', value: ((currentPage - 1) * pageSize).toString() },
      ],
    });

    console.log('Response:', response);

    return response;
  });

  useEffect(() => {
    if (totalCountQuery.data) {
      setTotalEntries(totalCountQuery.data);
    }
  }, [totalCountQuery.data]);

  return (
    <div className="p-4 space-y-4">
      {/* Page Buttons */}
      <div className="flex gap-2 items-center">
        <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, Math.ceil(totalEntries / pageSize)) }, (_, i) => {
            const pageNum =
              currentPage <= 3
                ? i + 1
                : currentPage >= Math.ceil(totalEntries / pageSize) - 2
                  ? Math.ceil(totalEntries / pageSize) - (4 - i)
                  : currentPage - 2 + i;
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                size="icon"
                onClick={() => setCurrentPage(pageNum)}
                className="transition-none w-10 h-10 text-center"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === Math.ceil(totalEntries / pageSize)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.ceil(totalEntries / pageSize))}
          disabled={currentPage === Math.ceil(totalEntries / pageSize)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-500">Total Entries: {totalEntries}</span>
      </div>
      {isLoading ? (
        <SkeletonAppointmentCards pageSize={pageSize} />
      ) : (
        <div className="flex flex-col gap-4 ">
          {appointments &&
            appointments.map((appointment: Appointment, index: number) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                index={pageSize * (currentPage - 1) + index}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const AppointmentCard = ({ appointment, index }: { appointment: Appointment; index: number }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{index + 1}. Appointment Details</h3>
        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
          {appointment.status}
        </span>
      </div>
      <div className="space-y-2 text-gray-600">
        <div className="flex items-center">
          <span className="font-medium w-20">ID:</span>
          <span className="text-gray-500">{appointment.id}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-20">Start:</span>
          <span className="text-gray-500">{new Date(appointment.start || '').toLocaleString()}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-20">End:</span>
          <span className="text-gray-500">{new Date(appointment.end || '').toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const SkeletonAppointmentCards = ({ pageSize }: { pageSize: number }) => {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(pageSize)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow max-w-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse ml-2"></div>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse ml-2"></div>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse ml-2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RQAppointmentsPage;

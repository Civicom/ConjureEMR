import { useQuery, UseQueryResult } from 'react-query';
import { useApiClients } from '@/hooks/useAppClients';
import { FhirClient } from '@zapehr/sdk';
import { Appointment, Bundle, Patient } from 'fhir/r4';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronsLeft, ChevronsRight, Filter, Plus, Search } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { AppointmentModal } from './AppointmentModal';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from './DatePicker';
import { AppointmentCard3, TimelineAppointmentSkeleton } from '@/pages/AppointmentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import calendarImage from '@/assets/calendar.png';
import RQBigCalender from '@/shadcn/components/BigCalender';
import { TabSquare, TabSquareContent, TabSquareTrigger } from '@/components/ui/tabsquare';
import React from 'react';
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAppointments } from './hooks/useAppointments';
import { AppointmentListView } from '@/components/appointments/AppointmentListView';
import { DateTime } from 'luxon';
import { getAppointments } from '@/api/api';

interface AppointmentInfo extends Appointment {
  office: string;
  provider: string;
  patient: string;
}

const RQAppointmentsPage = () => {
  return (
    <div className="flex flex-col mx-auto my-12 max-w-7xl px-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-gray-500">View and manage your appointments here.</p>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="space-y-4 py-8">
          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <RQBigCalender />
            </TabsContent>
            <TabsContent value="logs">
              <LogsView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <ZambdaAppointments />
    </div>
  );
};

const LogsView = () => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    provider: '',
    patient: '',
    start: '',
    end: '',
  });

  const { appointments, isLoading, totalEntries } = useAppointments({
    pageSize,
    currentPage,
    filters,
  });

  return (
    <Card className="p-8">
      <CardHeader>
        <CardTitle>Appointments Log</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <div className="flex">
          <Tabs defaultValue="list" className="">
            <TabsList variant="square" className="bg-gray-300">
              <TabsTrigger variant="square" value="list">
                Prebooked
              </TabsTrigger>
              <TabsTrigger variant="square" value="in-office">
                In Office
              </TabsTrigger>
              <TabsTrigger variant="square" value="completed">
                Completed
              </TabsTrigger>
              <TabsTrigger variant="square" value="cancelled">
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div> */}
        <Pagination
          totalEntries={totalEntries}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
        />
        {isLoading ? (
          <TimelineAppointmentSkeleton pageSize={pageSize} />
        ) : (
          <div className="flex flex-col gap-4">
            {appointments &&
              appointments.map((appointment: Appointment, index: number) => {
                return (
                  <div key={appointment.id} className="relative pl-8 pb-8 border-l border-gray-200 last:border-0">
                    {/* Timeline dot */}
                    <div className="absolute -left-[9px] top-4 h-4 w-4 rounded-full bg-white border-2 border-blue-500" />
                    {/* Time */}
                    <div className="text-sm text-muted-foreground mb-2">
                      {new Date(appointment.start || '').toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {/* Card */}
                    <div className="grid gap-4">
                      <AppointmentCard3 appointment={appointment} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        {/* Page Buttons */}
        <Pagination
          totalEntries={totalEntries}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
        />
      </CardContent>
    </Card>
  );
};

const Pagination = ({
  totalEntries,
  currentPage,
  setCurrentPage,
  pageSize,
}: {
  totalEntries: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
}) => {
  return (
    <div className="flex gap-2 items-center justify-end">
      <span className="text-sm text-gray-500 mr-4">Total Entries: {totalEntries}</span>

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
    </div>
  );
};

const AppointmentCard = ({
  appointment,
  index,
  className,
  patient,
}: {
  appointment: Appointment;
  index: number;
  className?: string;
  patient: UseQueryResult<Patient[] | null, unknown>;
}) => {
  console.log('Patient:', patient);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow max-w-md',
        className,
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{patient.data?.name?.[0]?.given?.[0]}</h3>
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

export const ZambdaAppointments = () => {
  const { zambdaClient } = useApiClients();
  const [appointments, setAppointments] = useState([]);

  const { isFetching } = useQuery(
    ['get-appointments', { zambdaClient }],
    () =>
      zambdaClient
        ? getAppointments(zambdaClient, {
            searchDate: DateTime.now(),
            locationID: undefined,
            visitType: [],
            providerIDs: [],
            groupIDs: [],
          })
        : null,
    {
      onSuccess: (response) => {
        setAppointments(response || []);
      },
      enabled: !!zambdaClient,
    },
  );

  console.log('zambda appointments', appointments);

  return (
    <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
      {/* <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-md text-muted-foreground">View and manage patient appointments</p>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex justify-center text-center">
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex justify-center text-center">
              Calendar View
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="my-8">
            <AppointmentListView searchResults={appointments} />
          </TabsContent>
          <TabsContent value="calendar"></TabsContent>
        </Tabs>
      </div> */}
    </div>
  );
};

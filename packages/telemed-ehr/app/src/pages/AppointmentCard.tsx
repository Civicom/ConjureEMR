import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FhirClient } from '@zapehr/sdk';
import { UCAppointmentInformation } from 'ehr-utils';
import {
  CalendarIcon,
  ClockIcon,
  EllipsisVertical,
  Ellipsis,
  Hospital,
  InfoIcon,
  MapPin,
  PencilIcon,
  Pin,
  Stethoscope,
  UserRound,
  UserRoundPlus,
  Video,
  X,
  Clock,
  ClipboardPlus,
  Tag,
} from 'lucide-react';
import { Appointment, Location, Patient } from 'fhir/r4';
import { useApiClients } from '@/hooks/useAppClients';
import { useQuery } from 'react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppointmentCard3({ appointment }: { appointment: Appointment }) {
  const locationName = appointment.location?.[0]?.name || 'Unknown';
  const patientName =
    (appointment.patient?.[0]?.name?.[0]?.given?.[0] || '-') +
    ' ' +
    (appointment.patient?.[0]?.name?.[0]?.family || '-');

  console.log('patientName', patientName);

  // get first letter of patient name and last name
  const patientNameAvatar =
    (appointment.patient?.[0]?.name?.[0]?.given?.[0]?.[0] || '-').charAt(0) +
    (appointment.patient?.[0]?.name?.[0]?.family || '-').charAt(0);

  return (
    <Card className="md:flex text-gray-800">
      {/* Date and Time */}

      <CardHeader className="text-sm border-r w-64">
        <div className="font-semibold h-full flex flex-col items-center justify-center space-y-1">
          <p className="text-4xl font-bold">
            {new Date(appointment.start).toLocaleString('en-US', { day: 'numeric' })}
          </p>
          <p className="text-red-500 text-sm tracking-wide">
            {new Date(appointment.start).toLocaleString('en-US', { weekday: 'long' })}
          </p>

          <div className="flex flex-col items-center mt-3">
            <p className="text-xs font-medium">
              {new Date(appointment.start).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              <span className="mx-1">-</span>
              {new Date(appointment.end).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {new Date(appointment.start).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </CardHeader>
      <div className="w-full">
        {/* Header */}
        <CardHeader className="">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
            <Avatar>
              <AvatarImage src="/avatars/01.png" alt="Avatar" />
              <AvatarFallback>{patientNameAvatar}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="font-semibold leading-none text-sm">{patientName}</h2>
              <p className="text-xs text-mu ted-foreground capitalize">{appointment.appointmentType?.text}</p>
            </div>
            {/* <div className="h-1 w-1 rounded-full bg-gray-400 ml-4" />
            <div className="flex items-center gap-1 text-muted-foreground">
              <UserRound className="h-4 w-4" />
              <p className="text-sm uppercase">In Person</p>
            </div> */}
            <Badge className="ml-auto text-sm capitalize flex items-center gap-2  text-blue-900" variant="outline">
              {/* colored dot */}
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {appointment.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger>
                {' '}
                <Button variant="ghost" className="ml-autos ">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Cancel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="pb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="h-4 w-4" />
              <p>In Person</p>
            </div>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hospital className="h-4 w-4" />
              <p>{locationName}</p>
            </div>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardPlus className="h-4 w-4" />
              <p>Unassigned</p>
            </div>
          </div>
          <div className="bg-blue-100 p-2 text-xs text-blue-900 rounded-md space-y-1">
            <p className="font-semibold">Reason</p> <p>Weakness and headache</p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

const Info = ({ appointment }: { appointment: Appointment }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Date and Time */}
      {/* <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-md bg-slate-200 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
              </div>
              <div className="text-xs font-semibold">
                <label className="text-muted-foreground uppercase font-semibold flex mb-1">Time</label>
                <p className="">
                  {new Date(appointment.start).toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(appointment.end).toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div> */}
      {/* Office */}
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-slate-200 flex items-center justify-center">
            <Hospital className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        <div className="text-xs font-semibold">
          <label className="text-muted-foreground uppercase font-semibold flex mb-1">Location</label>
          <p className="">San Diego Medical Center</p>
        </div>
      </div>

      {/* Provider */}
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-slate-200 flex items-center justify-center">
            <ClipboardPlus className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        <div className="text-xs font-semibold">
          <label className="text-muted-foreground uppercase font-semibold flex mb-1">Provider</label>
          <p className="flex items-center gap-1 text-red-500">
            {/* icon to prompt admin to assign provider */}
            Unassigned
          </p>
          {/* Button to prompt admin to assign provider */}
        </div>
      </div>
    </div>
  );
};

export function AppointmentCard({
  patient,
  appointment,
  index,
}: {
  patient: Patient;
  appointment: Appointment;
  index: number;
}) {
  const patientName = patient?.name?.[0]?.family + ', ' + patient?.name?.[0]?.given?.[0];
  const patientNameAvatar = patient?.name?.[0]?.given?.[0]?.[0] + patient?.name?.[0]?.family?.[0];

  return (
    <Card className="col-span-3">
      <CardContent className="pt-8">
        <section className="space-y-4">
          <section className="flex">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatars/01.png" alt="Avatar" />
              <AvatarFallback>{patientNameAvatar}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <h2 className="text-sm font-semibold leading-none">{patientName}</h2>
              {/* <p className="text-sm text-muted-foreground">olivia.martin@email.com</p> */}
              <p className="text-sm text-muted-foreground">+1-760-121-3474</p>
            </div>
            <Badge className="ml-auto bg-yellow-100 text-yellow-600 uppercase text-sm mt-2">{appointment.status}</Badge>
          </section>
          <section className="space-y-1 rounded-md bg-gray-100 p-2">
            <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </section>
          <section className="flex space-x-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <time className="text-sm" datetime="2025-09-20T10:00">
                {new Date(appointment.start).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
              </time>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <time className="text-sm" datetime="2025-09-20T10:00">
                {new Date(appointment.start).toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(appointment.end).toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <address className="text-sm">1234 Main St, San Diego, CA 92101</address>
            </div>
          </section>
          <section className="flex space-x-2">
            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-gray-200 hover:text-red-500">
              <span className="text-sm font-semibold flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </span>
            </Button>
            <Button className="bg-red-500 text-white">
              <span className="text-sm font-semibold">View Details</span>
            </Button>
          </section>
        </section>
      </CardContent>
    </Card>
  );
}

export const AppointmentCard3Skeleton = () => {
  return (
    <Card className="md:flex text-gray-800">
      {/* Date and Time Skeleton */}
      <CardHeader className="text-sm border-r w-64">
        <div className="font-semibold h-full flex flex-col items-center justify-center space-y-1">
          <div className="h-12 w-12 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="flex flex-col items-center mt-3 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>

      <div className="w-full">
        {/* Header Skeleton */}
        <CardHeader>
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
            <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="ml-auto h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>

        {/* Content Skeleton */}
        <CardContent>
          <div className="pb-4 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-gray-100 p-2 rounded-md space-y-2">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export const TimelineAppointmentSkeleton = ({ pageSize }: { pageSize: number }) => {
  return (
    <>
      {Array.from({ length: pageSize }).map((_, index) => (
        <div className="relative pl-8 pb-8 border-l border-gray-200 last:border-0" key={index}>
          {/* Timeline dot */}
          <div className="absolute -left-[9px] top-4 h-4 w-4 rounded-full bg-white border-2 border-gray-200 animate-pulse" />
          {/* Time */}
          <div className="text-sm text-muted-foreground mb-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          {/* Card */}
          <div className="grid gap-4">
            <AppointmentCard3Skeleton />
          </div>
        </div>
      ))}
    </>
  );
};

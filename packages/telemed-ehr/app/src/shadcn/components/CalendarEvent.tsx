import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  ClockAlert,
  EllipsisVertical,
  MessageSquare,
  MoreHorizontal,
  NotepadText,
  PencilLine,
} from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppointmentWithDetails } from '../TestPage/ReactQuery/hooks/useAppointments';
import useAppointmentStatusColor from '@/hooks/useAppointmentStatusColor';
import { Separator } from '@/components/ui/separator';

// Move the appointment time/date formatting logic to a utility function
const formatAppointmentDetails = (appointment: AppointmentWithDetails) => {
  const aptDate = new Date(appointment.start).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const aptStart = new Date(appointment.start).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const aptEnd = new Date(appointment.end).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const aptTime = `${aptStart} - ${aptEnd}`;

  const aptName = `${appointment.patient?.[0]?.name?.[0]?.given?.[0] || '-'} ${appointment.patient?.[0]?.name?.[0]?.family || '-'}`;

  return { aptDate, aptStart, aptEnd, aptTime, aptName };
};

// Main CalendarEvent component that handles the dialog
const AppointmentModal = ({
  appointment,
  children,
}: {
  appointment: AppointmentWithDetails;
  children: React.ReactNode;
}) => {
  const { aptDate, aptTime, aptName } = formatAppointmentDetails(appointment);

  const appointmentDetails = [
    {
      icon: <Calendar className="w-4 h-4" />,
      title: 'Date',
      text: aptDate,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: 'Time',
      text: aptTime,
    },
    {
      title: 'Location',
      text: appointment.location?.[0]?.name || <div className="">No location provided</div>,
      icon: <NotepadText className="w-4 h-4" />,
    },
    {
      title: 'Provider',
      text: appointment.provider?.[0]?.name || <div className="">Unassigned</div>,
      icon: <NotepadText className="w-4 h-4" />,
    },
    {
      title: 'Reason',
      text: appointment.reason || <div className="">No reason provided </div>,
      icon: <NotepadText className="w-4 h-4" />,
      cols: 2,
    },
  ];

  const AppointmentDetails = ({
    icon,
    title,
    text,
    cols,
  }: {
    icon: React.ReactNode;
    title: string;
    text: string;
    cols?: number;
  }) => {
    return (
      <div className={`flex items-start gap-2 col-span-${cols}`}>
        <div className="bg-indigo-100 p-2 rounded-md flex items-center justify-center gap-2 w-8 h-8">{icon}</div>
        <div className="spaec">
          <h4 className="uppercase text-muted-foreground text-xs">{title}</h4>
          <p className="text-xs font-semibold">{text}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <section className="flex items-center gap-2 -mt-2">
              <p className="whitespace-nowrap text-muted-foreground text-xs font-normal">Appointment ID</p>
              <h1 className="whitespace-nowrap font-semibold text-base">#APT-1234567890</h1>
              <p className="whitespace-nowrap text-muted-foreground text-xs font-normal">•</p>
              <p className="whitespace-nowrap text-muted-foreground text-xs font-normal">PREBOOKED</p>
              <Button variant="outline" size="icon" className="ml-auto mr-4 text-muted-foreground">
                <PencilLine className="w-4 h-4" />
              </Button>
            </section>
          </DialogTitle>
          <DialogTitle className="border-y pt-4 pb-2">
            <section className="flex items-start gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="">
                <p className="whitespace-nowrap text-muted-foreground text-xs font-normal">Patient Name</p>
                <h1 className="whitespace-nowrap font-semibold text-base">{aptName}</h1>
              </div>
              <div className="ml-auto mr-4">
                <StatusBadge status={appointment.status} />
              </div>
            </section>
          </DialogTitle>
        </DialogHeader>
        <main className="space-y-4">
          {/* <section className="flex items-center gap-2 bg-teal-100 p-2 rounded-md">
            <div className="">
              <ClockAlert className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-xs text-teal-700">
              Time slot available in the future, you can extend the appointment time
            </p>
            <button className="font-semibold text-xs ml-auto px-2 text-teal-800">Extend time</button>
          </section> */}
          <section className="grid grid-cols-2 gap-6">
            {appointmentDetails.map((detail) => (
              <AppointmentDetails key={detail.title} {...detail} />
            ))}
          </section>
          <section></section>
          <footer className="flex items-center justify-end gap-1 border-t pt-4 ">
            <Button
              variant="outline"
              disabled={appointment.status === 'cancelled'}
              className="text-xs  h-8 ont-semibold text-red-500 hover:text-red-600"
            >
              Cancel Appointment
            </Button>
            <Button
              variant="default"
              disabled={appointment.status === 'arrived' || appointment.status === 'cancelled'}
              className="text-xs h-8 font-semibold bg-red-500 text-white hover:bg-red-600"
            >
              Mark as Arrived
              <ChevronRight className="w-4 h-4" />
            </Button>
          </footer>
        </main>
      </DialogContent>
    </Dialog>
  );
};

// Badge variant
export const CalendarEventBadge = ({ appointment }: { appointment: AppointmentWithDetails }) => {
  const { aptStart, aptName } = formatAppointmentDetails(appointment);

  const { primary, secondary, text } = useAppointmentStatusColor(appointment.status);

  const badge = (
    <Badge
      variant="secondary"
      key={appointment.id}
      className={`flex items-center gap-1 px-2 py-0 mb-1 cursor-pointer hover:bg-slate-200 ${secondary}`}
    >
      <div className={`w-1 h-1 ${primary} rounded-full inline-block`} />
      <p className="whitespace-nowrap font-normal">{aptStart}</p>
      <p className="whitespace-nowrap font-light">{aptName}</p>
    </Badge>
  );

  const badge2 = (
    <Badge
      variant="secondary"
      key={appointment.id}
      className={`flex items-center gap-1 px-2 py-0 mb-1 cursor-pointer hover:${primary} ${primary} text-white`}
    >
      <div className={`w-1 h-1 ${secondary} rounded-full inline-block`} />
      <p className="whitespace-nowrap font-semibold">{aptStart}</p>
      <p className="whitespace-nowrap">{aptName}</p>
    </Badge>
  );

  return <AppointmentModal appointment={appointment}>{badge}</AppointmentModal>;
};

// Card variant
export const CalendarEventCard = ({ appointment }: { appointment: AppointmentWithDetails }) => {
  const { primary, secondary, text, hoverPrimary, hoverSecondary } = useAppointmentStatusColor(appointment.status);
  const { aptTime, aptName } = formatAppointmentDetails(appointment);

  const card = (
    <Card className={`border-0 pb-2 p-2 w-full flex flex-wrap ${secondary} hover:opacity-80 mb-2 cursor-pointer `}>
      <div className="flex w-full ">
        <div className={`${primary} text-white h-4 w-4 rounded-full flex items-center justify-center mr-3`}>
          <Check className="h-4 w-4 rounded-full" aria-hidden="true" />
        </div>

        <div className="flex items-center justify-between">
          <time className="text-xs font-semibold flex items-center whitespace-nowrap ">
            <span className="whitespace-nowrap">{aptTime}</span>
          </time>
        </div>

        <div className="ml-auto">
          <StatusBadge status={appointment.status} />
        </div>
      </div>
      <div className="flex items-center justify-between ml-7">
        <div className="flex-1">
          <h3 className="text-xs font-semibold">{aptName}</h3>
        </div>
      </div>
    </Card>
  );

  const card2 = (
    <Card className="pb-2 p-2 w-full cursor-pointer hover:bg-slate-100 mb-2">
      <div className="flex">
        <div className={`h-auto w-2 ${primary} mr-4 rounded-full`}></div>
        <div className="flex gap-1 w-full">
          <div className="flex flex-col flex-1 gap-1">
            <h3 className="text-sm font-bold">{aptName} </h3>

            <div className="text-xs text-gray-500">{aptTime}</div>
          </div>
          <div>
            <Badge className={`text-xs ${primary} text-white hover:bg-${primary} capitalize`}>
              {appointment.status}
            </Badge>
          </div>
          {/* <StatusBadge status={appointment.status} /> */}
        </div>
      </div>
    </Card>
  );

  const card3 = (
    <Card className={`pb-2 p-2 w-full cursor-pointer hover:bg-slate-100 ${secondary} mb-2`}>
      <div className="flex">
        <div className={`h-auto w-2 ${primary} mr-4 rounded-full`}></div>
        <div className="flex gap-1 w-full">
          <div className="flex flex-col flex-1 gap-1">
            <h3 className="text-sm font-bold">{aptName} </h3>
            <div className="text-xs text-gray-500">{aptTime}</div>
          </div>
          <div>
            {/* <StatusBadge status={appointment.status} /> */}
            <Badge className={`text-xs ${primary} text-white hover:bg-${primary} ml-auto capitalize`}>
              {appointment.status}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );

  const card4 = (
    <Card className="pb-2 w-full cursor-pointer hover:bg-slate-100 mb-2">
      <Badge className={`text-xs ${primary} text-white hover:bg-${primary} capitalize`}>{appointment.status}</Badge>
      <div className="flex">
        {/* <div className={`h-auto w-2 ${primary} mr-4 rounded-full`}></div> */}

        <div className="flex gap-2 justify-between w-full p-2 ">
          <h3 className="text-sm font-bold">{aptName} </h3>
          <div className="text-xs text-gray-500">{aptTime}</div>
          {/* <StatusBadge status={appointment.status} /> */}
        </div>
      </div>
    </Card>
  );

  const card5 = (
    <div className={`rounded-xl shadow-sm  shadow-slate-200 pb-2 p-2 w-full cursor-pointer ${secondary} mb-2`}>
      <div className="flex">
        <div className={`h-auto w-2 ${primary} mr-4 rounded-full`}></div>
        <div className="flex gap-1 w-full">
          <div className="flex flex-col flex-1">
            <h3 className="text-sm font-normal">{aptName} </h3>

            <div className="text-xs text-gray-500">{aptTime}</div>
          </div>
          <div>
            <Badge className={`text-xs ${primary} text-white hover:bg-${primary} capitalize`}>
              {appointment.status}
            </Badge>
          </div>
          {/* <StatusBadge status={appointment.status} /> */}
        </div>
      </div>
    </div>
  );

  return <AppointmentModal appointment={appointment}>{card5}</AppointmentModal>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const { primary, secondary, text } = useAppointmentStatusColor(status);

  return (
    <Badge variant="outline" className="text-xs bg-white">
      <span className={`w-2 h-2 ${primary} rounded-full inline-block mr-2`} aria-hidden="true"></span>
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

export default AppointmentModal;

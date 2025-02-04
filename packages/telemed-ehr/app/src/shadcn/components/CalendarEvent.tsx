import { Badge } from '@/components/ui/badge';
import React from 'react';

const CalendarEvent = ({ appointment }: { appointment: any }) => {
  const aptDate = new Date(appointment.start);
  const aptTime = aptDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const aptName = `${appointment.patient?.[0]?.name?.[0]?.given?.[0] || '-'} ${appointment.patient?.[0]?.name?.[0]?.family || '-'}`;

  return (
    <Badge
      variant="secondary"
      key={appointment.id}
      className="flex items-center gap-1 px-2 py-0 mb-1 cursor-pointer hover:bg-slate-200 bg-slate-50"
    >
      <div className="w-1 h-1 bg-blue-500 rounded-full inline-block" />
      <p className="whitespace-nowrap font-semibold">{aptTime}</p>
      <p className="whitespace-nowrap">{aptName}</p>
    </Badge>
  );
};

export default CalendarEvent;

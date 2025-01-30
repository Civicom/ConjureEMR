import { useAppointments } from '@/components/TestPage/ReactQuery/hooks/useAppointments';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, InfoIcon, PlusIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AppointmentWithDetails } from '@/components/TestPage/ReactQuery/hooks/useAppointments';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RQBigCalender = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [date, setDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const { appointments, isLoading, totalEntries } = useAppointments({});

  const ViewButton = ({ type }: { type: 'day' | 'week' | 'month' }) => (
    <Button
      variant={view === type ? 'default' : 'secondary'}
      size="sm"
      className={`rounded-md font-semibold ${view === type ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'text-gray-500 hover:bg-gray-100'}`}
      onClick={() => setView(type)}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Button>
  );

  // change month and year on button click
  const handleDateChange = (day: number, month: number, year: number) => {
    if (month > 12) {
      setDate({ day: 1, month: 1, year: year + 1 });
    } else if (month < 1) {
      setDate({ day: 1, month: 12, year: year - 1 });
    } else {
      setDate({ day, month, year });
    }
  };

  return (
    <Card className="bg-white my-8 ">
      {/* Header */}
      <header className="flex items-center gap-2 font-semibold border-b border-gray-200 p-4">
        {/* TODO: move this in the main nav bar */}
        {/* <Clock />
         */}
        {/* Create div with width equal to sidebar width */}
        <div className={cn(` w-[275px]`)}></div>
        <div className="flex gap-2 mr-2">
          <Button variant="ghost" size="icon" onClick={() => handleDateChange(date.day, date.month - 1, date.year)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDateChange(date.day, date.month + 1, date.year)}>
            <ChevronRight />
          </Button>
        </div>
        {/* Date */}
        <div className="text-xl">
          {new Date(date.year, date.month, date.day).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        {/* Button group */}
        <div className="flex gap-2 ml-auto">
          <ViewButton type="day" />
          <ViewButton type="week" />
          <ViewButton type="month" />
        </div>
        {/* Create Appointment button */}
        <Button variant="default" className="ml-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-bold">
          <PlusIcon className="h-4 w-4" />
          Create Appointment
        </Button>
      </header>
      <main className="lg:flex divide-x">
        {/* Sidebar */}
        <Sidebar />
        {/* Big Calendar */}
        <section className="flex-1">
          {/* Days of the week */}
          <ul className="grid grid-cols-7 font-semibold">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <li key={day} className="text-center p-2 border-y lg:border-t-0 border-gray-200">
                {day}
              </li>
            ))}
          </ul>
          {/* Dates */}
          <ul className="grid grid-cols-7 bg-slate-50">
            {(() => {
              const today = new Date(date.year, date.month, date.day);
              const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              const startingDayOfWeek = firstDayOfMonth.getDay();
              const totalDays = lastDayOfMonth.getDate();
              const totalCells = Math.ceil((totalDays + startingDayOfWeek) / 7) * 7;

              return Array.from({ length: totalCells }).map((_, index) => {
                const dayNumber = index - startingDayOfWeek + 1;
                const isValidDay = dayNumber > 0 && dayNumber <= totalDays;
                const currentDate = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                const dateString = currentDate.toISOString().split('T')[0];

                return (
                  <ScrollArea key={index} className="relative border-b border-r border-gray-200 aspect-square">
                    {isValidDay ? (
                      <div
                        className={cn(
                          'text-xs font-semibold p-2 sticky top-0 bg-slate-50 z-50 w-full',
                          dayNumber === today.getDate() ? 'text-indigo-600' : 'text-gray-500',
                        )}
                      >
                        {dayNumber}
                      </div>
                    ) : (
                      ''
                    )}

                    <div className="z-10">
                      {isValidDay &&
                        appointments
                          .filter((apt) => apt.start?.includes(dateString))
                          .map((apt) => {
                            const aptDate = new Date(apt.start);
                            const aptTime = aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            const aptName =
                              (apt.patient?.[0]?.name?.[0]?.given?.[0] || '-') +
                              ' ' +
                              (apt.patient?.[0]?.name?.[0]?.family || '-');
                            return (
                              <Badge
                                variant="secondary"
                                key={apt.id}
                                className="text-[10px] flex items-center gap-1 px-2 py-0 mb-1 cursor-pointer hover:bg-slate-200 bg-slate-50"
                              >
                                {/* circle */}
                                <div className="w-1 h-1 bg-blue-500 rounded-full inline-block whitespace-nowrap"></div>
                                <p className="whitespace-nowrap font-semibold">{aptTime}</p>{' '}
                                <p className="whitespace-nowrap">{aptName}</p>
                              </Badge>
                            );
                          })}
                    </div>
                  </ScrollArea>
                );
              });
            })()}
          </ul>
        </section>
      </main>
    </Card>
  );
};

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time className="flex gap-2">
      <p>{time.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</p>
      <p>{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
    </time>
  );
};

const Sidebar = () => {
  return (
    <section className="flex lg:flex-col gap-4 divide-x lg:divide-y my-4 calendar-sidebar">
      {/* Calendar */}
      <Calendar className="text-xs" />
      {/* Appointments List */}
      <div className="p-4 space-y-4 flex-1">
        <div className="flex justify-between items-center">
          <h1 className="font-semibold">Not sure what to put here yet</h1>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon" className="p-1 ">
                <InfoIcon className="h-4 w-4 text-blue-500 hover:text-blue-600 cursor-pointer" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Legend</h4>
                  <ul className="flex flex-col gap-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                      <span className="text-xs text-muted-foreground">Prebooked</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full inline-block"></span>
                      <span className="text-xs text-muted-foreground">Completed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                      <span className="text-xs text-muted-foreground">Cancelled</span>
                    </li>
                  </ul>
                  {/* <div className="flex items-center pt-2">
                <span className="text-xs text-muted-foreground">Joined December 2021</span>
              </div> */}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <ul className="flex flex-col min-h-[80%] gap-4 text-sm">
          <li className="border-l-4 border-blue-500 pl-2">Edward Smith - 2:30 PM</li>
          <li className="border-l-4 border-blue-500 pl-2">Julius Caesar - 3:30 PM</li>
          <li className="border-l-4 border-blue-500 pl-2">Castro Piolo - 3:30 PM</li>
          <Button className="" variant="ghost" size="sm">
            <ChevronDown />
            More
          </Button>
          <h1 className="font-semibold">Maybe filters or legends</h1>
        </ul>
      </div>
    </section>
  );
};

export default RQBigCalender;

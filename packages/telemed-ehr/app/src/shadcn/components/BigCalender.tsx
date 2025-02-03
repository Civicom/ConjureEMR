import { useAppointments } from '@/components/TestPage/ReactQuery/hooks/useAppointments';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, InfoIcon, ListFilter, PlusIcon } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { AppointmentWithDetails } from '@/components/TestPage/ReactQuery/hooks/useAppointments';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { LogsView } from '@/components/TestPage/ReactQuery/RQAppointments';
import { ResizablePanel } from '@/components/ui/resizable';
import { ResizableHandle, ResizablePanelGroup } from '@/components/ui/resizable';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';

const RQBigCalender = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [date, setDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const filters = useMemo(
    () => ({
      patient: '',
      provider: '',
      status: '',
      start: new Date(date.year, date.month, 1).toISOString(),
      end: new Date(date.year, date.month, 31, 23, 59, 59, 999).toISOString(),
    }),
    [date.year, date.month],
  );

  console.log('calendar filters', filters);

  const { appointments, isLoading, totalEntries } = useAppointments({
    filters,
  });

  // change month and year on button click
  const handleDateChange = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, 1);
    setDate({
      day: 1,
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    });

    // Update filters for new month
    // setFilters((prev) => ({
    //   ...prev,
    //   start: new Date(newDate.getFullYear(), newDate.getMonth(), 1).toISOString(),
    //   end: new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
    // }));
  };

  return (
    <Card className="bg-white ">
      {/* Header */}
      <header className="relative grid lg:grid-cols-12 gap-2 font-semibold border-b border-gray-200 p-4">
        {/* loading bar that runs from left to right attached on top of the header */}
        {/* TODO: move this in the main nav bar */}
        {/* <Clock />
         */}
        {/* Create div with width equal to sidebar width */}
        {/* <h1>Appointments</h1> */}
        <div className={cn(`col-span-3 w-[275px]`)}></div>
        <div className="col-span-9  flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2 col-span-9">
              <Button variant="ghost" size="icon" onClick={() => handleDateChange(date.day, date.month - 1, date.year)}>
                <ChevronLeft />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDateChange(date.day, date.month + 1, date.year)}>
                <ChevronRight />
              </Button>
            </div>
            {/* Date */}
            <div className="">
              {new Date(date.year, date.month, date.day).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* <b>Filters</b> */}
            <Button size="icon" variant="outline">
              <ListFilter className="h-4 w-4 text-gray-500" />
            </Button>
            {/* <input placeholder="Search" className="border border-gray-300 rounded-md p-1" /> */}
            <select className="border border-gray-300 rounded-md p-1" id="status">
              <option value="status">All</option>
              <option value="status">Prebooked</option>
              <option value="status">In Office</option>
              <option value="status">Completed</option>
              <option value="status">Cancelled</option>
            </select>
          </div>
          <div className="max-w-md">
            <Select
              value={view}
              onValueChange={(value) => setView(value as 'day' | 'week' | 'month')}
              defaultValue="month"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue defaultValue={view} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>View</SelectLabel>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* Create Appointment button */}
          <Button variant="default" className="ml-4 bg-indigo-600 hover:bg-indigo-700 rounded-md font-bold" asChild>
            <Link to="/visits/add">
              <PlusIcon className="h-4 w-4" />
              Create Appointment
            </Link>
          </Button>
        </div>
      </header>
      <main className="lg:grid grid-cols-12 divide-x">
        {/* Sidebar */}
        <Sidebar />
        {/* Big Calendar */}
        {isLoading ? <MonthViewSkeleton /> : <MonthView date={date} appointments={appointments} />}
      </main>
    </Card>
  );
};

const MonthViewSkeleton = () => {
  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[90dvh] w-full col-span-9 flex-1">
      <div className="font-semibold text-xs flex flex-col divide-y resize divide-gray-200 flex-1">
        {/* Weekday Header */}
        <ul className="grid grid-cols-7 font-semibold shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <li key={day} className="text-center p-2 lg:border-t-0 border-gray-200">
              {day}
            </li>
          ))}
        </ul>

        {/* Calendar Grid */}
        {Array.from({ length: 6 }).map((_, weekIndex) => (
          <div key={weekIndex} className="w-full border-gray-500 divide-x flex flex-1 gap-4">
            {Array.from({ length: 7 }).map((_, dayIndex) => (
              <div key={dayIndex} className="relative w-full bg-white border-gray-300 p-2">
                {/* Day number skeleton */}
                <div className="h-6 w-6 bg-gray-200 rounded-full mb-2 animate-pulse" />

                {/* Appointment skeletons */}
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, aptIndex) => (
                    <div key={aptIndex} className="h-5 bg-gray-100 rounded-md w-[90%] animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <ResizableHandle />
    </ResizablePanelGroup>
  );
};

interface CalendarGridProps {
  date: {
    day: number;
    month: number;
    year: number;
  };
  appointments: AppointmentWithDetails[];
}

const CalendarGrid = ({ date, appointments }: CalendarGridProps) => {
  // Get calendar metadata for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(date.year, date.month, 1);
    const lastDay = new Date(date.year, date.month + 1, 0);
    const startingWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const weeksToShow = Math.ceil((daysInMonth + startingWeekday) / 7);

    // Get last day of previous month
    const prevMonthLastDay = new Date(date.year, date.month, 0).getDate();

    return {
      startingWeekday,
      daysInMonth,
      weeksToShow,
      prevMonthLastDay,
    };
  }, [date.year, date.month]);

  // Generate calendar cells
  const renderCalendarCells = () => {
    return Array.from({ length: calendarDays.weeksToShow }).map((_, weekIndex) => (
      <div key={weekIndex} className="w-full border-gray-500 divide-x flex flex-1 gap-4">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
          const dayNumber = weekIndex * 7 + dayIndex - calendarDays.startingWeekday + 1;
          let displayDate: Date;
          let isCurrentMonth = true;

          if (dayNumber <= 0) {
            // Previous month
            displayDate = new Date(date.year, date.month - 1, calendarDays.prevMonthLastDay + dayNumber);
            isCurrentMonth = false;
          } else if (dayNumber > calendarDays.daysInMonth) {
            // Next month
            displayDate = new Date(date.year, date.month + 1, dayNumber - calendarDays.daysInMonth);
            isCurrentMonth = false;
          } else {
            // Current month
            displayDate = new Date(date.year, date.month, dayNumber);
          }

          const dateString = displayDate.toISOString().split('T')[0];
          const dayAppointments = appointments.filter((apt) => apt.start?.includes(dateString));

          return (
            <DayCell
              key={dayIndex}
              dayNumber={displayDate.getDate()}
              appointments={dayAppointments}
              isToday={
                displayDate.getDate() === new Date().getDate() &&
                displayDate.getMonth() === new Date().getMonth() &&
                displayDate.getFullYear() === new Date().getFullYear()
              }
              isCurrentMonth={isCurrentMonth}
            />
          );
        })}
      </div>
    ));
  };

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[90dvh] w-full col-span-9 flex-1 ">
      <div className="font-semibold text-xs  flex flex-col divide-y resize divide-gray-200 flex-1">
        <WeekdayHeader />
        {renderCalendarCells()}
      </div>
      <ResizableHandle />
    </ResizablePanelGroup>
  );
};

const WeekdayHeader = () => (
  <ul className="grid grid-cols-7 font-semibold shrink-0">
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
      <li key={day} className="text-center p-2 lg:border-t-0 border-gray-200">
        {day}
      </li>
    ))}
  </ul>
);

interface DayCellProps {
  dayNumber: number | null;
  appointments: AppointmentWithDetails[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

const DayCell = ({ dayNumber, appointments, isToday, isCurrentMonth }: DayCellProps) => {
  const [maxVisibleAppointments, setMaxVisibleAppointments] = useState(3);
  const hasMoreAppointments = appointments.length > maxVisibleAppointments;

  return (
    <ScrollArea className="relative w-full bg-white border-gray-300 overflow-x-auto overflow-y-auto p-2">
      <div
        className={cn(
          'sticky top-0 left-0 bg-white',
          isToday && 'text-white bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center',
          !isCurrentMonth && 'text-gray-400',
        )}
      >
        {dayNumber}
      </div>
      <div className="mt-1">
        {appointments.slice(0, maxVisibleAppointments).map((apt) => {
          const aptDate = new Date(apt.start);
          const aptTime = aptDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const aptName = `${apt.patient?.[0]?.name?.[0]?.given?.[0] || '-'} ${
            apt.patient?.[0]?.name?.[0]?.family || '-'
          }`;

          return (
            <Badge
              variant="secondary"
              key={apt.id}
              className="flex items-center gap-1 px-2 py-0 mb-1 cursor-pointer hover:bg-slate-200 bg-slate-50"
            >
              <div className="w-1 h-1 bg-blue-500 rounded-full inline-block" />
              <p className="whitespace-nowrap font-semibold">{aptTime}</p>
              <p className="whitespace-nowrap">{aptName}</p>
            </Badge>
          );
        })}
        {hasMoreAppointments && (
          <div className="text-xs text-muted-foreground text-center">
            +{appointments.length - maxVisibleAppointments} more
          </div>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

const MonthView = ({ date, appointments }: { date: any; appointments: AppointmentWithDetails[] }) => {
  const { isLoading } = useAppointments({ filters: {} });

  if (isLoading) {
    return <MonthViewSkeleton />;
  }

  return (
    <div className="col-span-9 h-full flex flex-col">
      <CalendarGrid date={date} appointments={appointments} />
    </div>
  );
};

const Sidebar = () => {
  return (
    <section className="overflow-x-hidden overflow-y-auto col-span-3 lg:flex-col gap-4 divide-x lg:divide-y calendar-sidebar">
      {/* Calendar */}
      {/* <Calendar className="text-xs" /> */}
      {/* Appointments List */}
      {/* <LogsView /> */}
      <div className="p-4 space-y-4 flex-1">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold">Today's Appointments</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })},{' '}
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
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
          {/* <li className="border-l-4 border-blue-500 pl-2">Edward Smith - 2:30 PM</li>
          <li className="border-l-4 border-blue-500 pl-2">Julius Caesar - 3:30 PM</li>
          <li className="border-l-4 border-blue-500 pl-2">Castro Piolo - 3:30 PM</li> */}
          <Button className="" variant="ghost" size="sm">
            <ChevronDown />
            More
          </Button>
        </ul>
      </div>
    </section>
  );
};

export default RQBigCalender;

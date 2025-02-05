import { useAppointments } from '@/components/TestPage/ReactQuery/hooks/useAppointments';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  InfoIcon,
  ListFilter,
  PlusIcon,
} from 'lucide-react';
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
import AppointmentModal, { CalendarEventBadge, CalendarEventCard } from './CalendarEvent';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    <Card className="bg-gray-100 ">
      {/* Header */}
      <header className="relative gap-2 font-semibold border-b border-gray-200 p-4 bg-white">
        {/* loading bar that runs from left to right attached on top of the header */}
        {/* TODO: move this in the main nav bar */}
        {/* <Clock />
         */}
        {/* Create div with width equal to sidebar width */}
        {/* <h1>Appointments</h1> */}

        {/* <div className={cn(`col-span-3 w-[275px]`)}></div> */}

        <div className="flex items-center gap-4 ">
          {/* Create Appointment button */}
          <Button
            variant="default"
            className="bg-red-600 hover:bg-red-700 rounded-sm font-semibold text-xs h-8"
            asChild
          >
            <Link to="/visits/add">
              <PlusIcon className="h-4 w-4" />
              Create Appointment
            </Link>
          </Button>

          {/* Filters */}
          <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-4 ml-auto ">
            {/* Date */}
            <div className="">
              {new Date(date.year, date.month, date.day).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
            <div className="flex gap-2 col-span-9">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleDateChange(date.day, date.month - 1, date.year)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleDateChange(date.day, date.month + 1, date.year)}
              >
                <ChevronRight />
              </Button>
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
          </div>
        </div>
      </header>
      <main className="lg:grid grid-cols-12 divide-x">
        {/* Sidebar */}
        <Sidebar appointments={appointments} totalEntries={totalEntries} />
        {/* Big Calendar */}
        {isLoading ? <MonthViewSkeleton /> : <MonthView date={date} appointments={appointments} />}
      </main>
    </Card>
  );
};

const MonthViewSkeleton = () => {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-[90dvh] w-full col-span-9 flex-1 bg-white m-2 rounded-lg border border-gray-200"
    >
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
              <div key={dayIndex} className="relative w-full  border-gray-300 p-2">
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
      <div key={weekIndex} className="w-full border-gray-500 divide-x flex flex-1 ">
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
  const remainingAppointments = appointments.slice(maxVisibleAppointments);

  return (
    <ScrollArea className="relative w-full border-gray-300 overflow-x-auto overflow-y-auto p-2">
      <div
        className={cn(
          'sticky top-0 left-0',
          isToday && 'text-white bg-red-600 rounded-full w-6 h-6 flex items-center justify-center',
          !isCurrentMonth && 'text-gray-400',
        )}
      >
        {dayNumber}
      </div>
      <div className="mt-1">
        {appointments.slice(0, maxVisibleAppointments).map((apt, index) => (
          <CalendarEventBadge
            key={apt.id}
            appointment={apt}
            //   position={{
            //     isFirstRow: index === 0,
            //     isLastRow: index === appointments.length - 1,
            //     isLeftSide: dayNumber % 7 === 0, // Sunday
            //     isRightSide: dayNumber % 7 === 6, // Saturday
            //   }}
            //
          />
        ))}
        {hasMoreAppointments && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:bg-gray-100 h-6 p-1">
                +{appointments.length - maxVisibleAppointments} more
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start" sideOffset={5}>
              <div className="space-y-1">
                <div className="text-sm font-semibold pb-2 px-2">
                  {new Date(appointments[0].start).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <ScrollArea className="h-[200px]">
                  {remainingAppointments.map((apt) => (
                    <CalendarEventBadge key={apt.id} appointment={apt} />
                  ))}
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
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
    <div className="col-span-9 h-full flex flex-col shadow-sm bg-white rounded-lg m-2 border border-gray-200">
      <CalendarGrid date={date} appointments={appointments} />
    </div>
  );
};

const Sidebar = ({ appointments, totalEntries }: { appointments: AppointmentWithDetails[]; totalEntries: number }) => {
  const appointmentsToday = appointments;
  // const appointmentsToday = appointments?.filter((apt) => apt.start?.includes(new Date().toISOString().split('T')[0]));
  return (
    <section className="overflow-x-hidden overflow-y-auto col-span-3 lg:flex-col gap-4 divide-x lg:divide-y calendar-sidebar">
      {/* Calendar */}
      {/* <Calendar className="text-xs" /> */}
      {/* Appointments List */}
      {/* <LogsView /> */}
      <div className="py-4 space-y-4 flex-1">
        <div className="px-4 flex justify-between items-center">
          <div>
            <h1 className="font-semibold">Today's Appointments</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })},{' '}
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>
        </div>
        {/* Appointments List */}
        <div>
          <Separator className="mb-2 " />
          <div className="relative">
            <ScrollArea className="h-[75dvh] overflow-y-auto flex flex-col gap-2 text-sm px-4">
              {/* Filter appointments today and sort by start time */}

              {appointmentsToday.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">No appointments found for today</p>
              ) : (
                appointmentsToday.map((apt) => <CalendarEventCard key={apt.id} appointment={apt} />)
              )}
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
          </div>
          <p className="text-xs text-muted-foreground p-2 text-right">
            {/* {appointmentsToday.length} appointments found for today */}
          </p>

          {/* <Button className="" variant="ghost" size="sm">
            <ChevronDown />
            More
          </Button> */}
        </div>
      </div>
    </section>
  );
};

export default RQBigCalender;

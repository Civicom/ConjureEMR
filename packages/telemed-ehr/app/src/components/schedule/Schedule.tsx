import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  capitalize,
} from '@mui/material';
// import Alert, { AlertColor } from '@mui/material/Alert';
import React, { ReactElement } from 'react';
import { ScheduleCapacity } from './ScheduleCapacity';
import { HealthcareService, Location, LocationHoursOfOperation, Practitioner } from 'fhir/r4';
import { ScheduleOverrides } from './ScheduleOverrides';
import { otherColors } from '../../CustomThemeProvider';
import { DateTime } from 'luxon';
import { Operation } from 'fast-json-patch';
import { Closure, Day, Overrides, ScheduleExtension, Weekday, Weekdays } from '../../types/types';
import { useApiClients } from '../../hooks/useAppClients';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ReTabsSquare, ReTabsSquareList, ReTabsSquareTrigger, ReTabsSquareContent } from "../ui/retabssquare";
// import { ToastMessage } from '../../pages/Schedule';
import { ToastMessage , createToast}  from '../../pages/Schedule';
import { useState, useMemo } from 'react';

interface InfoForDayProps {
  day: Weekday;
  setDay: (day: Day) => void;
  dayOfWeek: string;
  updateItem: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
}

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DEFAULT_CAPACITY = 20; // default capacity

export const dayToDayCode: {
  [day: string]: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
} = {
  Monday: 'mon',
  Tuesday: 'tue',
  Wednesday: 'wed',
  Thursday: 'thu',
  Friday: 'fri',
  Saturday: 'sat',
  Sunday: 'sun',
};

export const allWorkingDays = ['sun', 'sat', 'fri', 'mon', 'tue', 'wed', 'thu'];
export function getTimeFromString(time: string): number {
  const timeHour = time.substring(0, 2);
  return Number(timeHour);
}

function InfoForDay({ day, setDay, updateItem, loading }: InfoForDayProps): ReactElement {
  const [open, setOpen] = React.useState<number>(day.open);
  const [openingBuffer, setOpeningBuffer] = React.useState<number>(day.openingBuffer);
  const [close, setClose] = React.useState<number>(day.close ?? 24);
  const [closingBuffer, setClosingBuffer] = React.useState<number>(day.closingBuffer);
  const [workingDay, setWorkingDay] = React.useState<boolean>(day.workingDay);

  function createOpenCloseSelectField(type: 'Open' | 'Close', day: Day): ReactElement {
    const typeLowercase = type.toLocaleLowerCase();
    return (
      // Old code
      // <FormControl sx={{ marginRight: 2 }}>
      //   <InputLabel id={`${typeLowercase}-label`}>{type}</InputLabel>
      //   <Select
      //     labelId={`${typeLowercase}-label`}
      //     id={typeLowercase}
      //     value={type === 'Open' ? open : close}
      //     label={type}
      //     disabled={!workingDay}
      //     onChange={(newTime) => {
      //       const updatedTime = Number(newTime.target.value);
      //       const dayTemp = day;
      //       if (type === 'Open') {
      //         setOpen(updatedTime);
      //         dayTemp.open = updatedTime;
      //         setDay(dayTemp);
      //       } else if (type === 'Close') {
      //         setClose(updatedTime);
      //         dayTemp.close = updatedTime;
      //         setDay(dayTemp);
      //       }
      //     }}
      //     sx={{
      //       width: 200,
      //       maxWidth: '100%',
      //       flexShrink: 1,
      //     }}
      //     MenuProps={{
      //       PaperProps: {
      //         sx: {
      //           '& .MuiMenuItem-root:hover': {
      //             backgroundColor: otherColors.selectMenuHover,
      //           },
      //         },
      //       },
      //     }}
      //   >
      //     {type === 'Open' && <MenuItem value={0}>12 AM</MenuItem>}
      //     <MenuItem value={1}>1 AM</MenuItem>
      //     <MenuItem value={2}>2 AM</MenuItem>
      //     <MenuItem value={3}>3 AM</MenuItem>
      //     <MenuItem value={4}>4 AM</MenuItem>
      //     <MenuItem value={5}>5 AM</MenuItem>
      //     <MenuItem value={6}>6 AM</MenuItem>
      //     <MenuItem value={7}>7 AM</MenuItem>
      //     <MenuItem value={8}>8 AM</MenuItem>
      //     <MenuItem value={9}>9 AM</MenuItem>
      //     <MenuItem value={10}>10 AM</MenuItem>
      //     <MenuItem value={11}>11 AM</MenuItem>
      //     <MenuItem value={12}>12 PM</MenuItem>
      //     <MenuItem value={13}>1 PM</MenuItem>
      //     <MenuItem value={14}>2 PM</MenuItem>
      //     <MenuItem value={15}>3 PM</MenuItem>
      //     <MenuItem value={16}>4 PM</MenuItem>
      //     <MenuItem value={17}>5 PM</MenuItem>
      //     <MenuItem value={18}>6 PM</MenuItem>
      //     <MenuItem value={19}>7 PM</MenuItem>
      //     <MenuItem value={20}>8 PM</MenuItem>
      //     <MenuItem value={21}>9 PM</MenuItem>
      //     <MenuItem value={22}>10 PM</MenuItem>
      //     <MenuItem value={23}>11 PM</MenuItem>
      //     {type === 'Close' && <MenuItem value={24}>12 AM</MenuItem>}
      //   </Select>
      // </FormControl>

      // New code
      <div className="mr-8">
        <label 
          htmlFor={typeLowercase}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {type}
        </label>
        <select
          id={typeLowercase}
          value={type === 'Open' ? open : close}
          disabled={!workingDay}
          onChange={(event) => {
            const updatedTime = Number(event.target.value);
            const dayTemp = day;
            if (type === 'Open') {
              setOpen(updatedTime);
              dayTemp.open = updatedTime;
              setDay(dayTemp);
            } else if (type === 'Close') {
              setClose(updatedTime);
              dayTemp.close = updatedTime;
              setDay(dayTemp);
            }
          }}
          className="w-[200px] max-w-full flex-shrink px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
        >
          {type === 'Open' && <option value={0}>12 AM</option>}
          <option value={1}>1 AM</option>
          <option value={2}>2 AM</option>
          <option value={3}>3 AM</option>
          <option value={4}>4 AM</option>
          <option value={5}>5 AM</option>
          <option value={6}>6 AM</option>
          <option value={7}>7 AM</option>
          <option value={8}>8 AM</option>
          <option value={9}>9 AM</option>
          <option value={10}>10 AM</option>
          <option value={11}>11 AM</option>
          <option value={12}>12 PM</option>
          <option value={13}>1 PM</option>
          <option value={14}>2 PM</option>
          <option value={15}>3 PM</option>
          <option value={16}>4 PM</option>
          <option value={17}>5 PM</option>
          <option value={18}>6 PM</option>
          <option value={19}>7 PM</option>
          <option value={20}>8 PM</option>
          <option value={21}>9 PM</option>
          <option value={22}>10 PM</option>
          <option value={23}>11 PM</option>
          {type === 'Close' && <option value={24}>12 AM</option>}
        </select>
      </div>
    );
  }

  function createOpenCloseBufferSelectField(type: 'Open' | 'Close', day: Day): ReactElement {
    const typeVerb = type === 'Close' ? 'Closing' : 'Opening';
    const typeLowercase = typeVerb.toLocaleLowerCase();
    const bufferValue = type === 'Open' ? (openingBuffer ?? '') : (closingBuffer ?? '');

    return (
      // Old code
      // <FormControl sx={{ marginRight: 2 }}>
      //   <InputLabel id={`${typeLowercase}-buffer-label`}>{typeVerb} Buffer</InputLabel>
      //   <Select
      //     labelId={`${typeLowercase}-buffer-label`}
      //     id={`${typeLowercase}-buffer`}
      //     value={bufferValue}
      //     defaultValue={bufferValue}
      //     label={`${typeVerb} Buffer`}
      //     disabled={!workingDay}
      //     onChange={(newNumber) => {
      //       const updatedNumber = Number(newNumber.target.value);
      //       const dayTemp = day;
      //       if (type === 'Open') {
      //         setOpeningBuffer(updatedNumber);
      //         dayTemp.openingBuffer = updatedNumber;
      //         setDay(dayTemp);
      //       } else if (type === 'Close') {
      //         setClosingBuffer(updatedNumber);
      //         dayTemp.closingBuffer = updatedNumber;
      //         setDay(dayTemp);
      //       }
      //     }}
      //     sx={{
      //       width: 200,
      //       maxWidth: '100%',
      //       flexShrink: 1,
      //     }}
      //     MenuProps={{
      //       PaperProps: {
      //         sx: {
      //           '& .MuiMenuItem-root:hover': {
      //             backgroundColor: otherColors.selectMenuHover,
      //           },
      //         },
      //       },
      //     }}
      //   >
      //     <MenuItem value={0}>0 mins</MenuItem>
      //     <MenuItem value={15}>15 mins</MenuItem>
      //     <MenuItem value={30}>30 mins</MenuItem>
      //     <MenuItem value={60}>60 mins</MenuItem>
      //     <MenuItem value={90}>90 mins</MenuItem>
      //   </Select>
      // </FormControl>

      // New code
      <div className="mr-8">
        <label 
          htmlFor={`${typeLowercase}-buffer`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {typeVerb} Buffer
        </label>
        <select
          id={`${typeLowercase}-buffer`}
          value={bufferValue}
          // defaultValue={bufferValue}
          disabled={!workingDay}
          onChange={(event) => {
            const updatedNumber = Number(event.target.value);
            const dayTemp = day;
            if (type === 'Open') {
              setOpeningBuffer(updatedNumber);
              dayTemp.openingBuffer = updatedNumber;
              setDay(dayTemp);
            } else if (type === 'Close') {
              setClosingBuffer(updatedNumber);
              dayTemp.closingBuffer = updatedNumber;
              setDay(dayTemp);
            }
          }}
          className="w-[200px] max-w-full flex-shrink px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value={0}>0 mins</option>
          <option value={15}>15 mins</option>
          <option value={30}>30 mins</option>
          <option value={60}>60 mins</option>
          <option value={90}>90 mins</option>
        </select>
      </div>
    );
  }

  return (
    <div className="">
      <>
        {/* Working Hours */}
        <h4 className="text-2xl text-primary-dark mb-8 -mt-1">
          Working Hours
        </h4>

        {/* Working Hours Form */}
        <div className="flex flex-row items-center">
          {/* Checkbox */}
          <label className="flex items-center space-x-2 mr-8">
            <input
              type="checkbox"
              checked={workingDay}
              onChange={(event) => {
                const dayTemp = day;
                dayTemp.workingDay = event.target.checked;
                setDay(dayTemp);
                setWorkingDay(event.target.checked);
              }}
              className="accent-red-500 form-checkbox w-[18px] h-[18px] "
            />
            <span>Working Day</span>
          </label>

          {createOpenCloseSelectField('Open', day)}
          {createOpenCloseBufferSelectField('Open', day)}

          {createOpenCloseSelectField('Close', day)}
          {createOpenCloseBufferSelectField('Close', day)}
        </div>

        {/* Capacity */}
        <form onSubmit={updateItem}>
          {workingDay && (
            <div>
              <div className="inline-flex items-center mb-12 mt-24">
                <h4 className="text-2xl text-primary-dark">
                  Capacity
                </h4>

                {/* Visit duration */}
                <div className="flex flex-row items-center">
                  <InfoOutlinedIcon
                    className="mr-4 ml-12 w-[18px] h-[18px] text-secondary"
                  />
                  <p className="text-base">
                    <span className="font-bold">Visit Duration:</span>{' '}
                    15 minutes
                  </p>
                </div>
              </div>

              <ScheduleCapacity
                day={day}
                setDay={setDay}
                openingHour={open}
                closingHour={close}
                openingBuffer={openingBuffer}
                closingBuffer={closingBuffer}
              />
            </div>
          )}
          {/* save changes and cancel buttons */}
          <div className="mt-12 flex flex-row">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 h-9 font-bold bg-primary text-white disabled:opacity-50 text-center"
            >
              {loading 
              ? <svg aria-hidden="true" className="fill-white text-black w-5 h-5 animate-spin dark:text-gray-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>   
              : 'Save Changes'}
            </button>
          </div>
          <p className="mt-4">
            Please note if you save changes to Working Hours, edits to Schedule Overrides and Closed Dates will be saved
            too.
          </p>
        </form>
      </>
    </div>
  );
}

interface ScheduleProps {
  item: Location | Practitioner | HealthcareService;
  id: string;
  setItem: React.Dispatch<React.SetStateAction<Location | Practitioner | HealthcareService | undefined>>;
  addToast: (message: string, type: ToastMessage['type']) => void;
}

export default function Schedule({ item, setItem, addToast }: ScheduleProps): ReactElement {
  const today = DateTime.now().toLocaleString({ weekday: 'long' }).toLowerCase();
  const [dayOfWeek, setDayOfWeek] = React.useState(today);
  const [days, setDays] = React.useState<Weekdays | undefined>(undefined);
  const [overrides, setOverrides] = React.useState<Overrides | undefined>(undefined);
  const [closures, setClosures] = React.useState<Closure[]>();
  const [loading, setLoading] = React.useState<boolean>(false);
  const { fhirClient } = useApiClients();
  // const [toastMessage, setToastMessage] = React.useState<string | undefined>(undefined);
  // const [toastType, setToastType] = React.useState<AlertColor | undefined>(undefined);
  // const [snackbarOpen, setSnackbarOpen] = React.useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // const {addToast} = useMemo(() => createToast(setToasts), []);

  const handleTabChange = (event: React.SyntheticEvent, newDayOfWeek: string): void => {
    setDayOfWeek(newDayOfWeek);
  };

  function getWorkingHoursOperation(): Operation | undefined {
    if (!days) {
      return;
    }

    const newHoursOfOperation: LocationHoursOfOperation[] = [];
    Object.keys(days).forEach((day) => {
      const dayInfo: Weekday = days[day];
      if (!dayInfo.workingDay) {
        return;
      }

      let dayHours: LocationHoursOfOperation;
      if (dayInfo.close !== 24) {
        dayHours = {
          openingTime: `${dayInfo.open.toString().padStart(2, '0')}:00:00`,
          closingTime: `${dayInfo.close.toString().padStart(2, '0')}:00:00`,
          daysOfWeek: [dayToDayCode[capitalize(day)]],
        };
      } else {
        dayHours = {
          openingTime: `${dayInfo.open.toString().padStart(2, '0')}:00:00`,
          daysOfWeek: [dayToDayCode[capitalize(day)]],
        };
      }

      newHoursOfOperation.push(dayHours);
    });

    if (newHoursOfOperation.length === 0) {
      return undefined;
    }

    if (item.resourceType === 'Location') {
      return {
        op: item.hoursOfOperation ? 'replace' : 'add',
        path: '/hoursOfOperation',
        value: newHoursOfOperation,
      };
    } else {
      return undefined;
    }
  }

  async function updateItem(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const extensionTemp = item.extension;
    const extensionSchedule = extensionTemp?.find(
      (extensionTemp) => extensionTemp.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
    );

    try {
      if (!fhirClient || !extensionSchedule) {
        throw new Error('Failed to update item');
      }

      // Get patch operation for schedule extension that includes schedule/capacities, scheduleOverrides, and closures
      setLoading(true);

      extensionSchedule.valueString = JSON.stringify({
        schedule: days ?? {},
        scheduleOverrides: overrides ?? {},
        closures: closures,
      });
      const operations: Operation[] = [
        {
          op: 'replace',
          path: '/extension',
          value: extensionTemp,
        },
      ];

      // Get patch operation for item hoursOfOperation
      const workingHoursOperation = getWorkingHoursOperation();
      if (workingHoursOperation) {
        operations.push(workingHoursOperation);
      }

      await fhirClient.patchResource({
        resourceType: item.resourceType,
        resourceId: item.id || '',
        operations: operations,
      });

      setLoading(false);
      addToast('Schedule: Changes saved', 'Success');
      console.log("Schedule: Changes saved");
    } catch (error) {
      console.error(error);
      addToast('Failed to save schedule changes', 'Error');
      console.log("Failed to save schedule changes");
    } finally {
      setLoading(false);
    }
  }

  const handleSnackBarClose = (): void => {
    // setSnackbarOpen(false);
  };

  React.useEffect(() => {
    const scheduleExtension = item.extension?.find(
      (extensionTemp) => extensionTemp.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
    )?.valueString;

    if (scheduleExtension) {
      const { schedule, scheduleOverrides, closures } = JSON.parse(scheduleExtension) as ScheduleExtension;
      setDays(schedule);
      setOverrides(scheduleOverrides);
      setClosures(closures);
    }
  }, [item.extension]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md mb-6 p-6">

        <ReTabsSquare defaultValue="monday">
          <ReTabsSquareList className="bg-white text-[#EF4444] border border-[#EF4444]">
            <ReTabsSquareTrigger value="monday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Monday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="tuesday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Tuesday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="wednesday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Wednesday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="thursday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Thursday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="friday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Friday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="saturday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Saturday</ReTabsSquareTrigger>
            <ReTabsSquareTrigger value="sunday" className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white font-bold">Sunday</ReTabsSquareTrigger>
          </ReTabsSquareList>

          {days &&
          Object.keys(days).map((day) => (
            <ReTabsSquareContent value={day} key={day} className="my-[24px]">
              <InfoForDay
                day={days[day]}
                setDay={(dayTemp: Day) => {
                  const daysTemp = days;
                  daysTemp[day] = { ...dayTemp, workingDay: days[day].workingDay };
                  setDays(daysTemp);
                }}
                dayOfWeek={dayOfWeek}
                updateItem={updateItem}
                loading={loading}
              ></InfoForDay>
            </ReTabsSquareContent>
          ))}
        </ReTabsSquare>
      </div>

      <ScheduleOverrides 
        overrides={overrides}
        closures={closures}
        item={item}
        dayOfWeek={dayOfWeek}
        setItem={setItem}
        setOverrides={setOverrides}
        setClosures={setClosures}
        updateItem={updateItem}
        addToast={addToast}
      />
    </>
  );
}

import React, { useState, ReactElement, Fragment } from 'react';
import { DateTime } from 'luxon';
import DateSearch from '../DateSearch';
import { HealthcareService, Location, Practitioner } from 'fhir/r4';
import OfficeClosures from './OfficeClosures';
import ScheduleOverridesDialog from './ScheduleOverridesDialog';
import { ScheduleCapacity } from './ScheduleCapacity';
import { OVERRIDE_DATE_FORMAT, datesCompareFn } from '../../helpers/formatDateTime';
import { Closure, ScheduleExtension, DOW, Day, Overrides, ClosureType } from '../../types/types';
import { ChevronDown, Trash2 } from 'lucide-react';
import { ToastMessage }  from '../../pages/Schedule';

interface ScheduleOverridesProps {
  item: Location | Practitioner | HealthcareService;
  dayOfWeek: string;
  overrides: Overrides | undefined;
  closures: Closure[] | undefined;
  setItem: React.Dispatch<React.SetStateAction<Location | Practitioner | HealthcareService | undefined>>;
  setOverrides: React.Dispatch<React.SetStateAction<Overrides | undefined>>;
  setClosures: (closures: Closure[] | undefined) => void;
  updateItem: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  addToast: (message: string, type: ToastMessage['type']) => void;
}

export function ScheduleOverrides({
  item,
  setItem,
  overrides,
  closures,
  setOverrides,
  setClosures,
  updateItem,
  addToast,
}: ScheduleOverridesProps): ReactElement {
  const [isScheduleOverridesDialogOpen, setIsScheduleOverridesDialogOpen] = useState<boolean>(false);
  const [overridesOpen, setOverridesOpen] = React.useState<{ [index: string]: boolean }>({});
  

  const setToastWarning = (message: string): void => {
    addToast(message, 'Error');
  };

  const handleOverridesSave = (event: any): void => {
    event.preventDefault();

    // validate closures
    if (closures) {
      const startDates = closures.map((closure) => closure.start);
      const startDatesSet = new Set(startDates);
      if (startDates.length !== startDatesSet.size) {
        setToastWarning('Closed times cannot start on the same day');
        return;
      }

      for (const closure of closures) {
        if (
          closure.type === ClosureType.Period &&
          DateTime.fromFormat(closure.end, OVERRIDE_DATE_FORMAT) <
            DateTime.fromFormat(closure.start, OVERRIDE_DATE_FORMAT)
        ) {
          setToastWarning('Closed time end date must be after start date');
          return;
        }
      }
    }

    // confirm schedule changes before saving
    setIsScheduleOverridesDialogOpen(true);
  };

  const createOpenCloseSelectField = (type: 'Open' | 'Close', override: string): ReactElement => {
    return (
      <>
        <div className="relative w-full">
          <select
            id={type === 'Open' ? 'open' : 'close'}
            required
            value={type === 'Open' ? overrides?.[override].open : overrides?.[override].close}
            onChange={(e) => {
              const overridesTemp = { ...overrides };
              if (type === 'Open') {
                overridesTemp[override].open = Number(e.target.value);
              } else if (type === 'Close') {
                overridesTemp[override].close = Number(e.target.value);
              }
              setOverrides(overridesTemp);
            }}
            className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {type === 'Open' && <option value={0}>12:00 AM</option>}
            <option value={1}>1:00 AM</option>
            <option value={2}>2:00 AM</option>
            <option value={3}>3:00 AM</option>
            <option value={4}>4:00 AM</option>
            <option value={5}>5:00 AM</option>
            <option value={6}>6:00 AM</option>
            <option value={7}>7:00 AM</option>
            <option value={8}>8:00 AM</option>
            <option value={9}>9:00 AM</option>
            <option value={10}>10:00 AM</option>
            <option value={11}>11:00 AM</option>
            <option value={12}>12:00 PM</option>
            <option value={13}>1:00 PM</option>
            <option value={14}>2:00 PM</option>
            <option value={15}>3:00 PM</option>
            <option value={16}>4:00 PM</option>
            <option value={17}>5:00 PM</option>
            <option value={18}>6:00 PM</option>
            <option value={19}>7:00 PM</option>
            <option value={20}>8:00 PM</option>
            <option value={21}>9:00 PM</option>
            <option value={22}>10:00 PM</option>
            <option value={23}>11:00 PM</option>
            {type === 'Close' && <option value={24}>12:00 AM</option>}
          </select>
        </div>
      </>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleOverridesSave}>
          <div className="py-2 px-3 mt-4">
            {/* Schedule overrides title */}
            <h4 className="text-2xl font-bold text-primary-dark">
              Schedule Overrides
            </h4>

            {/* Schedule overrides subtext */}
            <p className="mt-2 text-black">
              One-time deviations from standing working hours. Any changes made will override the standard working hours
              set above for the date(s) selected.
            </p>

            {/* Schedule overrides table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="h-10">
                    <th className="font-bold w-[19%] text-left border-b border-gray-300 py-5 pl-5">Date</th>
                    <th className="font-bold w-[14%] text-left border-b border-gray-300 py-5 pl-5">Open</th>
                    <th className="font-bold w-[14%] text-left border-b border-gray-300 py-5 pl-5">Opening buffer</th>
                    <th className="font-bold w-[14%] text-left border-b border-gray-300 py-5 pl-5">Close</th>
                    <th className="font-bold w-[14%] text-left border-b border-gray-300 py-5 pl-5">Closing buffer</th>
                    <th className="font-bold w-[17%] text-left border-b border-gray-300 py-5 pl-5">Capacity</th>
                    <th className="font-bold w-[6%] text-left border-b border-gray-300 py-5 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {overrides &&
                    Object.keys(overrides)
                      .sort(datesCompareFn(OVERRIDE_DATE_FORMAT))
                      .map((override, index) => (
                        <React.Fragment key={`override-${index}`}>
                          <tr>
                            <td className="py-4 px-2 border-b border-gray-300 ">
                              <DateSearch
                                date={DateTime.fromFormat(override, 'D')}
                                setDate={(date) => {
                                  // ... existing date logic ...
                                }}
                                required
                                closeOnSelect
                                small
                              />
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300">
                              {createOpenCloseSelectField('Open', override)}
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300">
                              <div className="relative w-full">
                                <select
                                  id="opening-buffer"
                                  value={overrides[override].openingBuffer}
                                  onChange={(e) => {
                                    const overridesTemp = { ...overrides };
                                    overridesTemp[override].openingBuffer = Number(e.target.value);
                                    setOverrides(overridesTemp);
                                  }}
                                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value={0}>0 mins</option>
                                  <option value={15}>15 mins</option>
                                  <option value={30}>30 mins</option>
                                  <option value={60}>60 mins</option>
                                  <option value={90}>90 mins</option>
                                </select>
                              </div>
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300">
                              {createOpenCloseSelectField('Close', override)}
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300">
                              <div className="relative w-full">
                                <select
                                  id="closing-buffer"
                                  value={overrides[override].closingBuffer}
                                  onChange={(e) => {
                                    const overridesTemp = { ...overrides };
                                    overridesTemp[override].closingBuffer = Number(e.target.value);
                                    setOverrides(overridesTemp);
                                  }}
                                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                  <option value={0}>0 mins</option>
                                  <option value={15}>15 mins</option>
                                  <option value={30}>30 mins</option>
                                  <option value={60}>60 mins</option>
                                  <option value={90}>90 mins</option>
                                </select>
                              </div>
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300">
                              <button
                                type="button"
                                className="text-sm inline-flex items-center px-4 h-9 text-primary font-bold rounded-full hover:bg-gray-100"
                                onClick={() => {
                                  const overridesOpenTemp = { ...overridesOpen };
                                  overridesOpenTemp[override] = !overridesOpenTemp[override];
                                  setOverridesOpen(overridesOpenTemp);
                                }}
                              >
                                Override capacity
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </button>
                            </td>
                            <td className="py-4 px-2 border-b border-gray-300 text-center">
                              <button
                                type="button"
                                className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                                onClick={() => {
                                  const overridesTemp = { ...overrides };
                                  delete overridesTemp[override];
                                  setOverrides(overridesTemp);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>

                          {overridesOpen[override] && (
                            <tr>
                              <td colSpan={7}>
                                <ScheduleCapacity
                                  day={overrides[override]}
                                  setDay={(dayTemp: Day) => {
                                    overrides[override] = dayTemp;
                                  }}
                                  openingHour={overrides[override].open}
                                  closingHour={overrides[override].close}
                                  openingBuffer={overrides[override].openingBuffer}
                                  closingBuffer={overrides[override].closingBuffer}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Add new override button */}
            <button
              type="button"
              className="mt-5 px-4 py-2 border border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white"
              onClick={() => {
                const overridesTemp = { ...overrides };
                if (overridesTemp['override-new']) {
                  setToastWarning('Cannot have two overrides for the same day');
                } else {
                  overridesTemp['override-new'] = {
                    open: 8,
                    close: 17,
                    openingBuffer: 0,
                    closingBuffer: 0,
                    hours: [],
                  };
                }
                setOverrides(overridesTemp);
              }}
            >
              Add override rule
            </button>

            <OfficeClosures closures={closures} setClosures={setClosures} />

            {/* save changes and cancel buttons */}
            <div className="mt-5">
              <div className="mt-12 flex flex-row">
                <button
                  type="submit"
                  className="bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 h-9 font-bold bg-primary text-white disabled:opacity-50 text-center"
                >
                Save Changes
                </button>
              </div>
              <p className="mt-1">
                Please note if you save changes to Schedule Overrides or Closed Dates, edits to Working Hours will be
                saved too.
              </p>
            </div>
          </div>
        </form>
        <ScheduleOverridesDialog
          item={item}
          setItem={setItem}
          setIsScheduleOverridesDialogOpen={setIsScheduleOverridesDialogOpen}
          // handleClose={() => setIsScheduleOverridesDialogOpen(false)}
          open={isScheduleOverridesDialogOpen}
          updateItem={updateItem}
        />
      </div>
    </>
  );
}

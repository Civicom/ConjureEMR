import { ReactElement } from 'react';
import { Closure, ClosureType } from '../../types/types';
import DateSearch from '../DateSearch';
import { DateTime } from 'luxon';
import { OVERRIDE_DATE_FORMAT } from '../../helpers/formatDateTime';
import { Trash2 } from 'lucide-react';

interface OfficeClosuresProps {
  closures: Closure[] | undefined;
  setClosures: (closures: Closure[] | undefined) => void;
}

export default function OfficeClosures({ closures, setClosures }: OfficeClosuresProps): ReactElement {
  function handleUpdateClosures(index: number, newClosure: Closure): void {
    const newClosures: Closure[] | undefined = closures?.map((closureTemp, indexTemp) => {
      if (index === indexTemp) {
        return newClosure;
      } else {
        return closureTemp;
      }
    });
    setClosures(newClosures);
  }

  return (
    <>
      <div className="mt-5">
        <h4 className="mt-5 text-2xl font-bold text-primary-dark">
          Closed Dates
        </h4>
        
        <div className="mt-3 overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="h-10">
                <th className="text-left border-b border-gray-300 py-5 pl-5">Type</th>
                <th className="text-left border-b border-gray-300 py-5 pl-5">Start Date</th>
                <th className="text-left border-b border-gray-300 py-5 pl-5">End Date</th>
                <th className="font-bold w-[6%] text-left border-b border-gray-300 py-5 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {closures &&
                closures
                  .sort((d1: Closure, d2: Closure): number => {
                    return (
                      DateTime.fromFormat(d1.start, OVERRIDE_DATE_FORMAT).toSeconds() -
                      DateTime.fromFormat(d2.start, OVERRIDE_DATE_FORMAT).toSeconds()
                    );
                  })
                  .map((closure, index) => (
                    <tr key={`closure-${index}`}>
                      <td className="py-4 px-2 border-b border-gray-300">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`one-day-${index}`}
                              name={`closureType-${index}`}
                              value={ClosureType.OneDay}
                              checked={closure.type === ClosureType.OneDay}
                              onChange={(e) => {
                                handleUpdateClosures(index, {
                                  start: closure.start,
                                  end: e.target.value === ClosureType.OneDay ? '' : closure.end,
                                  type: e.target.value,
                                } as Closure);
                              }}
                              className="appearance-none h-4 w-4 checked:bg-red-500 checked:hover:bg-red-500 checked:active:bg-red-500 checked:focus:bg-red-500 focus:bg-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-gray-300 rounded-full"
                              required
                            />
                            <label htmlFor={`one-day-${index}`} className="text-sm">
                              One day
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`period-${index}`}
                              name={`closureType-${index}`}
                              value={ClosureType.Period}
                              checked={closure.type === ClosureType.Period}
                              onChange={(e) => {
                                handleUpdateClosures(index, {
                                  start: closure.start,
                                  end: e.target.value === ClosureType.OneDay ? '' : closure.end,
                                  type: e.target.value,
                                } as Closure);
                              }}
                              className="appearance-none h-4 w-4 checked:bg-red-500 checked:hover:bg-red-500 checked:active:bg-red-500 checked:focus:bg-red-500 focus:bg-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-gray-300 rounded-full"
                              required
                            />
                            <label htmlFor={`period-${index}`} className="text-sm">
                              Period
                            </label>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 border-b border-gray-300">
                        <DateSearch
                          date={DateTime.fromFormat(closure.start, OVERRIDE_DATE_FORMAT)}
                          setDate={(date) => {
                            handleUpdateClosures(index, {
                              start: date?.toFormat(OVERRIDE_DATE_FORMAT) ?? '',
                              end: closure.end,
                              type: closure.type,
                            });
                          }}
                          required
                          closeOnSelect
                          small
                        />
                      </td>
                      <td className="py-4 px-2 border-b border-gray-300">
                        <DateSearch
                          date={closure.end ? DateTime.fromFormat(closure.end, OVERRIDE_DATE_FORMAT) : null}
                          required={closure.type === ClosureType.Period}
                          disabled={closure.type === ClosureType.OneDay}
                          disableDates={(day: DateTime) =>
                            day <= DateTime.fromFormat(closure.start, OVERRIDE_DATE_FORMAT)
                          }
                          setDate={(date) => {
                            handleUpdateClosures(index, {
                              start: closure.start,
                              end: date?.toFormat(OVERRIDE_DATE_FORMAT) ?? '',
                              type: closure.type,
                            });
                          }}
                          closeOnSelect
                          small
                        />
                      </td>
                      <td className="py-4 px-2 border-b border-gray-300 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const deleteIndex = closures.indexOf(closure);
                            const closuresDeepClone: Closure[] = JSON.parse(JSON.stringify(closures));
                            closuresDeepClone.splice(deleteIndex, 1);
                            setClosures(closuresDeepClone);
                          }}
                          className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={() => {
            const defaultClosure = { start: '', end: '', type: ClosureType.OneDay };
            setClosures([...(closures ?? []), defaultClosure]);
          }}
          className="mt-5 px-4 py-2 border border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white"
        >
          Add closed date
        </button>

        <p className="mt-5 text-sm text-gray-600">
          This override should be utilized when the facility is closed for the whole day and will not be opening at all.
        </p>
      </div>
    </>
  );
}

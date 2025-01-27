import { useState, ChangeEvent, ReactElement, useEffect, useMemo } from "react"
import { Search, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { HealthcareService, Location, Practitioner, Resource } from 'fhir/r4';
import { formatAddress, formatHumanName } from '@zapehr/sdk';
import { useApiClients } from '../../hooks/useAppClients';
import { Closure, ClosureType, ScheduleExtension } from '../../types/types';


import { DateTime } from 'luxon';
import { OVERRIDE_DATE_FORMAT } from '../../helpers/formatDateTime';

export type ScheduleType = 'office' | 'provider' | 'group';

interface ScheduleInformationTableProps {
  scheduleType: ScheduleType;
}

const SCHEDULE_CHANGES_FORMAT = 'MMM d';

// Define the interface for your data
interface ScheduleItem {
  id: string
  name: string
  address: string
  todaysHours: string
  upcomingChanges: string
}

export function getName(item: Resource): string {
    let name = undefined;
    if (item.resourceType === 'Location') {
    name = (item as Location)?.name;
    } else if (item.resourceType === 'Practitioner') {
    const nameTemp = (item as Practitioner)?.name;
    if (nameTemp) {
        name = formatHumanName(nameTemp[0]);
    }
    } else if (item.resourceType === 'HealthcareService') {
    name = (item as HealthcareService)?.name;
    } else {
    console.log('getName called with unavailable resource', item);
    throw Error('getName called with unavailable resource');
    }

    if (!name) {
    return 'Undefined name';
    }
    return name;  
}

type Item = Location | Practitioner;

export const ScheduleTable = ({ scheduleType }: ScheduleInformationTableProps): ReactElement => {
    const [searchQuery, setSearchQuery] = useState<string>("")

    const { fhirClient } = useApiClients();
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [pageNumber, setPageNumber] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [items, setItems] = useState<Location[] | Practitioner[] | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
        
    useEffect(() => {
        async function getItems(schedule: 'Location' | 'Practitioner' | 'HealthcareService'): Promise<void> {
        if (!fhirClient) {
            return;
        }
        setLoading(true);
        const itemsTemp = (await fhirClient.searchResources<Item>({
            resourceType: schedule,
            searchParams: [{ name: '_count', value: '1000' }],
        })) as any;
        setItems(itemsTemp);
        setLoading(false);
        }
        if (scheduleType === 'office') {
        void getItems('Location');
        } else if (scheduleType === 'provider') {
        void getItems('Practitioner');
        } else if (scheduleType === 'group') {
        void getItems('HealthcareService');
        }
    }, [fhirClient, scheduleType]);

    const filteredItems = useMemo(() => {
        if (!items) {
        return [];
        }
        const filtered = (items as Item[]).filter((item: Item) =>
        getName(item).toLowerCase().includes(searchText.toLowerCase()),
        );

        const combinedItems = filtered.map((item: Item) => ({
        ...item,
        combined: getName(item),
        }));

        combinedItems.sort((a: any, b: any) => a.combined.localeCompare(b.combined));

        return combinedItems;
    }, [items, searchText]);

    // For pagination, only include the rows that are on the current page
    const pageItems = useMemo(
        () =>
        filteredItems.slice(
            pageNumber * rowsPerPage, // skip over the rows from previous pages
            (pageNumber + 1) * rowsPerPage, // only show the rows from the current page
        ),
        [pageNumber, filteredItems, rowsPerPage],
    );


    // Your existing data structure
    const scheduleData: ScheduleItem[] = [
    {
        id: "1",
        name: "Main Office",
        address: "123 Main St, City, State",
        todaysHours: "9:00 AM - 5:00 PM",
        upcomingChanges: "None Scheduled",
    },
    // Add more items as needed
    ]

    const filteredData = scheduleData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    }

    const handleChangePage = (event: unknown, newPageNumber: number): void => {
        setPageNumber(newPageNumber);
      };
    
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageNumber(0);
    };
    
    const handleChangeSearchText = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): void => {
    setSearchText(event.target.value);
    };

    const getHoursOfOperationForToday = (item: Item, time: 'open' | 'close'): any => {
        const dayOfWeek = DateTime.now().toLocaleString({ weekday: 'long' }).toLowerCase();
        const extensionSchedule = item.extension?.find(
        (extensionTemp) => extensionTemp.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
        )?.valueString;

        if (!extensionSchedule) {
        return undefined;
        }

        const scheduleTemp = JSON.parse(extensionSchedule);
        const scheduleDays = scheduleTemp.schedule;
        const scheduleDay = scheduleDays[dayOfWeek];
        let open: number = scheduleDay.open;
        let close: number = scheduleDay.close;
        const scheduleOverrides = scheduleTemp.scheduleOverrides;
        if (scheduleTemp.scheduleOverrides) {
        for (const dateKey in scheduleOverrides) {
            if (Object.hasOwnProperty.call(scheduleOverrides, dateKey)) {
            const date = DateTime.fromFormat(dateKey, OVERRIDE_DATE_FORMAT).toISODate();
            const todayDate = DateTime.local().toISODate();
            if (date === todayDate) {
                open = scheduleOverrides[dateKey].open;
                close = scheduleOverrides[dateKey].close;
            }
            }
        }
        }
        let returnTime;
        if (time === 'open') {
        return `${(open % 12 === 0 ? 12 : open % 12).toString().padStart(2, '0')}:00 ${open < 12 || open === 24 ? 'AM' : 'PM'}`;
        } else {
        return `${(close % 12 === 0 ? 12 : close % 12).toString().padStart(2, '0')}:00 ${close < 12 || close == 24 ? 'AM' : 'PM'}`;
        }
    };

    const validateClosureDates = (closureDates: string[], closure: Closure): string[] => {
        const today = DateTime.now().startOf('day');
        const startDate = DateTime.fromFormat(closure.start, OVERRIDE_DATE_FORMAT);
        if (!startDate.isValid) {
            return closureDates;
        }

        if (closure.type === ClosureType.OneDay) {
            if (startDate >= today) {
            closureDates.push(startDate.toFormat(SCHEDULE_CHANGES_FORMAT));
            }
        } else if (closure.type === ClosureType.Period) {
            const endDate = DateTime.fromFormat(closure.end, OVERRIDE_DATE_FORMAT);
            if (startDate >= today || endDate >= today) {
            closureDates.push(
                `${startDate.toFormat(SCHEDULE_CHANGES_FORMAT)} - ${endDate.toFormat(SCHEDULE_CHANGES_FORMAT)}`,
            );
            }
        }
        return closureDates;
    };
    
    const validateOverrideDates = (overrideDates: string[], date: string): string[] => {
        const luxonDate = DateTime.fromFormat(date, OVERRIDE_DATE_FORMAT);
        if (luxonDate.isValid && luxonDate >= DateTime.now().startOf('day')) {
            overrideDates.push(luxonDate.toFormat(SCHEDULE_CHANGES_FORMAT));
        }
        return overrideDates;
    };
    
    function getItemOverrideInformation(item: Item): string | undefined {
        const extensionTemp = item.extension;
        const extensionSchedule = extensionTemp?.find(
          (extensionTemp) => extensionTemp.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
        )?.valueString;
    
        if (extensionSchedule) {
          const { scheduleOverrides, closures } = JSON.parse(extensionSchedule) as ScheduleExtension;
          const overrideDates = scheduleOverrides ? Object.keys(scheduleOverrides).reduce(validateOverrideDates, []) : [];
          const closureDates = closures ? closures.reduce(validateClosureDates, []) : [];
          const allDates = [...overrideDates, ...closureDates].sort((d1: string, d2: string): number => {
            // compare the single day or the first day in the period
            const startDateOne = d1.split('-')[0];
            const startDateTwo = d2.split('-')[0];
            return (
              DateTime.fromFormat(startDateOne, SCHEDULE_CHANGES_FORMAT).toSeconds() -
              DateTime.fromFormat(startDateTwo, SCHEDULE_CHANGES_FORMAT).toSeconds()
            );
          });
          const scheduleChangesSet = new Set(allDates);
          const scheduleChanges = Array.from(scheduleChangesSet);
          return scheduleChanges.length ? scheduleChanges.join(', ') : undefined;
        }
        return undefined;
    }

  return (
    <>
        <div className="w-full mt-6">
            <div className="flex items-center gap-4 my-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    id={`search-${scheduleType}`}
                    placeholder="Search offices..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-8 max-w-sm"
                    />
                </div>
                <Link to={`/schedule/${scheduleType}/add`} className="flex items-center gap-2">
                    <Button className="flex items-center font-bold capitalize bg-[#D3455B] hover:bg-[#b52b40] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add {scheduleType}
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table className="">
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead className="w-[25%] font-light capitalize">{scheduleType} Name</TableHead>
                            <TableHead className="w-[25%] font-light">Address/State</TableHead>
                            <TableHead className="w-[25%] font-light">Today's Hours</TableHead>
                            <TableHead className="w-[25%] font-light">Upcoming Schedule Changes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageItems.map((item: Item) => (
                            <TableRow key={item.id} className="bg-white">
                            <TableCell>
                                <Link 
                                to={`/schedule/office/${item.id}`}
                                className="text-[#D3455B] hover:text-[#b52b40] hover:underline font-bold"
                                >
                                {getName(item)}
                                </Link>
                            </TableCell>
                            <TableCell>
                                {item.resourceType === 'Location'
                                ? item.address && formatAddress(item.address)
                                : (item.address ? formatAddress(item.address[0]) : 'No address')}
                            </TableCell>
                            <TableCell>
                                {getHoursOfOperationForToday(item, 'open') && getHoursOfOperationForToday(item, 'close')
                                ? `${getHoursOfOperationForToday(item, 'open')} -
                                            ${getHoursOfOperationForToday(item, 'close')}`
                                : 'No scheduled hours'}</TableCell>
                            <TableCell>
                                <span className={`${getItemOverrideInformation(item) ? "text-black" : "text-muted-foreground"}`}>
                                    {getItemOverrideInformation(item) ? getItemOverrideInformation(item) : 'None Scheduled'}
                                </span>
                            </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    </>
  )
};
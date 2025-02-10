import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Patient, RelatedPerson } from 'fhir/r4';
import { convertFhirNameToDisplayName, getLatestAppointment, standardizePhoneNumber } from '../../../../../ehr-utils';
import { useApiClients } from '../../hooks/useAppClients';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { formatISODateToLocaleDate } from '@/helpers/formatDateTime';
import { Skeleton } from '@/components/ui/skeleton';

const formatDateString = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
};

export const columns: ColumnDef<Patient>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        // className="border-[#D3455B] data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        // className="border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      const initials = getInitials(name);

      return (
        <Link to={`/patient/${row.original.id}`} className="text-black flex items-center gap-4 hover:text-[#b52b40] hover:underline hover:text-[#b52b40]">
          {/* <Avatar className="w-8 h-8">
            <AvatarImage src={`https://randomuser.me/api/portraits/med/men/${Math.floor(Math.random() * 100)}.jpg`} />
            <AvatarFallback className="text-red-500 text-l font-bold">{initials}</AvatarFallback>
          </Avatar> */}
          <div className="p-1 w-fit h-fit bg-[#F6DADE] text-[#D3455B] flex items-center justify-center rounded-full font-bold">
              {initials}
          </div>


          <span className="text-[#D3455B]  font-bold">{name}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: 'dob',
    header: 'Date of Birth',
    cell: ({ row }) => {
      // const date = new Date(row.getValue('dob'));
      // return <div>{date.toLocaleDateString()}</div>;
      const dateStr = row.getValue('dob') as string;
      return <div>{formatDateString(dateStr)}</div>;
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'lastVisit',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Last Visit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastVisit = row.getValue('lastVisit') as string;
      return lastVisit ? (
        <div className="flex items-center">
          <div>{formatISODateToLocaleDate(lastVisit)}</div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-black/40"> No visits </div>
      );
    },
  },
  {
    accessorKey: 'lastOffice',
    header: 'Last Office',
    cell: ({ row }) => {
      const lastOffice = row.getValue('lastOffice') as string;
      return lastOffice ? <div>{lastOffice}</div> : <div>No office</div>;
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const patient = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {/* <DropdownMenuItem onClick={() => navigator.clipboard.writeText(patient.id)}> */}
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(patient.id ?? '')}>
              Copy patient ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to={`/patient/${row.original.id}`} className="text-black">
                View patient details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to={`/patient/${row.original.id}`} className="text-black">
                View medical history
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface PatientsTableProps {
  fhirPatients: Patient[] | null;
  relatedPersons: RelatedPerson[] | null;
  total: number;
  patientsLoading: boolean;
}

interface PatientRow {
  id: string | undefined;
  patient: string | undefined;
  dateOfBirth: string | undefined;
  phone: string | undefined;
  lastVisit?: string;
  lastOffice?: string;
}

export function PatientTable({ fhirPatients, relatedPersons, total, patientsLoading }: PatientsTableProps) {
  const { fhirClient } = useApiClients();

  const [patientRows, setPatientRows] = useState<PatientRow[] | null>(null);
  const [rowsLoading, setRowsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function setPatientRowInfo(fhirPatients: Patient[] | null): Promise<void> {
      if (!fhirPatients) {
        setPatientRows(null);
        return;
      }

      setRowsLoading(true);

      // Get latest appointments for all patients in parallel
      const appointmentPromises = fhirPatients.map((patient) => getLatestAppointment(fhirClient!, patient.id!));

      const appointments = await Promise.all(appointmentPromises);

      // console.log(appointments);

      // Map patient info with their appointments
      const patientInfo = fhirPatients.map((fhirPatient, index) => {
        const latestAppointment = appointments[index];

        // Find the Location resource specifically among included resources
        const locationResource = latestAppointment?.includedResources.find(
          (resource) => resource.resourceType === 'Location',
        );

        console.group('Patient Info');
        console.log('Location:', locationResource);
        console.log('Appointment:', latestAppointment);
        console.groupEnd();

        return {
          id: fhirPatient.id,
          patient: fhirPatient.name && convertFhirNameToDisplayName(fhirPatient.name[0]),
          dateOfBirth: fhirPatient.birthDate,
          phone: standardizePhoneNumber(
            relatedPersons
              ?.find((rp) => rp.patient.reference === `Patient/${fhirPatient.id}`)
              ?.telecom?.find((telecom) => telecom.system === 'phone')?.value,
          ),
          lastVisit: latestAppointment?.appointment.start,
          // lastOffice: latestAppointment?.includedResources[0]?.name || '',
          // TODO: Fix issue with includedResources[0] not being a Location
          // TODO: Fix issue with lastOffice not being populated
          lastOffice: locationResource && 'name' in locationResource ? locationResource.name : '',
        };
      });

      setRowsLoading(false);
      // setPatientRows(patientInfo);
      setPatientRows(patientInfo as PatientRow[]);
    }

    setPatientRowInfo(fhirPatients)
      .catch((error) => console.log(error))
      .finally(() => setRowsLoading(false));
  }, [fhirClient, fhirPatients, relatedPersons]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const tableData = React.useMemo(() => {
    if (!patientRows) return [];

    return patientRows.map((row) => ({
      id: row.id || '',
      name: row.patient || '',
      dob: row.dateOfBirth || '',
      phone: row.phone || '',
      lastVisit: row.lastVisit || '',
      lastOffice: row.lastOffice || '',
    }));
  }, [patientRows]);
  const table = useReactTable({
    data: tableData as unknown as Patient[], // Convert to unknown first to avoid type error
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const isLoading = rowsLoading || patientsLoading;

  /** TEST: Fetcing latest appointment for a patient  */
  // useEffect(() => {
  //   async function fetchLatestAppointment() {
  //     if (fhirClient && fhirPatients?.[0]?.id) {
  //       const appointment = await getLatestAppointment(fhirClient, '022644bd-38c0-4c79-a6be-eaf27c879ebc');
  //       console.log('Latest appointment:', appointment);
  //       console.log('Latest visit:', formatISODateToLocaleDate(appointment?.appointment.start));
  //       console.log('Latest office:', appointment?.includedResources[0]?.name);
  //     }
  //   }

  //   fetchLatestAppointment().catch(console.error);
  // }, [fhirClient, fhirPatients]);

  return (
    <div className="w-full ">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          className="max-w-[200px]"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>

            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <TableBody>
      {[...Array(10)].map((row) => (
        <TableRow key={row}>
          <TableCell>
            <Skeleton className="my-1 bg-gray-200 h-5 w-5" />
          </TableCell>
          {[...Array(5)].map((cell) => (
            <TableCell key={cell}>
              <Skeleton
                className="bg-gray-200 h-5"
                style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 100}px` }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

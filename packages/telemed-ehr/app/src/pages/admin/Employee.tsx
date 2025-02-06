import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronDown, MoreHorizontal, PlusIcon } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { formatISODateToLocaleDate } from '@/helpers/formatDateTime';
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
import { Table, TableCell, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { EmployeeDetails, GetEmployeesResponse } from '../../types/types';
import { useApiClients } from '../../hooks/useAppClients';
import { getEmployees } from '../../api/api';
import { useQuery } from 'react-query';

interface EmployeeFilter {
  provider: boolean;
  text: string;
}

export const columns: ColumnDef<EmployeeDetails>[] = [{
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
        <div className="text-black flex items-center gap-4">
          <Avatar className="w-8 h-8">
            {/* <AvatarImage
              src={`https://randomuser.me/api/portraits/med/men/${Math.floor(Math.random() * 100)}111.jpg`}
            /> */}
            <AvatarFallback className="bg-blue-50 text-black">{initials}</AvatarFallback>
          </Avatar>

          <span className="font-bold">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return <div>{email || '@'}</div>;
    },
  },
  // {
  //   accessorKey: 'phone',
  //   header: 'Phone',
  // },
  {
    accessorKey: 'lastLogin',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Last Login
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastLogin = row.getValue('lastLogin') as string;
      return lastLogin ? (
        <div className="flex items-center">
          <div>{formatISODateToLocaleDate(lastLogin)}</div>
        </div>
      ) : (
        <div className="flex text-black/40">Never logged in</div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge variant="outline">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
            {/* <Badge className={status === 'Active' ? 'bg-teal-500 hover:bg-teal-500' : 'bg-red-500 hover:bg-red-500'}> */}
            {status}
          </div>
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(employee.id)}>
              Copy employee ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View employee details</DropdownMenuItem>
            <DropdownMenuItem>Edit employee</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const EmployeesPage = () => {

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [filter, setFilter] = React.useState<EmployeeFilter>({provider: false, text: '',});
  const [employees, setEmployees] = React.useState<EmployeeDetails[]>([]);

  const { zambdaClient } = useApiClients();
  const { isFetching } = useQuery(
    ['get-employees', { zambdaClient }],
    () => (zambdaClient ? getEmployees(zambdaClient) : null),
    {
      onSuccess: (response: GetEmployeesResponse) => {
        setEmployees(response?.employees ?? []);
      },
      enabled: !!zambdaClient,
    },
  );

  const tableData = React.useMemo(() => {

    const filteredEmployees = employees.filter((employee: EmployeeDetails) => {


      const filterText = filter.text.toLowerCase();
      const name: string = employee.name.toLowerCase();
      const email: string = employee.email.toLowerCase();

      if (filter.text && !name.includes(filterText) && !email.includes(filterText)) return false;
      if (filter.provider && !employee.isProvider) return false;

      return true;
    });

    return filteredEmployees;

  }, [employees, filter]);

  const table = useReactTable({
    data: tableData, // Use the transformed data instead of static data
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

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <Input placeholder="Name or Email" value={filter.name} onChange={
            (event: React.ChangeEvent<HTMLInputElement> ) => {
              setFilter({ ...filter, text: event.target.value })
            }
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Filter <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={filter.provider} onCheckedChange={
              (value: boolean) => setFilter({ ...filter, provider: value })
            }>Provider</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
 
        <Link to="/admin/employee/new">
          <Button className="flex items-center bg-red-500 hover:bg-red-600 font-bold">
            <PlusIcon className="w-4 h-4" />Add Employee
          </Button>
        </Link>

      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <Link to={`/admin/employee/${row.original.id}`} className="block -m-4 p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Link>
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
};

export default EmployeesPage;

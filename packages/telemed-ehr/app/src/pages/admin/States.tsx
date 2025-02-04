import * as React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, useReactTable, } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BooleanStateChip } from '@/telemed/components/BooleanStateChip';
import { Checkbox } from '@/components/ui/checkbox';
import { AllStates, AllStatesToNames, State, StateType } from '@/types/types';
import { useStatesQuery } from '@/telemed/features/telemed-admin/telemed-admin.queries';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type StateDetails = {
  state: StateType;
  name: string;
  abbreviation: string;
  operateInState: boolean;
}

export const columns: ColumnDef<StateDetails>[] = [{
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
    accessorKey: 'state',
    header: 'State',
    cell: ( { row }) => {
      const stateDetail : StateDetails = row.original;
      return (
        <div className="text-black flex items-center gap-4">
          <span className="font-bold">{stateDetail.abbreviation} - {stateDetail.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'operateInState',
    header: 'Operate In State',
    cell: ( { row }) => {
      const stateDetail : StateDetails = row.original;
      return (
        <div className="text-black flex items-center gap-4">
          <BooleanStateChip state={stateDetail.operateInState} label={stateDetail.operateInState ? 'Yes' : 'No'} />
        </div>
      );
    },
  },
];

export default function StatesPage() {
  const [rowSelection, setRowSelection] = React.useState({});
  const { data, isFetching } = useStatesQuery();

  const statesData: StateDetails[] = React.useMemo(() => {
    return AllStates.map((state: State) => {

      const stateLocations = data || [];
      const stateLocation = stateLocations.find((location) => location.address?.state === state.value);
      const operatesInState = Boolean(stateLocation && stateLocation.status === 'active');

      const stateDetail : StateDetails = {
        state: state.value as StateType,
        name: AllStatesToNames[state.value as StateType],
        abbreviation: state.label,
        operateInState: operatesInState,
      };
      return stateDetail;
    });
  }, [data]);

  const table = useReactTable({
    data: statesData, // Use the transformed data instead of static data
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="w-full">
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
                        <Link to={`/admin/state/${row.original.state}`} className="block -m-4 p-4">
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
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
};

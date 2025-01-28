import * as React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, useReactTable, } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';

import { BooleanStateChip } from '@/telemed/components/BooleanStateChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
  
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { InsurancePlan } from 'fhir/r4';
import { useInsurancesQuery } from '@/telemed/features/telemed-admin/telemed-admin.queries';

type PlanStatus = ('draft'|'active'|'retired'|'unknown') | undefined;

interface InsuranceFilter {
    status: PlanStatus;
    text: string;
}

export const columns: ColumnDef<InsurancePlan>[] = [{
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
    }, {
        accessorKey: 'name',
        header: 'Name',
        cell: ( { row }) => {
            const insurancePlan : InsurancePlan = row.original;
            return (
                <div className="text-black flex items-center gap-4">
                    <span className="font-bold">{insurancePlan.name}</span>
                </div>
            );
        },
    }, {
        accessorKey: 'status',
        header: 'Status',
        cell: ( { row }) => {
            const insurancePlan : InsurancePlan = row.original;
            return (
                <div className="text-black flex items-center gap-4">
                    <BooleanStateChip state={insurancePlan.status === 'active'} label={insurancePlan.status??'Unknown'} />
                </div>
            );
        },
    },
];

export default function InsurancePage() {
    const [rowSelection, setRowSelection] = React.useState({});
    const [filter, setFilter] = React.useState<InsuranceFilter>({status: undefined, text: '',});
    const { data, isFetching } = useInsurancesQuery();

    const tableData : InsurancePlan[] = React.useMemo<InsurancePlan[]>(() => {

        return data?.filter((insurancePlan: InsurancePlan) => {

            const filterText : string = filter.text.toLowerCase();
            const name: string = (insurancePlan.name ?? '').toLowerCase();
            if (filterText && !name.includes(filterText)) return false;
            if (filter.status && insurancePlan.status !== filter.status) return false;
            
            return true;
        }) || [];

    }, [data, filter]);

    const table = useReactTable({
        data: tableData, // Use the transformed data instead of static data
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
            <div className="flex items-center gap-2 py-4">
                <Input placeholder="Insurance Name" value={filter.text} onChange={
                    (event: React.ChangeEvent<HTMLInputElement> ) => {
                        setFilter({ ...filter, text: event.target.value })
                    }
                } />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Filter <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuRadioGroup value={filter.status ?? ''} onValueChange={(value) => setFilter({ ...filter, status: value as PlanStatus})}>
                            <DropdownMenuRadioItem value=''>Any</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value='active'>Active</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value='retired'>Retired</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value='draft'>Draft</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value='unknown'>Unknown</DropdownMenuRadioItem>  
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

 
                <Link to="/telemed-admin/insurances/new">
                <Button className="flex items-center bg-red-500 hover:bg-red-600 font-bold">
                    <PlusIcon className="w-4 h-4" />Add Insurance
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
                                            <Link to={`/admin/insurance/${row.original.id}`} className="block -m-4 p-4">
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
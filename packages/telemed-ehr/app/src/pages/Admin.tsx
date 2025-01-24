import { default as React, ReactElement, useState } from 'react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import EmployeesTable from '@/shadcn/components/EmployeesTable';
import useOttehrUser, { OttehrUser } from '../hooks/useOttehrUser';
import { RoleType } from '@/types/types';

export default function AdminPage(): ReactElement {
    
    const user = useOttehrUser();
    if (!user?.hasRole([RoleType.Administrator])) {
        //navigate('/');
    }
    return (
        <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
            <div className="space-y-8">
            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="employees" className="flex justify-center text-center">Employees</TabsTrigger>
                    <TabsTrigger value="insurance" className="flex justify-center text-center">Insurance</TabsTrigger>
                    <TabsTrigger value="states" className="flex justify-center text-center">States</TabsTrigger>
                    <TabsTrigger value="settings" className="flex justify-center text-center">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="employees" className="my-8"><EmployeesTable /></TabsContent>
            </Tabs>
            </div>
        </div>
    );
}
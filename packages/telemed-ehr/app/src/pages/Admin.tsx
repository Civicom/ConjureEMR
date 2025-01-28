import { default as React, ReactElement } from 'react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import useOttehrUser, { OttehrUser } from '../hooks/useOttehrUser';
import { RoleType } from '@/types/types';
import EmployeesPage from '@/pages/admin/Employees';
import StatesPage from '@/pages/admin/States';
import InsurancePage from '@/pages/admin/Insurance';

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
                <TabsContent value="employees" className="my-8"><EmployeesPage /></TabsContent>
                <TabsContent value="insurance" className="my-8"><InsurancePage /></TabsContent>
                <TabsContent value="states" className="my-8"><StatesPage /></TabsContent>
            </Tabs>
            </div>
        </div>
    );
}
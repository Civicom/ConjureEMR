import { default as React, ReactElement, useState } from 'react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import EmployeesTable from '@/shadcn/components/EmployeesTable';
import useOttehrUser, { OttehrUser } from '../hooks/useOttehrUser';
import { RoleType } from '@/types/types';
import { BriefcaseBusiness, UserPen, MapPinned, Settings } from 'lucide-react';
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
                        <TabsTrigger value="employees" className="flex justify-center text-center">
                            <div className="flex flex-col">
                                <UserPen className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
                                <p className="text-[16px] font-semibold text-[#4b5c6b]">Employees</p>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="insurance" className="flex justify-center text-center">
                            <div className="flex flex-col">
                                <BriefcaseBusiness className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
                                <p className="text-[16px] font-semibold text-[#4b5c6b]">Insurance</p>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger value="states" className="flex justify-center text-center">
                            <div className="flex flex-col">
                                <MapPinned className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
                                <p className="text-[16px] font-semibold text-[#4b5c6b]">States</p>
                            </div>                            
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex justify-center text-center">
                            <div className="flex flex-col">
                                <Settings className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
                                <p className="text-[16px] font-semibold text-[#4b5c6b]">Settings</p>
                            </div>                                   
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="employees" className="my-8"><EmployeesTable /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
import { default as React, ReactElement } from 'react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import useOttehrUser, { OttehrUser } from '../../hooks/useOttehrUser';
import { RoleType } from '@/types/types';
import EmployeesPage from '@/pages/admin/Employee';
import StatesPage from '@/pages/admin/States';
import InsurancePage from '@/pages/admin/Insurance';
import PageContainer from '@/layout/PageContainer';
import { Breadcrumbs } from './components/Breadcrumbs';


const getDefaultTab = () => {
    if (location.pathname.includes("/admin/employee")) return "employee";
    if (location.pathname.includes("/admin/insurance")) return "insurance";
    if (location.pathname.includes("/admin/state")) return "state";
    if (location.pathname.includes("/admin/settings")) return "settings";
    return "employee";
  };


export default function AdminPage(): ReactElement {
    
    const user = useOttehrUser();
    if (!user?.hasRole([RoleType.Administrator])) {
        //navigate('/');
    }
    return (
        <PageContainer tabTitle={'Admin'}>
            <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
                <div className="space-y-8">
                    <Tabs defaultValue={getDefaultTab()} className="w-full">
                        <TabsList className="w-full">

                            <TabsTrigger value="employee" className="flex justify-center text-center">Employees</TabsTrigger>
                            <TabsTrigger value="insurance" className="flex justify-center text-center">Insurance</TabsTrigger>
                            <TabsTrigger value="state" className="flex justify-center text-center">States</TabsTrigger>
                            {/* <TabsTrigger value="settings" className="flex justify-center text-center">Settings</TabsTrigger> */}
                        </TabsList>
                        <TabsContent value="employee" className="my-8"><EmployeesPage /></TabsContent>
                        <TabsContent value="insurance" className="my-8"><InsurancePage /></TabsContent>
                        <TabsContent value="state" className="my-8"><StatesPage /></TabsContent>
                    </Tabs>
                </div>
            </div>
        </PageContainer>
    );
}
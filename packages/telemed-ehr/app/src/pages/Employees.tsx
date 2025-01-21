import { default as React, ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, PlusIcon } from 'lucide-react';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import EmployeesTable from '@/shadcn/components/EmployeesTable';

enum PageTab {
  employees = 'employees',
  providers = 'providers',
}

export default function EmployeesPage(): ReactElement {
 
  /* TODO: Create own recyclable page container component */
  return (
      <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
        <div className="space-y-8">
          {/* Heading */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Employees</h1>
              <p className="text-md text-muted-foreground">View and manage doctors and providers</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Download className="w-4 h-4" /> Export
              </Button>
              <Link to="/employees/add">
                <Button className="flex items-center bg-teal-500 hover:bg-teal-600 font-bold">
                  <PlusIcon className="w-4 h-4" />
                  Add Employee
                </Button>
              </Link>
            </div>
          </div>
          <Tabs defaultValue="employees" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="employees" className="flex justify-center text-center">
                Employees
              </TabsTrigger>
            </TabsList>
            <TabsContent value="employees" className="my-8">
              <EmployeesTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}

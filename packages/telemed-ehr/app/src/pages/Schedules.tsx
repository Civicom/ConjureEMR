import { Box, Tab } from '@mui/material';
import { ReactElement, useState } from 'react';
import PageContainer from '../layout/PageContainer';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { ScheduleInformation } from '../components/ScheduleInformation';

// Shadcn
import { ChangeEvent } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
// import { Download, PlusIcon } from 'lucide-react';
// import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ScheduleTable } from '@/components/schedule/ScheduleTable';

// demo data for table
interface Person {
  id: string
  name: string
  email: string
  role: string
  status: "Active" | "Inactive"
}
const demoData: Person[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Developer",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Designer",
    status: "Active",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Manager",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "Developer",
    status: "Active",
  },
  {
    id: "5",
    name: "Charlie Wilson",
    email: "charlie@example.com",
    role: "Designer",
    status: "Inactive",
  },
]

function a11yProps(index: number): { id: string; 'aria-controls': string } {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function LocationsPage(): ReactElement {
  const [tab, setTab] = useState<string>('0');


  // table start
  const [searchQuery, setSearchQuery] = useState<string>("")

  const filteredData = demoData.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }
  return (
    <>
      <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
        <div>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Schedules</h1>
                <p className="text-md text-muted-foreground">View and manage your Schedules</p>
              </div>
              <div className="flex gap-2">
              </div>
            </div>
            <Tabs defaultValue="offices" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="offices" className="flex justify-center text-center">
                  Offices
                </TabsTrigger>
                <TabsTrigger value="providers" className="flex justify-center text-center">
                  Providers
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex justify-center text-center">
                  Groups
                </TabsTrigger>
              </TabsList>

              <TabsContent value="offices">
                <ScheduleTable scheduleType="office" />
              </TabsContent>
              
              <TabsContent value="providers">
                <ScheduleTable scheduleType="provider" />
              </TabsContent>

              <TabsContent value="groups">
                <ScheduleTable scheduleType="group" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {/* <PageContainer>
        <>
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 3 }}>
              <TabList
                onChange={(event, tabTemp) => setTab(tabTemp)}
                aria-label="Switch between different schedule options"
              >
                <Tab label="Offices" value="0" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Providers" value="1" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Groups" value="2" sx={{ textTransform: 'none', fontWeight: 700 }} />
              </TabList>
            </Box>
            <TabPanel value="0">
              <ScheduleInformation scheduleType="office"></ScheduleInformation>
            </TabPanel>
            <TabPanel value="1">
              <ScheduleInformation scheduleType="provider"></ScheduleInformation>
            </TabPanel>
            <TabPanel value="2">
              <ScheduleInformation scheduleType="group"></ScheduleInformation>
            </TabPanel>
          </TabContext>
        </>
      </PageContainer> */}
    </>
  );
}

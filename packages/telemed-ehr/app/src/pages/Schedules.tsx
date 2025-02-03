import { ReactElement, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleTable } from '../components/schedule/ScheduleTable';
import { CalendarDays } from 'lucide-react';


export default function LocationsPage(): ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("")
  return (
    <>
      <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
        <div>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex flex-row items-center gap-2">
                <h1 className='text-[30px]'>📅</h1>
                {/* <CalendarDays className="my-auto text-[#202020] w-[30px] h-[30px]" /> */}
                <h1 className="text-3xl font-bold">Schedules</h1>
                </div>
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

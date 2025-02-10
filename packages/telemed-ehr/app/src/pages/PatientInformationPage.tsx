import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { SearchParam } from '@zapehr/sdk';
import { OTTEHR_MODULE, getVisitStatusHistory } from 'ehr-utils';
import { Appointment, Location, Patient, RelatedPerson, Resource } from 'fhir/r4';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFirstName, getLastName } from 'ehr-utils';
import { otherColors } from '../CustomThemeProvider';
import CustomBreadcrumbs from '../components/CustomBreadcrumbs';
import PatientInformation from '../components/PatientInformation';
import { PriorityIconWithBorder } from '../components/PriorityIconWithBorder';
import {
  formatDateUsingSlashes,
  formatISODateToLocaleDate,
  formatISOStringToDateAndTime,
} from '../helpers/formatDateTime';
import { standardizePhoneNumber } from 'ehr-utils';
import { getPatientNameSearchParams } from '../helpers/patientSearch';
import { formatMinutes, getVisitTotalTime } from '../helpers/visitDurationUtils';
import { useApiClients } from '../hooks/useAppClients';
import PageContainer from '../layout/PageContainer';
import { getVisitTypeLabelForAppointment } from '../types/types';
import { PatientInfoCard } from '../shadcn/components/PatientInfoCard';
import { ScrollToTop } from '../../../../ottehr-components';
import { BreadcrumbPatient } from '@/shadcn/components/Breadcrumbs';
import { TabsDemo } from '@/shadcn/components/Tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Callout } from '@/components/ui/callout';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Mic, MoreVertical, Save, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/shadcn/components/ChatInterface';
import { Card } from '@/components/ui/card';
import AppointmentHistory from '@/shadcn/components/Visits';
interface AppointmentRow {
  id: string | undefined;
  type: string | undefined;
  office: string | undefined;
  dateTime: string | undefined;
  length: number;
}

export default function PatientInformationPage(): JSX.Element {
  const { fhirClient } = useApiClients();

  const [patient, setPatient] = useState<Patient>();
  const [appointments, setAppointments] = useState<AppointmentRow[]>();
  const [relatedPerson, setRelatedPerson] = useState<RelatedPerson>();
  const [loading, setLoading] = useState<boolean>(true);
  const [otherPatientsWithSameName, setOtherPatientsWithSameName] = useState<boolean>(false);

  const { id } = useParams();
  const { id: patientId } = useParams();

  console.log('patient: ', patient);
  useEffect(() => {
    async function getPatient(): Promise<void> {
      if (!fhirClient || !id) {
        throw new Error('fhirClient or patient ID is not defined');
      }

      setLoading(true);
      const resourcesTemp = await fhirClient.searchResources<Resource>({
        resourceType: 'Patient',
        searchParams: [
          { name: '_id', value: id },
          {
            name: '_revinclude',
            value: 'Appointment:patient',
          },
          {
            name: '_include:iterate',
            value: 'Appointment:location',
          },
          {
            name: '_revinclude:iterate',
            value: 'RelatedPerson:patient',
          },
        ],
      });

      const patientTemp: Patient = resourcesTemp.find((resource) => resource.resourceType === 'Patient') as Patient;
      const appointmentsTemp: Appointment[] = resourcesTemp.filter(
        (resource) =>
          resource.resourceType === 'Appointment' &&
          resource.meta?.tag?.find((tag) => tag.code === OTTEHR_MODULE.UC || tag.code === OTTEHR_MODULE.TM),
      ) as Appointment[];
      const locations: Location[] = resourcesTemp.filter(
        (resource) => resource.resourceType === 'Location',
      ) as Location[];
      const relatedPersonTemp: RelatedPerson = resourcesTemp.find(
        (resource) => resource.resourceType === 'RelatedPerson',
      ) as RelatedPerson;

      appointmentsTemp.sort((a, b) => {
        const createdA = DateTime.fromISO(a.start ?? '');
        const createdB = DateTime.fromISO(b.start ?? '');
        return createdB.diff(createdA).milliseconds;
      });

      const first = getFirstName(patientTemp);
      const last = getLastName(patientTemp);
      const otherPatientParams: SearchParam[] = getPatientNameSearchParams({
        firstLast: { first, last },
        narrowByRelatedPersonAndAppointment: false,
        maxResultOverride: 2,
      });
      const otherPatientsWithSameNameTemp = await fhirClient.searchResources<Resource>({
        resourceType: 'Patient',
        searchParams: otherPatientParams,
      });

      if (otherPatientsWithSameNameTemp?.length > 1) {
        setOtherPatientsWithSameName(true);
      } else {
        setOtherPatientsWithSameName(false);
      }

      const appointmentRows: AppointmentRow[] = appointmentsTemp.map((appointment: Appointment) => {
        const appointmentLocationID = appointment.participant
          .find((participant) => participant.actor?.reference?.startsWith('Location/'))
          ?.actor?.reference?.replace('Location/', '');
        const location = locations.find((location) => location.id === appointmentLocationID);

        return {
          id: appointment.id,
          type: getVisitTypeLabelForAppointment(appointment),
          office:
            location?.address?.state &&
            location?.name &&
            `${location?.address?.state?.toUpperCase()} - ${location?.name}`,
          dateTime: appointment.start,
          length: getVisitTotalTime(appointment, getVisitStatusHistory(appointment), DateTime.now()),
        };
      });

      setAppointments(appointmentRows);
      setPatient(patientTemp);
      setRelatedPerson(relatedPersonTemp);
    }

    getPatient()
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [fhirClient, id]);

  // console.log('patient information appointments: ', appointments[0]);

  const handleUpdatePatient = async (updatedPatient: Patient): Promise<void> => {
    if (!fhirClient || !patientId) {
      throw new Error('FHIR client or patient ID not available');
    }
  
    try {
       // Log the incoming update
      console.log('Attempting to update patient with:', updatedPatient);
      
      // Create a minimal update payload
      const patientToUpdate: Patient = {
        resourceType: 'Patient',
        id: patientId,
        meta: patient?.meta,
        active: patient?.active,
         // Preserve existing data
        name: patient?.name,
        birthDate: updatedPatient.birthDate || patient?.birthDate,
        telecom: updatedPatient.telecom || patient?.telecom,
        address: updatedPatient.address || patient?.address,
        // Explicitly set gender
        gender: updatedPatient.gender || patient?.gender,
      };
  
      console.log('Updating patient with:', patientToUpdate);
  
      // Update the call to match FHIR API expectations
      const response = await fhirClient.updateResource(patientToUpdate);
      
      setPatient(prevPatient => ({ ...prevPatient, ...patientToUpdate }));
  
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error;
    }
  };

  return (
    <>
      <ScrollToTop />
      <div className="m-8">
        <div className="flex gap-4 flex-col lg:flex-row">
          <PatientInfoCard patient={patient} loading={loading} lastAppointment={appointments?.[0]?.dateTime} onUpdatePatient={handleUpdatePatient} patientId={patientId} />
          <div className="bg-gray-50 flex-1 py-4 space-y-4">
            <BreadcrumbPatient
              loading={loading}
              currentPage={`${patient?.name?.[0]?.family}, ${patient?.name?.[0]?.given?.[0]}`}
            />
            <Card className="px-4 bg-white">
              <Tabs defaultValue="visits" className="w-full my-4">
                <TabsList className="w-full">
                  <TabsTrigger value="visits" className="flex justify-center text-center">
                    Visits
                  </TabsTrigger>
                  <TabsTrigger value="Notes" className="flex justify-center text-center">
                    Notes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="visits">
                  <AppointmentHistory appointments={appointments} />
                </TabsContent>
                <TabsContent value="Notes" className="">
                  <div>{/* <ChatInterface isOpen={true} onClose={() => {}} recipientName="Dr. Smith" /> */}</div>
                  <div className="flex">
                    <div className="my-8">
                      <Textarea placeholder="Write a note here..." />
                      <div className="flex items-center gap-2 mt-4">
                        <Button className="bg-teal-500 hover:bg-teal-600">
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </Button>
                        <Button variant="outline" className="bg-white">
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                        <Button variant="outline" className="bg-white">
                          <Save className="w-4 h-4 mr-2" />
                          Save Note
                        </Button>
                      </div>
                      <div className="mt-4 p-4 bg-gray-100 rounded-md min-h-[100px] text-gray-500">
                        Transcription will appear here...
                      </div>
                    </div>
                    <div>
                      <div className="ml-8 space-y-4">
                        <h3 className="font-semibold text-lg">Previous Notes</h3>
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Dr. Smith</p>
                                <p className="text-sm text-gray-500">March 15, 2024 at 2:30 PM</p>
                              </div>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-gray-700">
                              Patient reports improved symptoms after medication adjustment. Blood pressure 120/80.
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">Dr. Johnson</p>
                                <p className="text-sm text-gray-500">March 1, 2024 at 10:15 AM</p>
                              </div>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-2 text-gray-700">
                              Initial consultation. Patient presents with mild hypertension. Prescribed medication and
                              lifestyle changes.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div></div>
                      <div className="fixed bottom-4 right-4">
                        <Button className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                          <MessageSquare className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

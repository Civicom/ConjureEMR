import { TabPanel } from '@mui/lab';
import { BatchInputGetRequest, FhirClient, SearchParam } from '@zapehr/sdk';
import { Bundle, Patient, RelatedPerson } from 'fhir/r4';
import { FormEvent, ReactElement, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PatientSearch from '../components/PatientSearch';
import PatientsTable from '../components/PatientsTable';
import PhoneSearch from '../components/PhoneSearch';
import { encodePlusSign } from '../helpers/encodePlusSign';
import { getPatientNameSearchParams } from '../helpers/patientSearch';
import { useApiClients } from '../hooks/useAppClients';
import PageContainer from '../layout/PageContainer';
import { PatientTable } from '../shadcn/components/PatientsTable';
import { TabsDemo } from '@/shadcn/components/Tabs';
import { Download, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Grid, Paper } from '@mui/material';
import { Search, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

async function getPatientsAndRelatedPersons(
  searchParams: SearchParam[],
  submittedPhone: string | null,
  fhirClient: FhirClient,
): Promise<{
  patients: Patient[] | null;
  relatedPersons: RelatedPerson[] | null;
  total: number;
}> {
  // Search for Patients
  const patientBundle = await fhirClient.searchResourcesReturnBundle({
    resourceType: 'Patient',
    searchParams: searchParams,
  });

  const extractedPatients = patientBundle.entry
    ?.filter((entry) => entry.resource?.resourceType === 'Patient')
    .map((entry) => entry.resource as Patient);

  // Search for RelatedPersons
  let extractedRelatedPersons = null;
  if (extractedPatients?.length) {
    const digits = submittedPhone?.replace(/\D/g, '');
    const phoneSearch = submittedPhone ? `phone=${digits},+1${digits}` : 'phone:missing=false';

    const relatedPersonRequests: BatchInputGetRequest[] = extractedPatients.map((patient) => {
      return {
        method: 'GET',
        url: encodePlusSign(
          `/RelatedPerson?patient=Patient/${patient.id}&relationship=user-relatedperson&${phoneSearch}`,
        ),
      };
    });

    const relatedPersonBundle = await fhirClient.batchRequest({
      requests: relatedPersonRequests,
    });

    const existingRelatedPersonBundle = relatedPersonBundle?.entry?.filter((entry) => entry?.resource);

    extractedRelatedPersons = existingRelatedPersonBundle
      ?.map((entry) => {
        const innerBundle = entry?.resource as Bundle;
        const relatedPerson = innerBundle?.entry?.[0]?.resource as RelatedPerson;
        return relatedPerson || null;
      })
      .filter((relatedPerson) => relatedPerson !== null);
  }

  return {
    patients: extractedPatients ?? null,
    relatedPersons: extractedRelatedPersons ?? null,
    total: patientBundle.total ?? 0,
  };
}

export default function PatientsPage(): ReactElement {
  const { fhirClient } = useApiClients();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [relatedPersons, setRelatedPersons] = useState<RelatedPerson[] | null>(null);
  const [patientNameFilter, setPatientNameFilter] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(searchParams.get('name'));
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(searchParams.get('phone'));
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const [inactivePatients, setInactivePatients] = useState<Patient[] | null>(null);
  const [inactiveRelatedPersons, setInactiveRelatedPersons] = useState<RelatedPerson[] | null>(null);
  const [totalInactivePatients, setTotalInactivePatients] = useState<number>(0);

  const [inactiveLoading, setInactiveLoading] = useState<boolean>(false);

  // Combined useEffect for fetching both active and inactive patients
useEffect(() => {
  async function fetchPatients(): Promise<void> {
    if (!fhirClient) return;

    setLoading(true);
    setInactiveLoading(true);

    try {
      // Fetch active patients
      const activeSearchParams: SearchParam[] = [
        { name: 'active', value: 'true' },
        { name: '_has:RelatedPerson:patient:phone:missing', value: 'false' },
        { name: '_count', value: '1000000' },
      ];

      // Fetch inactive patients
      const inactiveSearchParams: SearchParam[] = [
        { name: 'active', value: 'false' },
        { name: '_has:RelatedPerson:patient:phone:missing', value: 'false' },
        { name: '_count', value: '1000000' }
      ];


      // Fetch both in parallel using Promise.all
      const [activeResources, inactiveResources] = await Promise.all([
        getPatientsAndRelatedPersons(activeSearchParams, null, fhirClient),
        getPatientsAndRelatedPersons(inactiveSearchParams, null, fhirClient)
      ]);

      // Set active patients data
      setPatients(activeResources.patients);
      setRelatedPersons(activeResources.relatedPersons);
      setTotalPatients(activeResources.total);

      // Set inactive patients data
      setInactivePatients(inactiveResources.patients);
      setInactiveRelatedPersons(inactiveResources.relatedPersons);
      setTotalInactivePatients(inactiveResources.total);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setInactiveLoading(false);
    }
  }

  // Only fetch if no search is active
  if (!submittedName && !submittedPhone) {
    fetchPatients();
  }
}, [fhirClient]);



  // Update query params in the url when filters change
  useEffect(() => {
    if (location.search && !submittedName && !submittedPhone) {
      navigate('/patients', { replace: true });
    } else if (submittedName || submittedPhone) {
      const nameParam = submittedName && `name=${submittedName}`;
      const phoneParam = submittedPhone && `phone=${submittedPhone?.replace(/\D/g, '')}`;
      let queryParams;

      if (nameParam && phoneParam) {
        queryParams = [nameParam, phoneParam].join('&');
      } else if (nameParam) {
        queryParams = nameParam;
      } else {
        queryParams = phoneParam;
      }

      navigate(`/patients?${queryParams}`, { replace: true });
    }
  }, [location.search, navigate, submittedName, submittedPhone]);

  // If there are query params in the url then update the filters so the search fields are prefilled when the page loads
  useEffect(() => {
    if (submittedName || submittedPhone) {
      submittedName && setPatientNameFilter(submittedName);
      submittedPhone && setPhoneFilter(submittedPhone);
    }
  }, [submittedName, submittedPhone]);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setSubmittedName(patientNameFilter);
    setSubmittedPhone(phoneFilter);
  };
  
  // Initially - search is done through using url location
  // Current - search is client side but doesnt automatically update the url
  // Plan - search is client side and should update the url

  return (
    /* TODO: Create own recyclable page container component */
    <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
      <div>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">🤕 Patients</h1>
              <p className="text-md text-muted-foreground">View and manage your Patients</p>
            </div>
            <div className="flex gap-2">
              {/* <Button variant="outline" className="bg-white">
                <Download className="w-4 h-4" /> Export
              </Button> */}
              <Link to={`/visits/add`} className="flex items-center gap-2">
                  <Button className="flex items-center font-bold capitalize bg-[#D3455B] hover:bg-[#b52b40] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                  </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="activePatients" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="activePatients" className="flex justify-center text-center">
                Active Patients
              </TabsTrigger>
              <TabsTrigger value="inactivePatients" className="flex justify-center text-center">
                Inactive Patients
              </TabsTrigger>
            </TabsList>
            <TabsContent value="activePatients">
              <PatientTable
                fhirPatients={patients}
                relatedPersons={relatedPersons}
                total={totalPatients}
                patientsLoading={loading}
              />
            </TabsContent>

            <TabsContent value="inactivePatients">
              <PatientTable
                fhirPatients={inactivePatients}
                relatedPersons={inactiveRelatedPersons}
                total={totalInactivePatients}
                patientsLoading={inactiveLoading}
              />
            </TabsContent>
          </Tabs>

          
        </div>
      </div>
    </div>
  );
}

import { Patient } from 'fhir/r4';
import { ResourceDashboard } from './ResourceDashboard';
import { useApiClients } from '@/hooks/useAppClients';
import { useState } from 'react';
import { useEffect } from 'react';

export const Patients = () => {
  const { fhirClient } = useApiClients();
  const [resources, setResources] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 10;

  useEffect(() => {
    async function getResources() {
      if (!fhirClient) return;
      setLoading(true);

      const searchParams = [
        { name: '_count', value: rowsPerPage.toString() },
        { name: '_offset', value: (pageNumber * rowsPerPage).toString() },
      ];

      if (searchTerm) {
        searchParams.push({ name: 'name', value: searchTerm });
      }

      const response = await fhirClient.searchResources({
        resourceType: 'Patient',
        searchParams,
      });
      setResources(response);
      setTotalCount(response.total || 0);
      setLoading(false);
    }
    getResources();
  }, [fhirClient, pageNumber, searchTerm]);

  console.log('Patients:', JSON.stringify(resources, null, 2));

  const statistics = [
    { title: 'Total Patients', value: totalCount },
    { title: 'Active Patients', value: resources.filter((r) => r.active).length },
    {
      title: 'Average Age',
      value: Math.round(
        resources.reduce((acc, r) => {
          if (!r.birthDate) return acc;
          const age = Math.floor(
            (new Date().getTime() - new Date(r.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          );
          return acc + age;
        }, 0) / resources.filter((r) => r.birthDate).length || 0,
      ),
      subtitle: 'years',
    },
    {
      title: 'Gender Distribution',
      value: resources.length
        ? `${Math.round((resources.filter((r) => r.gender === 'male').length / resources.length) * 100)}% M`
        : '0% M',
    },
    {
      title: 'Contact Methods',
      value: new Set(resources.flatMap((r) => r.telecom?.map((t) => t.system) || [])).size,
    },
    {
      title: 'Recent Registrations',
      value: resources.filter((r) => {
        const createdAt = r.meta?.lastUpdated;
        if (!createdAt) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(createdAt) > thirtyDaysAgo;
      }).length,
      subtitle: 'last 30 days',
    },
    {
      title: 'User Types',
      value: new Set(
        resources
          .map(
            (r) =>
              r.extension?.find((ext) => ext.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/form-user')
                ?.valueString,
          )
          .filter(Boolean),
      ).size,
    },
  ];

  return (
    <ResourceDashboard
      resourceType="Patient"
      resources={resources}
      loading={loading}
      statistics={statistics}
      renderResourceCard={(resource, index) => <PatientCard key={resource.id} patient={resource} index={index} />}
      onPageChange={setPageNumber}
      currentPage={pageNumber}
      totalCount={totalCount}
      rowsPerPage={rowsPerPage}
      searchProps={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: 'Search by name...',
        searchParamName: 'name',
      }}
    />
  );
};

const PatientCard = ({ patient, index }: { patient: Patient; index: number }) => {
  const name = patient.name?.[0];
  const fullName = [name?.prefix?.join(' '), name?.given?.join(' '), name?.family].filter(Boolean).join(' ');
  const age = patient.birthDate
    ? Math.floor((new Date().getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const formUserType = patient.extension?.find(
    (ext) => ext.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/form-user',
  )?.valueString;

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-bold text-lg">{fullName || 'Unknown Name'}</div>
          <div className="flex gap-2 text-sm text-gray-500">
            <span>ID: {patient.id}</span>
            {formUserType && (
              <>
                <span>•</span>
                <span className="capitalize">Type: {formUserType}</span>
              </>
            )}
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-sm ${patient.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {patient.active ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="font-semibold text-gray-700">Demographics</div>
          <div className="grid grid-cols-2 gap-x-4 text-sm">
            <div className="text-gray-500">Gender:</div>
            <div className="capitalize">{patient.gender || 'Unknown'}</div>
            <div className="text-gray-500">Age:</div>
            <div>{age ? `${age} years` : 'Unknown'}</div>
            <div className="text-gray-500">Birth Date:</div>
            <div>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-semibold text-gray-700">Contact Information</div>
          <div className="space-y-1 text-sm">
            {patient.telecom?.map((telecom, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="capitalize text-gray-500">{telecom.system}:</span>
                <a
                  href={telecom.system === 'email' ? `mailto:${telecom.value}` : `tel:${telecom.value}`}
                  className="text-blue-600 hover:underline"
                >
                  {telecom.value}
                </a>
              </div>
            ))}
            {patient.telecom?.length === 0 && <div className="text-gray-500">No contact information available</div>}
          </div>
        </div>
      </div>

      {patient.extension?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="font-semibold text-gray-700 mb-2">Additional Information</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {patient.extension.map((ext, i) => (
              <div key={i}>
                <span className="text-gray-500">{ext.url.split('/').pop()}:</span> <span>{ext.valueString}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

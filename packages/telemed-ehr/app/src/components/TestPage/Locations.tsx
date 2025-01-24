import React, { useEffect, useState } from 'react';
import { Location } from 'fhir/r4';
import { useApiClients } from '@/hooks/useAppClients';
import { ResourceDashboard } from '@/components/TestPage/ResourceDashboard';

const LocationCard = ({ location, index }: { location: Location; index: number }) => {
  const schedule = location.extension?.find(
    (e) => e.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
  )?.valueString;
  const timezone = location.extension?.find(
    (e) => e.url === 'http://hl7.org/fhir/StructureDefinition/timezone',
  )?.valueString;
  const parsedSchedule = schedule ? JSON.parse(schedule) : null;

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-white">
      <div className="font-bold mb-2 text-lg">
        {index + 1}. {location.name}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-semibold">Basic Info</div>
          <div>
            Status: <span className="capitalize">{location.status}</span>
          </div>
          {location.address && (
            <div>
              Address:{' '}
              {[
                location.address.line?.join(', '),
                location.address.city,
                location.address.state,
                location.address.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </div>
          )}
          {timezone && <div>Timezone: {timezone}</div>}
        </div>
        <div>
          <div className="font-semibold">Hours of Operation</div>
          {location.hoursOfOperation?.map((hours, i) => (
            <div key={i} className="text-sm">
              {hours.daysOfWeek?.map((day) => day.substring(0, 3)).join(', ')}: {hours.openingTime?.substring(0, 5)} -{' '}
              {hours.closingTime?.substring(0, 5)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Locations = () => {
  const { fhirClient } = useApiClients();
  const [resources, setResources] = useState<Location[]>([]);
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

      // Add search parameter if search term exists
      if (searchTerm) {
        searchParams.push({ name: 'name', value: searchTerm });
      }

      const response = await fhirClient.searchResources({
        resourceType: 'Location',
        searchParams,
      });
      setResources(response);
      setTotalCount(response.total || 0);
      setLoading(false);
    }
    getResources();
  }, [fhirClient, pageNumber, searchTerm]);

  const statistics = [
    { title: 'Total Locations', value: totalCount },
    { title: 'Active Locations', value: resources.filter((r) => r.status === 'active').length },
    {
      title: 'States/Regions',
      value: new Set(resources.map((r) => r.address?.state).filter(Boolean)).size,
    },
    {
      title: 'Average Hours/Day',
      value: Math.round(
        resources.reduce((acc, r) => {
          const hours = r.hoursOfOperation?.[0];
          if (!hours?.openingTime || !hours?.closingTime) return acc;
          const start = new Date(`1970-01-01T${hours.openingTime}`);
          const end = new Date(`1970-01-01T${hours.closingTime}`);
          return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0) / resources.length,
      ),
    },
  ];

  return (
    <ResourceDashboard
      resourceType="Location"
      resources={resources}
      loading={loading}
      statistics={statistics}
      renderResourceCard={(resource, index) => <LocationCard key={resource.id} location={resource} index={index} />}
      onPageChange={setPageNumber}
      currentPage={pageNumber}
      totalCount={totalCount}
      rowsPerPage={rowsPerPage}
      searchProps={{
        value: searchTerm,
        onChange: setSearchTerm,
        placeholder: 'Search locations...',
        searchParamName: 'name',
      }}
    />
  );
};

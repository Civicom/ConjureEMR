/**
 * I asked the AI to show me how it would improve my code from fetching Resources from FHIR to displaying them in the page
 *
 * These are things that I learned:
 * 1. using useMemo to sort the statistics, resources, location names, and appointment card
 * 2. using useCallback to memoize the location fetching because it's like a useMemo but for functions
 *
 * Memoization means that the component will only re-render if the dependencies change.
 * We use memoization when sorting, filtering, or fetching data because it's expensive to do it on every render.
 * Without memoization, when doing sorting, filtering, or fetching data, it rerenders the component on every render.
 * It rerenders on the component by default because of the useEffect hook.
 *
 *
 * Asked the AI to explain like I'm 5 (ELI5):
 *
 * useMemo and useCallback help make React apps faster by remembering things instead of redoing work:
 *
 * useMemo is like saving the answer to a math problem:
 * - Instead of recalculating 2+2 every time, it remembers that 2+2=4
 * - Only recalculates if the numbers change (like 3+2)
 * - Good for expensive calculations like sorting or filtering arrays
 *
 * useCallback is like saving a recipe:
 * - Instead of rewriting the recipe every time, it remembers the steps
 * - Only creates a new recipe if the ingredients change
 * - Good for functions that are passed as props to child components
 *
 * Example:
 * - Without useMemo: Sorts a big list of names on every render
 * - With useMemo: Only sorts when the list changes
 *
 * Example:
 * - Without useCallback: Creates new fetch function on every render
 * - With useCallback: Reuses same function unless dependencies change
 *
 *
 *
 */

import { useApiClients } from '@/hooks/useAppClients';
import { Appointment } from 'fhir/r4';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Location } from 'fhir/r4';
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from '../ui/accordion';
import { DashboardCard } from './DashboardCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ResourceDashboard } from './ResourceDashboard';

const getLocationId = (appointment: Appointment) =>
  appointment.participant?.find((p) => p.actor?.reference?.startsWith('Location/'))?.actor?.reference?.split('/')[1];

const getPatientId = (appointment: Appointment) =>
  appointment.participant?.find((p) => p.actor?.reference?.startsWith('Patient/'))?.actor?.reference?.split('/')[1];

const AppointmentCard = React.memo(
  ({
    appointment,
    index,
    locationNames,
    pageNumber,
    rowsPerPage,
  }: {
    appointment: Appointment;
    index: number;
    locationNames: { [key: string]: string };
    pageNumber: number;
    rowsPerPage: number;
  }) => {
    const locationId = getLocationId(appointment);
    const patientId = getPatientId(appointment);

    return (
      <div className="border border-gray-300 rounded-md p-4 bg-white">
        <div className="font-bold mb-2">
          {index + 1 + pageNumber * rowsPerPage}. Appointment ID: {appointment.id}
        </div>
        <div>Status: {appointment.status}</div>
        <div>Start: {new Date(appointment.start || '').toLocaleString()}</div>
        <div>End: {new Date(appointment.end || '').toLocaleString()}</div>
        <div>Service Type: {appointment.serviceType?.[0]?.text}</div>
        <div>Appointment Type: {appointment.appointmentType?.text}</div>
        <div>
          Participants:
          {appointment.participant?.map((p, i) => (
            <div key={i} className="ml-4">
              {p.actor?.reference} - {p.status}
            </div>
          ))}
          <div>Patient ID: {patientId}</div>
          <div className="ml-4">Location Name: {(locationId && locationNames[locationId]) || 'Location not found'}</div>
        </div>
      </div>
    );
  },
);

AppointmentCard.displayName = 'AppointmentCard';

export const Appointments = () => {
  const { fhirClient } = useApiClients();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageNumber, setPageNumber] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [resources, setResources] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationNames, setLocationNames] = useState<{ [key: string]: string }>({});
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function getResources() {
      if (!fhirClient) return;
      setLoading(true);
      const searchParams = [
        { name: '_count', value: rowsPerPage.toString() },
        { name: '_offset', value: (pageNumber * rowsPerPage).toString() },
      ];

      if (searchTerm) {
        searchParams.push({ name: 'patient', value: searchTerm });
      }

      const response = await fhirClient.searchResources({
        resourceType: 'Appointment',
        searchParams,
      });
      setResources(response);
      setTotalCount(response.total || 0);
      setLoading(false);
    }
    getResources();
  }, [fhirClient, pageNumber, searchTerm]);

  console.log(resources);

  const sortedResources = useMemo(
    () => [...resources].sort((a, b) => new Date(b.start || '').getTime() - new Date(a.start || '').getTime()),
    [resources],
  );

  const statistics = useMemo(
    () => [
      { title: 'Total Appointments', value: totalCount },
      {
        title: 'Telemedicine',
        value: resources.filter((r) => r.serviceType?.[0]?.text === 'telemedicine').length,
      },
      {
        title: 'In-Person',
        value: resources.filter((r) => r.serviceType?.[0]?.text === 'in-person').length,
      },
      {
        title: "Today's Appointments",
        value: resources.filter((r) => {
          const start = new Date(r.start || '');
          const today = new Date();
          return start.toDateString() === today.toDateString();
        }).length,
      },
      {
        title: 'Average Duration',
        value: `${Math.round(
          resources.reduce((acc, r) => {
            const start = new Date(r.start || '');
            const end = new Date(r.end || '');
            return acc + (end.getTime() - start.getTime()) / (1000 * 60);
          }, 0) / resources.length,
        )} min`,
      },
      {
        title: 'Status Breakdown',
        value: `${resources.filter((r) => r.status === 'arrived').length} arrived, ${
          resources.filter((r) => r.status === 'pending').length
        } pending`,
      },
    ],
    [resources, totalCount],
  );

  // Memoize location fetching
  const getLocation = useCallback(
    async (id: string) => {
      if (!fhirClient) return null;
      return fhirClient.searchResources<Location>({
        resourceType: 'Location',
        searchParams: [{ name: '_id', value: id }],
      });
    },
    [fhirClient],
  );

  // Batch location fetching
  useEffect(() => {
    const fetchLocations = async () => {
      const uniqueLocationIds = new Set(resources.map(getLocationId).filter(Boolean));
      const newLocationIds = Array.from(uniqueLocationIds).filter((id) => !locationNames[id!]);

      if (newLocationIds.length === 0) return;

      const locationPromises = newLocationIds.map(async (id) => {
        const location = await getLocation(id!);
        return { id, name: location?.[0]?.name };
      });

      const locations = await Promise.all(locationPromises);
      const newLocationNames = locations.reduce(
        (acc, { id, name }) => {
          if (id && name) acc[id] = name;
          return acc;
        },
        {} as { [key: string]: string },
      );

      setLocationNames((prev) => ({ ...prev, ...newLocationNames }));
    };

    fetchLocations();
  }, [resources, getLocation]);

  return (
    <ResourceDashboard
      resourceType="Appointment"
      resources={resources}
      loading={loading}
      statistics={statistics}
      renderResourceCard={(resource, index) => (
        <AppointmentCard
          key={resource.id}
          appointment={resource}
          index={index}
          locationNames={locationNames}
          pageNumber={pageNumber}
          rowsPerPage={rowsPerPage}
        />
      )}
      onPageChange={setPageNumber}
      currentPage={pageNumber}
      totalCount={totalCount}
      rowsPerPage={rowsPerPage}
      // searchProps={{
      //   value: searchTerm,
      //   onChange: setSearchTerm,
      //   placeholder: 'Search by patient ID...',
      //   searchParamName: 'patient',
      // }}
    />
  );
};

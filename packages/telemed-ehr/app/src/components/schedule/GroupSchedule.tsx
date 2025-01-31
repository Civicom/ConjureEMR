import { ReactElement, useCallback, useEffect, useState } from 'react';
import { Button, CircularProgress, Grid, Tooltip, Typography } from '@mui/material';
import { HealthcareService, Location, Practitioner, PractitionerRole, Resource } from 'fhir/r4';
import GroupMembers from './GroupMembers';
import { useApiClients } from '../../hooks/useAppClients';
import { BatchInputPostRequest, BatchInputRequest, PatchResourceInput, formatHumanName } from '@zapehr/sdk';
import { GetPatchBinaryInput, getPatchBinary } from 'ehr-utils';

interface GroupScheduleProps {
  groupID: string;
}

export default function GroupSchedule({ groupID }: GroupScheduleProps): ReactElement {
  const { fhirClient } = useApiClients();
  const [group, setGroup] = useState<HealthcareService | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [locations, setLocations] = useState<Location[] | undefined>(undefined);
  const [practitioners, setPractitioners] = useState<Practitioner[] | undefined>(undefined);
  const [practitionerRoles, setPractitionerRoles] = useState<PractitionerRole[] | undefined>(undefined);
  const [selectedLocations, setSelectedLocations] = useState<string[] | undefined>(undefined);
  const [selectedPractitioners, setSelectedPractitioners] = useState<string[] | undefined>(undefined);

  const getOptions = useCallback(async () => {
    const request = await fhirClient?.batchRequest({
      requests: [
        {
          method: 'GET',
          url: `/HealthcareService?_id=${groupID}`,
        },
        {
          method: 'GET',
          url: '/Location',
        },
        {
          method: 'GET',
          url: '/Practitioner?_revinclude=PractitionerRole:practitioner',
        },
      ],
    });
    const groupTemp: HealthcareService = (request?.entry?.[0]?.resource as any).entry.map(
      (resourceTemp: any) => resourceTemp.resource,
    )[0];
    const locationsTemp: Location[] = (request?.entry?.[1]?.resource as any).entry.map(
      (resourceTemp: any) => resourceTemp.resource,
    );
    const practitionerResources: Resource[] = (request?.entry?.[2]?.resource as any).entry.map(
      (resourceTemp: any) => resourceTemp.resource,
    );
    const practitionersTemp: Practitioner[] = practitionerResources.filter(
      (resourceTemp) => resourceTemp.resourceType === 'Practitioner',
    ) as Practitioner[];
    const practitionerRolesTemp: PractitionerRole[] = practitionerResources.filter(
      (resourceTemp) => resourceTemp.resourceType === 'PractitionerRole',
    ) as PractitionerRole[];
    console.log(request);
    setGroup(groupTemp);
    setLocations(locationsTemp);
    setPractitioners(practitionersTemp);
    setPractitionerRoles(practitionerRolesTemp);

    const selectedLocationsTemp = groupTemp.location?.map((location) => {
      if (!location.reference) {
        console.log('HealthcareService location does not have reference', location);
        throw new Error('HealthcareService location does not have reference');
      }
      return location.reference?.replace('Location/', '');
    });
    // console.log(group);
    setSelectedLocations(selectedLocationsTemp);

    const selectedPractitionerRolesTemp = practitionerRolesTemp?.filter((practitionerRoleTemp) =>
      practitionerRoleTemp.healthcareService?.some(
        (healthcareServiceTemp) => healthcareServiceTemp.reference === `HealthcareService/${groupTemp.id}`,
      ),
    );
    const selectedPractitionersTemp = practitionersTemp.filter((practitionerTemp) =>
      selectedPractitionerRolesTemp.some(
        (selectedPractitionerRoleTemp) =>
          selectedPractitionerRoleTemp.practitioner?.reference === `Practitioner/${practitionerTemp.id}`,
      ),
    );
    setSelectedPractitioners(selectedPractitionersTemp.map((practitionerTemp) => practitionerTemp.id || ''));
  }, [fhirClient, groupID]);

  useEffect(() => {
    void getOptions();
  }, [getOptions]);
  async function onSubmit(event: any): Promise<void> {
    event.preventDefault();
    if (!selectedPractitioners || !practitionerRoles) {
      return;
    }
    setLoading(true);
    const practitionerRolePractitionerIDs = practitionerRoles?.map(
      (practitionerRoleTemp) => practitionerRoleTemp.practitioner?.reference,
    );
    const practitionerIDToCreatePractitionerRoles = selectedPractitioners.filter(
      (selectedPractitionerTemp) =>
        !practitionerRolePractitionerIDs?.includes(`Practitioner/${selectedPractitionerTemp}`),
    );
    const practitionerIDToAddHealthcareServicePractitionerRoles = practitionerRoles.filter(
      (practitionerRoleTemp) =>
        selectedPractitioners.includes(
          practitionerRoleTemp.practitioner?.reference?.replace('Practitioner/', '') || '',
        ) &&
        !practitionerRoleTemp.healthcareService?.some(
          (healthcareServiceTemp) => healthcareServiceTemp.reference === `HealthcareService/${groupID}`,
        ),
    );
    const practitionerIDToRemoveHealthcareServicePractitionerRoles = practitionerRoles.filter(
      (practitionerRoleTemp) =>
        !selectedPractitioners.includes(
          practitionerRoleTemp.practitioner?.reference?.replace('Practitioner/', '') || '',
        ) &&
        practitionerRoleTemp.healthcareService?.some(
          (healthcareServiceTemp) => healthcareServiceTemp.reference === `HealthcareService/${groupID}`,
        ),
    );

    const practitionerRolesResourcesToCreate: PractitionerRole[] = practitionerIDToCreatePractitionerRoles?.map(
      (practitionerID) => ({
        resourceType: 'PractitionerRole',
        practitioner: {
          reference: `Practitioner/${practitionerID}`,
        },
        healthcareService: [
          {
            reference: `HealthcareService/${groupID}`,
          },
        ],
      }),
    );
    const updateLocations: BatchInputRequest = getPatchBinary({
      resourceType: 'HealthcareService',
      resourceId: groupID,
      patchOperations: [
        {
          op: 'add',
          path: '/location',
          value: selectedLocations?.map((selectedLocationTemp) => ({
            reference: `Location/${selectedLocationTemp}`,
          })),
        },
      ],
    });
    const practitionerRolesResourceCreateRequests: BatchInputPostRequest[] = practitionerRolesResourcesToCreate.map(
      (practitionerRoleResourceToCreateTemp) => ({
        method: 'POST',
        url: '/PractitionerRole',
        resource: practitionerRoleResourceToCreateTemp,
      }),
    );
    const practitionerRolesResourcePatchRequests: BatchInputRequest[] =
      practitionerIDToAddHealthcareServicePractitionerRoles.map(
        (practitionerIDToAddHealthcareServicePractitionerRoleTemp) => {
          const practitionerRole = practitionerRoles?.find(
            (practitionerRoleTemp) => practitionerRoleTemp === practitionerIDToAddHealthcareServicePractitionerRoleTemp,
          );
          let value: any = {
            reference: `HealthcareService/${groupID}`,
          };
          if (!practitionerRole?.healthcareService) {
            value = [value];
          }

          return getPatchBinary({
            resourceType: 'PractitionerRole',
            resourceId: practitionerIDToAddHealthcareServicePractitionerRoleTemp.id || '',
            patchOperations: [
              {
                op: 'add',
                path: practitionerRole?.healthcareService ? '/healthcareService/-' : '/healthcareService',
                value: value,
              },
            ],
          });
        },
      );
    practitionerRolesResourcePatchRequests.push(
      ...practitionerIDToRemoveHealthcareServicePractitionerRoles.map(
        (practitionerIDToRemoveHealthcareServicePractitionerRoleTemp) =>
          getPatchBinary({
            resourceType: 'PractitionerRole',
            resourceId: practitionerIDToRemoveHealthcareServicePractitionerRoleTemp.id || '',
            patchOperations: [
              {
                op: 'replace',
                path: '/healthcareService',
                value: practitionerRoles
                  ?.find(
                    (practitionerRoleTemp) =>
                      practitionerRoleTemp === practitionerIDToRemoveHealthcareServicePractitionerRoleTemp,
                  )
                  ?.healthcareService?.filter(
                    (locationTemp) => locationTemp.reference !== `HealthcareService/${groupID}`,
                  ),
              },
            ],
          }),
      ),
    );
    await fhirClient?.batchRequest({
      requests: [
        ...practitionerRolesResourceCreateRequests,
        ...practitionerRolesResourcePatchRequests,
        updateLocations,
      ],
    });
    void (await getOptions());
    setLoading(false);
  }

  if (!group) {
    return (
      <div style={{ width: '100%', height: '250px' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Typography variant="h4">Manage the schedule for {group?.name}</Typography>
      <Typography variant="body1">
        This is a group schedule. Its availability is made up of the schedules of the locations and providers selected.
      </Typography>
      <form onSubmit={onSubmit}>
        <Grid container spacing={4} sx={{ marginTop: 0 }}>
          <Grid item xs={6}>
            <GroupMembers
              option="offices"
              options={
                locations
                  ? locations.map((locationTemp) => ({
                      value: locationTemp.id || 'Undefined name',
                      label: locationTemp.name || 'Undefined name',
                    }))
                  : []
              }
              values={
                selectedLocations
                  ? selectedLocations?.map((locationTemp) => {
                      const locationName = locations?.find((location) => location.id === locationTemp)?.name;
                      return {
                        value: locationTemp,
                        label: locationName || 'Undefined name',
                      };
                    })
                  : []
              }
              onChange={(event, value) => setSelectedLocations(value.map((valueTemp: any) => valueTemp.value))}
            />
          </Grid>
          <Grid item xs={6}>
            <GroupMembers
              option="providers"
              options={
                practitioners
                  ? practitioners.map((practitionerTemp) => ({
                      value: practitionerTemp.id || 'Undefined name',
                      label: practitionerTemp.name ? formatHumanName(practitionerTemp.name[0]) : 'Undefined name',
                    }))
                  : []
              }
              values={
                selectedPractitioners
                  ? selectedPractitioners.map((practitionerTemp) => {
                      const practitionerName = practitioners?.find(
                        (practitioner) => practitioner.id === practitionerTemp,
                      )?.name?.[0];
                      return {
                        value: practitionerTemp,
                        label: practitionerName ? formatHumanName(practitionerName) : 'Undefined name',
                      };
                    })
                  : []
              }
              onChange={(event, value) => setSelectedPractitioners(value.map((valueTemp: any) => valueTemp.value))}
            />
          </Grid>
          <Grid item xs={2}>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 h-9 font-bold bg-primary text-white disabled:opacity-50 text-center"
              >
              {loading 
              ? <svg aria-hidden="true" className="fill-white text-black w-5 h-5 animate-spin dark:text-gray-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>   
              : 'Save'}
            </button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}

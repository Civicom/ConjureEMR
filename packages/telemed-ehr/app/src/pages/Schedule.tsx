import { Skeleton } from '@mui/lab';
import { Address, Extension, HealthcareService, Identifier, Location, Practitioner } from 'fhir/r4';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomBreadcrumbs from '../components/CustomBreadcrumbs';
import { useApiClients } from '../hooks/useAppClients';
import Schedule from '../components/schedule/Schedule';
import { getName } from '../components/ScheduleInformation';
import Loading from '../components/Loading';
import GroupSchedule from '../components/schedule/GroupSchedule';
import { Operation } from 'fast-json-patch';
import { getTimezone } from '../helpers/formatDateTime';
import { getResource } from '../helpers/schedule';
import { TIMEZONES, TIMEZONE_EXTENSION_URL } from '../constants';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { ToastProvider, Toast, ToastViewport, ToastTitle, ToastDescription, ToastClose } from '../components/ui/toast';
import { Check, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'Success' | 'Error' | 'Info';
}

export const createToast = (setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>) => {
  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return {
    addToast: (message: string, type: 'Success' | 'Error' | 'Info' = 'Info') => {
      const newToast = { 
        id: Date.now() + Math.random(),
        message, 
        type
      };
      setToasts((prevToasts) => [...prevToasts, newToast]);

      setTimeout(() => {
        removeToast(newToast.id);
      }, 3000);
    },
    removeToast
  };
};

const START_SCHEDULE =
  '{"schedule":{"monday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"tuesday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"wednesday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"thursday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"friday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"saturday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]},"sunday":{"open":8,"close":15,"openingBuffer":0,"closingBuffer":0,"workingDay":true,"hours":[{"hour":8,"capacity":2},{"hour":9,"capacity":2},{"hour":10,"capacity":2},{"hour":11,"capacity":2},{"hour":12,"capacity":2},{"hour":13,"capacity":2},{"hour":14,"capacity":2},{"hour":15,"capacity":2},{"hour":16,"capacity":2},{"hour":17,"capacity":3},{"hour":18,"capacity":3},{"hour":19,"capacity":3},{"hour":20,"capacity":1}]}},"scheduleOverrides":{}}';
const IDENTIFIER_SLUG = 'https://fhir.ottehr.com/r4/slug';

export default function SchedulePage(): ReactElement {
  // Define variables to interact w database and navigate to other pages
  const { fhirClient } = useApiClients();
  const scheduleType = useParams()['schedule-type'] as 'office' | 'provider' | 'group';
  const id = useParams().id as string;

  if (!scheduleType) {
    throw new Error('scheduleType is not defined');
  }

  // state variables
  const [tabName, setTabName] = useState('schedule');
  const [item, setItem] = useState<Location | Practitioner | HealthcareService | undefined>(undefined);
  const [isItemActive, setIsItemActive] = useState<boolean>(false);
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [timezone, setTimezone] = useState<string | undefined>(undefined);
  const [state, setState] = useState<string | undefined>(undefined);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const {addToast, removeToast} = useMemo(() => createToast(setToasts), []);
 

  const isActive = (item: Location | Practitioner | HealthcareService): boolean => {
    if (item.resourceType === 'Location') {
      return item.status === 'active';
    } else {
      return item.active || false;
    }
  };

  // get the location from the database
  useEffect(() => {
    async function getItem(schedule: 'Location' | 'Practitioner' | 'HealthcareService'): Promise<void> {
      if (!fhirClient) {
        return;
      }
      const itemTemp: Location | Practitioner | HealthcareService = (await fhirClient.readResource({
        resourceType: schedule,
        resourceId: id,
      })) as any;
      setItem(itemTemp);
      const slugTemp = itemTemp?.identifier?.find((identifierTemp) => identifierTemp.system === IDENTIFIER_SLUG);
      setSlug(slugTemp?.value);
      setTimezone(getTimezone(itemTemp));
      setIsItemActive(isActive(itemTemp));
      setState('Location' === itemTemp.resourceType ? itemTemp.address?.state : undefined);
    }
    void getItem(getResource(scheduleType));
  }, [fhirClient, id, scheduleType]);

  // utility functions
  const addressStringFromAddress = (address: Address): string => {
    let addressString = '';
    if (address.line) {
      addressString += `, ${address.line}`;
    }
    if (address.city) {
      addressString += `, ${address.city}`;
    }
    if (address.state) {
      addressString += `, ${address.state}`;
    }
    if (address.postalCode) {
      addressString += `, ${address.postalCode}`;
    }
    // return without trailing comma

    if (addressString !== '') {
      addressString = addressString.substring(2);
    }
    return addressString;
  };
  // console.log(item);
  // handle functions
  const handleTabChange = (event: React.SyntheticEvent, newTabName: string): void => {
    setTabName(newTabName);
  };

  const getStatusOperationJSON = (
    resourceType: 'Location' | 'Practitioner' | 'HealthcareService',
    active: boolean,
  ): Operation => {
    // get the status operation json, account for cases where it exists already or does not
    let operation: Operation;
    if (resourceType === 'Location') {
      operation = {
        op: 'add',
        path: '/status',
        value: active ? 'active' : 'inactive',
      };
    } else if (resourceType === 'Practitioner' || resourceType === 'HealthcareService') {
      operation = {
        op: 'add',
        path: '/active',
        value: active,
      };
    } else {
      throw new Error('resourceType is not defined');
    }
    return operation;
  };

  async function createSchedule(): Promise<void> {
    let resourceType;
    if (!fhirClient) {
      return;
    }
    if (scheduleType === 'office') {
      resourceType = 'Location';
    } else if (scheduleType === 'provider') {
      resourceType = 'Practitioner';
    }
    if (!resourceType) {
      console.log('resourceType is not defined');
      throw new Error('resourceType is not defined');
    }
    const scheduleExtension: Extension[] = [
      {
        url: 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
        valueString: START_SCHEDULE,
      },
    ];

    // if there is no timezone extension, add it. The default timezone is America/New_York
    if (!item?.extension?.some((ext) => ext.url === TIMEZONE_EXTENSION_URL)) {
      scheduleExtension.push({
        url: TIMEZONE_EXTENSION_URL,
        valueString: 'America/New_York',
      });
    }

    const patchedResource = (await fhirClient.patchResource({
      resourceType,
      resourceId: id,
      operations: [
        {
          op: 'add',
          path: '/extension',
          value: scheduleExtension,
        },

        getStatusOperationJSON(resourceType as 'Location' | 'Practitioner', true),
      ],
    })) as Location;
    setItem(patchedResource);
  }

  async function onSave(event: any): Promise<void> {
    event.preventDefault();
    setSaveLoading(true);
    const identifiers = item?.identifier || [];
    let identifiersTemp: Identifier[] | undefined = [...identifiers];
    const hasIdentifiers = identifiersTemp.length > 0;
    const hasSlug = item?.identifier?.find((identifierTemp) => identifierTemp.system === IDENTIFIER_SLUG);
    const currentSlugValue = hasSlug?.value || '';
    const removingSlug = !slug || slug === '';

    // Only proceed with slug update if there's an actual change
    let slugChanged = false;
    if (currentSlugValue !== slug) {
      const updatedSlugIdentifier: Identifier = {
        system: IDENTIFIER_SLUG,
        value: slug,
      };

      if (removingSlug && !hasSlug) {
        console.log('Removing slug but none set');
        addToast('Slug: Error, no slug provided', 'Error');
      } else if (removingSlug && hasSlug) {
        console.log('Removing slug from identifiers');
        identifiersTemp = item?.identifier?.filter(
          (identifierTemp) => identifierTemp.system !== IDENTIFIER_SLUG,
        );
        addToast('Slug: Error, no Slug provided', 'Error');
      } else if (!hasIdentifiers) {
        console.log('No identifiers, adding one');
        identifiersTemp = [updatedSlugIdentifier];
        slugChanged = true;
        addToast('Slug: Save successful!', 'Success');
      } else if (hasIdentifiers && !hasSlug) {
        console.log('Has identifiers without a slug, adding one');
        identifiersTemp.push(updatedSlugIdentifier);
        slugChanged = true;
        addToast('Slug: Save successful!', 'Success');
      } else if (hasIdentifiers && hasSlug) {
        console.log('Has identifiers with a slug, replacing one');
        const identifierIndex = item?.identifier?.findIndex(
          (identifierTemp) => identifierTemp.system === IDENTIFIER_SLUG,
        );

        if (identifierIndex !== undefined && identifiers) {
          identifiersTemp[identifierIndex] = updatedSlugIdentifier;
          slugChanged = true;
          addToast('Slug: Save successful!', 'Success');
        }
      }
    }

    // Create operation only if slug actually changed
    const operation: Operation | undefined = slugChanged
      ? {
          op: !hasIdentifiers ? 'add' : 'replace',
          path: '/identifier',
          value: identifiersTemp,
        }
      : undefined;

    // update state
    let stateOperation: Operation | undefined;
    if (item?.address) {
      // if there is no change in state, do nothing
      if (item.address.state === state) {
        console.log('No change in state');
        setSaveLoading(false);
        // return;
      }
      // if there is an existing state, replace it 
      else {
        if (state === ""){
          addToast('State: Error, no state provided', 'Error');
          setSaveLoading(false);
          return;
        }else{

          console.log('Replacing existing state');
          addToast('State: Save successful!', 'Success');
          stateOperation = {
            op: 'replace',
            path: '/address/state',
            value: state,
          };
          // Update item with new state
          item.address.state = state;
        }
      }
    }
    // if there is no address, add one
    else {
      console.log('Adding new address with state');
      stateOperation = {
        op: 'add', 
        path: '/address',
        value: {
          state: state
        }
      };
      // Add address to item
      item.address = { state };
      addToast('State: Save successful!', 'Success');
    }

    // update timezone
    let timezoneOperation: Operation | undefined;
    const timezoneExtensionIndex = item?.extension?.findIndex((ext) => ext.url === TIMEZONE_EXTENSION_URL);
    if (timezoneExtensionIndex !== undefined && timezoneExtensionIndex >= 0) {
      // if there is no change in timezone, do nothing
      if (item?.extension?.[timezoneExtensionIndex]?.valueString === timezone) {
        console.log('No change in timezone');
      }
      // if there is an existing timezone, replace it
      else {
        if (timezone === ""){
          addToast('Timezone: Error, no timezone provided', 'Error');
          setSaveLoading(false);
          return;
        }
        console.log('Replacing existing timezone');
        timezoneOperation = {
          op: 'replace',
          path: `/extension/${timezoneExtensionIndex}/valueString`,
          value: timezone,
        };
        // setToastOpen(true);
        // setToastMessage('Changes saved!');
        addToast('Timezone: Save successful!', 'Success');
        setSaveLoading(false);
      }
    }
    // if there is no timezone, add one
    else {
      console.log('Adding new timezone');
      timezoneOperation = {
        op: 'add',
        path: '/extension',
        value: [
          {
            url: TIMEZONE_EXTENSION_URL,
            valueString: timezone,
          },
        ],
      };
      // setToastOpen(true);
      // setToastMessage('Changes saved!');
      addToast('Timezone: Save successful!', 'Success');
    }

    const patchOperations: Operation[] = [operation, timezoneOperation, stateOperation].filter(
      (operation) => operation !== undefined,
    ) as Operation[];

    if (patchOperations.length === 0) {
      console.log('No operations to save');
      setSaveLoading(false);
      return;
    }

    const itemTemp = await fhirClient?.patchResource({
      resourceType: getResource(scheduleType),
      resourceId: id,
      operations: patchOperations,
    });

    // Update the local state with the server response
    if (itemTemp) {
      setItem(itemTemp as Location | Practitioner | HealthcareService);
    }
    setSaveLoading(false);
  }

  const setStatus = async (item: Location | Practitioner | HealthcareService, isActive: boolean): Promise<void> => {
    if (!fhirClient) {
      throw new Error('error getting fhir client');
    }

    if (!item.id) {
      throw new Error('item id is not defined');
    }

    if (item.resourceType === 'Location') {
      item.status = isActive ? 'active' : 'inactive';
    } else {
      item.active = isActive;
    }
    setItem(item);
    setIsItemActive(isActive);

    await fhirClient.patchResource({
      resourceType: item.resourceType,
      resourceId: item.id,
      operations: [getStatusOperationJSON(item.resourceType, isActive)],
    });
  };
  
  return (
    <>
      {/* New code */}
      <div className='flex flex-col items-start justify-center max-w-[1200px] mx-auto my-16'>

        {item ? (
          <>
            <ToastProvider>
              <CustomBreadcrumbs
                chain={[
                  { link: '/schedules', children: 'Schedules' },
                  { link: '#', children: getName(item) || <Skeleton width={150} /> },
                ]}
              />

              <h1 className="mt-4 text-3xl font-semibold text-black">
                {getName(item)}
              </h1>

              {(item.resourceType === 'Location' || item.resourceType === 'Practitioner') && (
                <p className="mb-4 font-normal">
                  {item.resourceType === 'Location'
                    ? item.address && addressStringFromAddress(item.address)
                    : item.address && addressStringFromAddress(item.address[0])}
                </p>
              )}
              <Tabs defaultValue="schedule" className="mt-4">
                <TabsList>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  {scheduleType === 'office' && <TabsTrigger value="general">General</TabsTrigger>}
                  
                </TabsList>
                
                <TabsContent value="schedule" className="pt-6">
                  {scheduleType === 'group' && <GroupSchedule groupID={item.id || ''} />}
                    {['office', 'provider'].includes(scheduleType) &&
                      (item.extension?.find(
                        (extensionTemp) =>
                          extensionTemp.url === 'https://fhir.zapehr.com/r4/StructureDefinitions/schedule',
                      )?.valueString ? (
                        <Schedule id={id} item={item} setItem={setItem} addToast={addToast}></Schedule>
                      ) : (
                        <div className="text-base">
                          This {scheduleType} doesn&apos;t have a schedule.{' '}
                          <button
                            type="button"
                            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={createSchedule}
                          >
                            Create a new schedule
                          </button>
                        </div>
                      ))}
                </TabsContent>

                
                <TabsContent value="general" className="pt-6">
                  <div className="bg-white rounded-lg shadow-md mb-6 p-6">
                    <div className="flex items-center mb-4">
                      <div className='flex items-center space-x-2'>
                        <Switch checked={isItemActive} onClick={() => setStatus(item, !isItemActive)} />
                        <Label className="text-md">{isItemActive ? 'Active' : 'Inactive'}</Label>
                      </div>
                    </div>

                    <hr className="my-4" />

                    <form onSubmit={onSave} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="Slug"
                          className="w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>

                      <div>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                          <option value="">Select Timezone</option>
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                          className="w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>

                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 h-9 font-bold bg-primary text-white disabled:opacity-50 text-center"
                        >
                        {saveLoading 
                        ? <svg aria-hidden="true" className="fill-white text-black w-5 h-5 animate-spin dark:text-gray-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                          </svg>   
                        : 'Save Changes'}
                      </button>
                    </form>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-xl font-bold text-primary-dark">
                          Information to the patients
                        </h2>
                        <p className="text-gray-600 mt-2">
                          This message will be displayed to the patients before they proceed with booking the visit.
                        </p>
                        <div className="mt-4 p-6 bg-blue-50 rounded-md">
                          <p className="text-gray-700">
                            No description
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              {toasts.map((toast) => (
                <Toast 
                  className={`${
                    toast.type === 'Success' ? 'bg-teal-50' : 
                    toast.type === 'Error' ? 'bg-red-50' : ''
                  } mb-1`} 
                  key={`toast-${toast.id}`}
                  open={true} 
                  onOpenChange={() => removeToast(toast.id)}
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex flex-row items-center space-x-2">
                      {toast.type === 'Success' && (
                        <div className="rounded-full w-5 h-5 bg-teal-600 flex items-center justify-center"> 
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {toast.type === 'Error' && (
                        <div className="rounded-full w-5 h-5 bg-red-600 flex items-center justify-center"> 
                          <X className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <p>{toast.message}</p>
                    </div>
                    <ToastClose />
                  </div>
                </Toast>
              ))}

              <ToastViewport />
            </ToastProvider>
          </>
          
        ) : <><Loading /></>}

      </div>    
    </>
  );
}

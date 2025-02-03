import { LoadingButton } from '@mui/lab';
import { Box, Paper, TextField, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomBreadcrumbs from '../components/CustomBreadcrumbs';
import { useApiClients } from '../hooks/useAppClients';
import PageContainer from '../layout/PageContainer';
import { getResource } from '../helpers/schedule';
import { TIMEZONE_EXTENSION_URL } from '../constants';
import { Resource } from 'fhir/r4';

export default function AddSchedulePage(): ReactElement {
  // Define variables to interact w database and navigate to other pages
  const { fhirClient } = useApiClients();
  const navigate = useNavigate();
  const scheduleType = useParams()['schedule-type'] as 'office' | 'provider' | 'group';

  if (!scheduleType) {
    throw new Error('scheduleType is not defined');
  }

  // state variables
  const [name, setName] = useState<string | undefined>(undefined);
  const [firstName, setFirstName] = useState<string | undefined>(undefined);
  const [lastName, setLastName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  async function createSchedule(event: any): Promise<void> {
    event.preventDefault();
    if (!fhirClient) {
      return;
    }
    setLoading(true);
    const resource: Resource = await fhirClient.createResource({
      resourceType: getResource(scheduleType),
      name: scheduleType === 'provider' ? [{ given: [firstName], family: lastName }] : name,
      // if it is a group, must add a default time zone extension
      ...(scheduleType === 'group' && {
        extension: [
          {
            url: TIMEZONE_EXTENSION_URL,
            valueString: 'America/New_York',
          },
        ],
      }),
    });
    navigate(`/schedule/${scheduleType}/${resource.id}`);
    setLoading(false);
  }

  return (
    <PageContainer>
      <>
        <div className="mx-12">
          {/* Breadcrumbs */}
          <CustomBreadcrumbs
            chain={[
              { link: '/schedules', children: 'Schedules' },
              { link: '#', children: `Add ${scheduleType}` },
            ]}
          />
          
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            {/* Page title */}
            <h1 className="text-3xl font-semibold text-black mt-4">
              Add {scheduleType}
            </h1>
            
            <form onSubmit={createSchedule}>
              {scheduleType === 'provider' ? (
                <div className="flex gap-4 mt-4">
                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-gray-700">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[250px]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-gray-700">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[250px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[250px]"
                  />
                </div>
              )}
              
              {/* <button
                type="submit"
                disabled={loading}
                className={`mt-4 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Save'
                )}
              </button> */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 h-9 font-bold bg-primary text-white disabled:opacity-50 text-center"
                >
                {loading 
                ? <svg aria-hidden="true" className="fill-white text-black w-5 h-5 animate-spin dark:text-gray-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>   
                : 'Save'}
              </button>
            </form>
          </div>
        </div>

        {/* <Box marginX={12}>
          //Breadcrumbs
          <CustomBreadcrumbs
            chain={[
              { link: '/schedules', children: 'Schedules' },
              { link: '#', children: `Add ${scheduleType}` },
            ]}
          />
          <Paper sx={{ padding: 2 }}>
            //Page title
            <Typography variant="h3" color="primary.dark" marginTop={1}>
              Add {scheduleType}
            </Typography>
            <form onSubmit={createSchedule}>
              {scheduleType === 'provider' ? (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <TextField
                    label="First name"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                  <TextField
                    label="Last name"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </Box>
              ) : (
                <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
              )}
              <br />
              <LoadingButton type="submit" loading={loading} variant="contained" sx={{ marginTop: 2 }}>
                Save
              </LoadingButton>
            </form>
          </Paper>
        </Box> */}
      </>
    </PageContainer>
  );
}

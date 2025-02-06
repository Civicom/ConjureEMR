import { TabContext } from '@mui/lab';
import { CssBaseline } from '@mui/material';
import { LicenseInfo } from '@mui/x-data-grid-pro';
import { ReactElement, Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { CustomThemeProvider } from './CustomThemeProvider';
import { LoadingScreen } from './components/LoadingScreen';
import Navbar from './components/navigation/Navbar';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { useApiClients } from './hooks/useAppClients';
import useOttehrUser, { useProviderERXStateStore } from './hooks/useOttehrUser';
import AddPatient from './pages/AddPatient';
import AppointmentsPage from './pages/Appointments';
import Logout from './pages/Logout';
import SchedulePage from './pages/Schedule';
import SchedulesPage from './pages/Schedules';
import PatientInformationPage from './pages/PatientInformationPage';
import PatientsPage from './pages/Patients';
import { TelemedAdminPage } from './pages/TelemedAdminPage';
import { useNavStore } from './state/nav.store';
import EditInsurancePage from './telemed/features/telemed-admin/EditInsurance';
import EditStatePage from './telemed/features/telemed-admin/EditState';
import { isLocalOrDevOrTestingOrTrainingEnv } from './telemed/utils/env.helper';
import { RoleType } from './types/types';
import { AppointmentPage } from './pages/AppointmentPage';
import AddSchedulePage from './pages/AddSchedulePage';
import Version from './pages/Version';
import { isErxEnabled } from './helpers/erx';
import Resources from './components/TestPage/Test';
import AdminPage from './pages/admin/Admin';
import EditEmployeePage from './pages/EditEmployee';
import EditEmployee from './pages/admin/EditEmployee';
import EditInsurance from './pages/admin/EditInsurance';
import EditState from './pages/admin/EditState';
import('@photonhealth/elements').catch(console.log);

const TelemedTrackingBoardPageLazy = lazy(async () => {
  const TrackingBoardPage = await import('./telemed/pages/TrackingBoardPage');
  return { default: TrackingBoardPage.TrackingBoardPage };
});

const TelemedAppointmentPageLazy = lazy(async () => {
  const TelemedAppointmentPage = await import('./telemed/pages/AppointmentPage');
  return { default: TelemedAppointmentPage.AppointmentPage };
});

export const INSURANCES_PATH = '/telemed-admin/insurances';

const MUI_X_LICENSE_KEY = import.meta.env.VITE_APP_MUI_X_LICENSE_KEY;
if (MUI_X_LICENSE_KEY != null) {
  LicenseInfo.setLicenseKey(MUI_X_LICENSE_KEY);
}

const isERXEnabled = isErxEnabled();

function App(): ReactElement {
  useApiClients();
  const currentUser = useOttehrUser();
  const currentTab = useNavStore((state: any) => state.currentTab) || 'In Person';

  const wasEnrolledInERX = useProviderERXStateStore((state) => state.wasEnrolledInERX);

  const roleUnknown =
    !currentUser ||
    !currentUser.hasRole([
      RoleType.Administrator,
      RoleType.Staff,
      RoleType.Manager,
      RoleType.Provider,
      RoleType.Prescriber,
    ]);

  return (
    <CustomThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <TabContext value={currentTab}>
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute
                  showWhenAuthenticated={
                    <>
                      {isERXEnabled &&
                      ((currentUser?.hasRole([RoleType.Prescriber]) && currentUser.isPractitionerEnrolledInERX) ||
                        wasEnrolledInERX) ? (
                        <photon-client
                          id={import.meta.env.VITE_APP_PHOTON_CLIENT_ID}
                          org={import.meta.env.VITE_APP_PHOTON_ORG_ID}
                          dev-mode="true"
                          auto-login="true"
                          redirect-uri={window.location.origin}
                          // connection={import.meta.env.VITE_APP_PHOTON_CONNECTION_NAME}
                        >
                          <Outlet />
                        </photon-client>
                      ) : (
                        <Outlet />
                      )}
                    </>
                  }
                />
              }
            >
              <Route path="/version" element={<Version />} />
              {roleUnknown && (
                <>
                  <Route path="/logout" element={<Logout />} />
                  <Route path="*" element={<LoadingScreen />} />
                </>
              )}
              {currentUser?.hasRole([RoleType.Administrator, RoleType.Manager]) && (
                <>
                  <Route path="/" element={<Navigate to="/visits" />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/visits" element={<AppointmentsPage />} />
                  <Route path="/visits/add" element={<AddPatient />} />
                  <Route path="/visit/:id" element={<AppointmentPage />} />
                  <Route path="/schedules" element={<SchedulesPage />} />
                  <Route path="/schedule/:schedule-type/add" element={<AddSchedulePage />} />
                  <Route path="/schedule/:schedule-type/:id" element={<SchedulePage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/patient/:id" element={<PatientInformationPage />} />
                  <Route path="/telemed-admin" element={<Navigate to={INSURANCES_PATH} />} />
                  <Route path="/telemed-admin/states" element={<TelemedAdminPage />} />
                  <Route path="/telemed-admin/states/:state" element={<EditStatePage />} />

                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/employee" element={<AdminPage />} />
                  <Route path="/admin/employeex/:id" element={<EditEmployeePage />} />
                  <Route path="/admin/employee/:id" element={<EditEmployee />} />
                  <Route path="/admin/employee/new" element={<EditEmployee />} />
                  <Route path="/admin/insurance" element={<AdminPage />} />
                  <Route path="/admin/insurance/:id" element={<EditInsurance />} />
                  <Route path="/admin/insurance/new" element={<EditInsurance />} />
                  <Route path="/admin/state" element={<AdminPage />} />
                  <Route path="/admin/state/:state" element={<EditState />} />



                  <Route path="*" element={<Navigate to={'/'} />} />
                  {/* TODO: remove in production */}
                  <Route path="/test" element={<Resources />} />
                </>
              )}
              {currentUser?.hasRole([RoleType.Administrator, RoleType.Provider]) && (
                <>
                  <Route path="/" element={<Navigate to="/visits" />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/visits" element={<AppointmentsPage />} />
                  <Route path="/visits/add" element={<AddPatient />} />
                  <Route path="/patient/:id" element={<PatientInformationPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  {/** telemed */}
                  <Route
                    path="/telemed/appointments"
                    element={
                      <Suspense fallback={<LoadingScreen />}>
                        <TelemedTrackingBoardPageLazy />
                      </Suspense>
                    }
                  ></Route>
                  <Route
                    path="/telemed/appointments/:id"
                    element={
                      <Suspense fallback={<LoadingScreen />}>
                        <TelemedAppointmentPageLazy />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<Navigate to={'/'} />} />
                </>
              )}
            </Route>
          </Routes>
        </TabContext>
      </BrowserRouter>
    </CustomThemeProvider>
  );
}

export default App;

import { AccountCircle, KeyboardArrowDown } from '@mui/icons-material';
import { TabList } from '@mui/lab';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  // IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Tab,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { MouseEvent, ReactElement, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo-4x.png';
import useOttehrUser from '../../hooks/useOttehrUser';
import { AppTab, useNavStore } from '../../state/nav.store';
import { isLocalOrDevOrTestingOrTrainingEnv } from '../../telemed/utils/env.helper';
import { RoleType } from '../../types/types';
import { otherColors } from '../../CustomThemeProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, UserSquare2, Building2, Video, Settings, CalendarDays, Accessibility, BriefcaseBusiness, Lock, Headset  } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import React from 'react';

const { VITE_APP_ORGANIZATION_NAME_SHORT: ORGANIZATION_NAME_SHORT } = import.meta.env;
if (ORGANIZATION_NAME_SHORT == null) {
  throw new Error('Could not load env variable');
}

type NavbarItems = {
  [key in AppTab]?: {
    urls: string[];
    icon: React.ReactNode;
  };
};

const administratorNavbarItems: NavbarItems = {
  'In Person': {
    urls: ['/visits', '/visit'],
    icon: <Building2 className="h-4 w-4" />,
  },
  Schedules: {
    urls: ['/schedules', '/schedule'],
    icon: <Calendar className="h-4 w-4" />,
  },
  Patients: {
    urls: ['/patients', '/patient'],
    icon: <Users className="h-4 w-4" />,
  },
  Employees: {
    urls: ['/employees', '/employee'],
    icon: <UserSquare2 className="h-4 w-4" />,
  },
};

const managerNavbarItems: NavbarItems = {
  'In Person': { urls: ['/visits', '/visit'] },
  Schedules: { urls: ['/schedules', '/schedule'] },
  Patients: { urls: ['/patients', '/patient'] },
  Employees: { urls: ['/employees', '/employee'] },
};

const staffNavbarItems: NavbarItems = {
  'In Person': { urls: ['/visits', '/visit'] },
  Patients: { urls: ['/patients', '/patient'] },
};

const providerNavbarItems: NavbarItems = {
  'In Person': { urls: ['/visits', '/visit'] },
  Patients: { urls: ['/patients', '/patient'] },
};

administratorNavbarItems['Admin'] = {
  urls: ['/telemed-admin'],
  icon: <Settings className="h-4 w-4" />,
};
administratorNavbarItems['Telemedicine'] = {
  urls: ['/telemed/appointments', '/telemed', '/video-call'],
  icon: <Video className="h-4 w-4" />,
};
managerNavbarItems['Admin'] = { urls: ['/telemed-admin'] };
providerNavbarItems['Telemedicine'] = { urls: ['/telemed/appointments', '/telemed', '/video-call'] };
providerNavbarItems['Employees'] = { urls: ['/employees', '/employee'] };

export default function Navbar(): ReactElement {
  const theme = useTheme();
  const location = useLocation();
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const currentTab = useNavStore((state) => state.currentTab);
  const user = useOttehrUser();

  const navbarItems: NavbarItems = useMemo(() => {
    let navItems = {};

    if (user) {
      if (user.hasRole([RoleType.Administrator])) {
        navItems = { ...navItems, ...administratorNavbarItems };
      }
      if (user.hasRole([RoleType.Manager])) {
        navItems = { ...navItems, ...managerNavbarItems };
      }
      if (user.hasRole([RoleType.Staff])) {
        navItems = { ...navItems, ...staffNavbarItems };
      }
      if (user.hasRole([RoleType.Provider])) {
        navItems = { ...navItems, ...providerNavbarItems };
      }
    }
    return navItems;
  }, [user]);

  // on page load set the tab to the opened page
  const currentUrl = '/' + location.pathname.substring(1).split('/')[0];

  useEffect(() => {
    if (!currentTab) {
      useNavStore.setState({ currentTab: 'In Person' });
    }

    (Object.keys(navbarItems) as AppTab[]).forEach((navbarItem) => {
      if (navbarItems[navbarItem]!.urls.includes(currentUrl)) {
        useNavStore.setState({ currentTab: navbarItem });
      }
    });
  }, [currentTab, currentUrl, location.pathname, navbarItems]);

  if (location.pathname.match(/^\/telemed\/appointments\//) || location.pathname.match(/^\/visit\//)) {
    return <></>;
  }

  const menuItems = [
    {name: 'In Person', url: ['/visits', '/visit'],
    icon: <Users className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    }, 
    {name: 'Schedules', url: ['/schedules', '/schedule'], icon: <CalendarDays className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />}, 
    {name: 'Patients', url: ['/patients', '/patient'],icon: <Accessibility className="mx-auto my-auto text-[#4b5c6b] w-[35px] h-[35px]" />
    }, 
    {name: 'Employees', url: ['/employees', '/employee'],icon: <BriefcaseBusiness className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    }, 
    {name: 'Admin', url: ['/telemed-admin', '/video-call'],icon: <Lock className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    },
    {name: 'Telemedicine', url: ['/telemed/appointments', '/video-call', '/telemed/appointments'],icon: <Headset className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    }];
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  // console.log(currentTab);
  console.log(user);
  return (
    <>
      {/* New Navbar */}
      <div id="navbar-container" className='flex justify-center items-center px-[30px] pt-[10px] bg-white relative top-0 left-0 right-0 z-10 border-b border-gray-300'
      // style={{display: 'none'}}
      >
        <div id="navbar-wrapper" className='flex flex-row justify-between items-center w-full max-w-[1488px] mx-auto'>
          <div id="navbar-left-container" className='flex flex-row pr-[5px] mb-[5px]'>
            <Link to="/" id="navbar-logo-link" className='text-decoration-none '>
                
                <div id="navbar-logo-container" className='flex flex-row select-none'>
                  <p id="navbar-logo-text-conjure" className='text-3xl font-bold text-black no-underline'>Conjure</p>
                  <p id="navbar-logo-text-health" className='text-3xl font-bold text-[#D3455B] no-underline'>EHR</p>
                </div>
            </Link>
          </div>

          <div id="navbar-center-container" className='flex flex-row mt-[14px] select-none transition-all duration-300 ease-in-out h-full'>
            {menuItems.map((menuItem) => (
              
                <div id="navbar-center-menu-container" className={`flex flex-col pb-[7px] px-[16px] justify-center items-center w-fit ${menuItem.url.some(url => location.pathname.startsWith(url)) ? 'border-b-4 border-[#D3455B]' : ''}`} key={menuItem.name}>
                  <Link to={menuItem.url[0]} id="navbar-center-menu" className='flex flex-col text-decoration-none m-0 auto'>

                    {menuItem.icon && React.cloneElement(menuItem.icon as React.ReactElement, {
                      className: `mx-auto my-auto ${menuItem.url.some(url => location.pathname.startsWith(url)) ? 'text-[#D3455B]' : 'text-[#4b5c6b]'} mb-[3px] w-[30px] h-[30px]`
                    })}

                    <p id="navbar-menu-text" className={`text-[16px] font-semibold ${menuItem.url.some(url => location.pathname.startsWith(url)) ? 'text-[#D3455B]' : 'text-[#4b5c6b]'} no-underline cursor-pointer m-0 auto text-nowrap`}>{menuItem.name}</p>
                  </Link>
                </div>
              ))}
          </div>
          
          <div id="navbar-right-container" className='flex flex-row cursor-pointer mb-[5px]'
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            <div id="navbar-right-user-name" className=' hidden lg:flex flex-row items-center text-[16px] font-bold bg-[#D3455B] mr-[10px] my-auto p-[5px_20px_5px_20px] rounded-[50px]' >
              <b className='text-white'>Hi {user?.name}!</b>
              <img src="/waving-hand-emoji.png" alt="waving emoji" className='hidden lg:flex w-[25px] h-[25px] ml-[5px] select-none' />
            </div>
            <div className="navbar-right-menu-dropdown relative inline-block text-left">
              
              {/* User Menu Icon */}
              <div id="navbar-right-menu-container" className="select-none flex flex-row justify-center items-center bg-[#F6DADE] rounded-[50%] p-[10px] cursor-pointer"
              >
              {/* <img src="/red-user-icon.png" alt="red user icon" className='w-[30px] h-[30px]' /> */}
              <div className='text-[#D3455B] text-l font-bold'>{getInitials(user?.name)}</div>
              </div>
              
              {/* User Menu Dropdown */}
              <div id="dropdownDivider" className={`z-10 ${isUserDropdownOpen ? 'absolute' : 'hidden'} bg-white divide-y divide-gray-100 rounded-lg w-44 dark:bg-gray-700 dark:divide-gray-600 right-0 mt-2 origin-top-right shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                  <div className="block px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm">
                    
                    <p className='mb-1'>
                    {ORGANIZATION_NAME_SHORT} Admin
                    </p>
                    <p className='text-xs'>
                    {user?.email}
                    </p>
                  </div>
                  <div className="py-2">
                    <a href="/logout" className="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:hover:bg-red-600 dark:text-red-200 dark:hover:text-white">Logout</a>
                  </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Old Navbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 flex flex-col" 
      style={{ display: 'none' }}
      >
        <Container maxWidth="xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <h1 className="text-3xl font-bold text-black">
                  Conjure<span className="text-red-500">EHR</span>
                </h1>
              </Link>
            </div>
            <div>
              <TabList
                onChange={(_: SyntheticEvent, value: string) => {
                  useNavStore.setState({ currentTab: value });
                }}
                sx={{
                  mt: 2.5,
                  minHeight: 60,
                  flexGrow: 1,
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#ED1B24', // or any yellow color you prefer
                  },
                  '& .Mui-selected': {
                    color: '#ED1B24 !important', // active tab text color
                  },
                }}
                // textColor="primary"
                // indicatorColor="primary"
              >
                {currentTab &&
                  (Object.keys(navbarItems) as AppTab[]).map((navbarItem, index) => (
                    <Tab
                      key={navbarItem}
                      label={
                        <div className="flex flex-col items-center gap-1 rounded-md">
                          {/* {navbarItems[navbarItem.toString()].icon} */}
                          <Users className="h-4 w-4" />
                          {navbarItem}
                        </div>
                      }
                      value={navbarItem}
                      id={`navbar-tab-${index}`}
                      aria-controls={`hello-${index}`} // `tabpanel-${index}`
                      component={Link}
                      to={navbarItems[navbarItem]!.urls?.[0]}
                      sx={{
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        color: '#000000',
                      }}
                    />
                  ))}
              </TabList>
            </div>

            <div className="flex items-center justify-between">
              {/* <Typography variant="body1" sx={{ mr: 2, color: '#000000' }}>
                {user?.name || <Skeleton width={100} aria-busy="true" />}
              </Typography> */}
              <Button
                sx={{ color: '#ef4444' }} // Tailwind red-500 color
                aria-label="open user account menu"
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={(event: MouseEvent<HTMLElement>) => setAnchorElement(event.currentTarget)}
                endIcon={<KeyboardArrowDown />}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://randomuser.me/api/portraits/med/men/${100}.jpg`} />
                  <AvatarFallback className="bg-blue-50 text-black">
                  {getInitials(user?.name)}
                    {/* CV */}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <Menu
                id="user-menu"
                anchorEl={anchorElement}
                open={anchorElement !== null}
                onClose={() => setAnchorElement(null)}
              >
                <MenuItem>
                  <Box>
                    <Typography variant="body1">{ORGANIZATION_NAME_SHORT} Admin</Typography>
                    <Typography variant="caption">{user?.email}</Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <Link to="/logout" style={{ textDecoration: 'none' }}>
                  <MenuItem>
                    <Typography variant="body1" color="#ef4444" sx={{ fontWeight: 'bold' }}>
                      Log out
                    </Typography>
                  </MenuItem>
                </Link>
              </Menu>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}

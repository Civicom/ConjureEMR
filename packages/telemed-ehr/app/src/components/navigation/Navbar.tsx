import { ReactElement, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useOttehrUser from '../../hooks/useOttehrUser';
import { Users, CalendarDays, Accessibility, BriefcaseBusiness, Lock, Headset  } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import React from 'react';

const { VITE_APP_ORGANIZATION_NAME_SHORT: ORGANIZATION_NAME_SHORT } = import.meta.env;
if (ORGANIZATION_NAME_SHORT == null) {
  throw new Error('Could not load env variable');
}

export default function Navbar(): ReactElement {
  const location = useLocation();
  const user = useOttehrUser();

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
    // {name: 'Employees', url: ['/employees', '/employee'],icon: <BriefcaseBusiness className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    // }, 
    {name: 'Admin', url: ['/admin', '/admin/employee', '/admin/insurance', '/admin/state'],icon: <Lock className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    },
    // {name: 'Telemedicine', url: ['/telemed/appointments', '/video-call', '/telemed/appointments'],icon: <Headset className="mx-auto my-auto text-[#4b5c6b] w-[30px] h-[30px]" />
    // }
  ];
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  console.log(user);
  return (
    <>
      <div id="navbar-container" className='flex justify-center items-center px-[30px] pt-[10px] bg-white relative top-0 left-0 right-0 z-10 border-b border-gray-300'>
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
    </>
  );
}

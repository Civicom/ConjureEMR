import React, { FC } from 'react';
import { TabContext, TabList } from '@mui/lab';
import { Box, Tab, Typography } from '@mui/material';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import { getSelectors } from '../../../shared/store/getSelectors';
import { useAppointmentStore } from '../../state';
import { ContractEditIcon, DiagnosisIcon, PatientListIcon, StethoscopeIcon } from '../../assets';
import { Link } from 'react-router-dom';

export const AppointmentTabsHeader: FC = () => {
  const { currentTab } = getSelectors(useAppointmentStore, ['currentTab']);

  const handleTabChange = (newTabName: string): void => {
    useAppointmentStore.setState({ currentTab: newTabName });
  };

  const menuItems = [
    { name: 'Notes', value: 'hpi' },
    { name: 'Exam', value: 'exam' },
    { name: 'eRX and Assessment', value: 'erx' },
    { name: 'Plan', value: 'plan' },
    { name: 'Review and Sign', value: 'sign' },
  ];

  return (
    <>
      <div>
        <div className='flex flex-row mt-[14px] select-none transition-all duration-300 ease-in-out h-full'>
            {menuItems.map((menuItem) => (              
                <div className={`flex flex-col pb-[0.75rem] px-[1rem] justify-center items-center w-fit border-b-4 ${menuItem.value == currentTab ? 'border-[#D3455B]' : 'border-[#fff]'}`} key={menuItem.value}
                  onClick={() => handleTabChange(menuItem.value)}>
                  <p className={`text-[16px] font-semibold ${menuItem.value == currentTab ? 'text-[#D3455B]' : 'text-[#4b5c6b]'} no-underline cursor-pointer m-0 auto text-nowrap`}>{menuItem.name}</p>                  
                </div>
              ))}
          </div>
      </div>
      <div style={{ display: 'none' }}>
        <TabContext value={currentTab}>
          <TabList>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <AssignmentIndOutlinedIcon />
                  <Typography sx={{ textTransform: 'none', fontWeight: 700, fontSize: '14px' }}>
                    Medical history
                  </Typography>
                </Box>
              }
              value="hpi"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StethoscopeIcon />
                  <Typography sx={{ textTransform: 'none', fontWeight: 700, fontSize: '14px' }}>Exam</Typography>
                </Box>
              }
              value="exam"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <DiagnosisIcon />
                  <Typography sx={{ textTransform: 'none', fontWeight: 700, fontSize: '14px' }}>
                    eRX and Assessment
                  </Typography>
                </Box>
              }
              value="erx"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PatientListIcon />
                  <Typography sx={{ textTransform: 'none', fontWeight: 700, fontSize: '14px' }}>Plan</Typography>
                </Box>
              }
              value="plan"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ContractEditIcon />
                  <Typography sx={{ textTransform: 'none', fontWeight: 700, fontSize: '14px' }}>Review and Sign</Typography>
                </Box>
              }
              value="sign"
            />
          </TabList>
        </TabContext>
      </div>
    </>
  );
};

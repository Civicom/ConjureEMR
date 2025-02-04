import { FC } from 'react';
import { getSelectors } from '@/shared/store/getSelectors';
import { useAppointmentStore } from '@/state/appointment';
import { NotebookPen, Signature } from 'lucide-react';

export const AppointmentTabsHeader: FC = () => {
  const { currentTab } = getSelectors(useAppointmentStore, ['currentTab']);

  const handleTabChange = (newTabName: string): void => {
    useAppointmentStore.setState({ currentTab: newTabName });
  };

  const menuItems = [
    { name: 'Notes', value: 'notes', icon: <NotebookPen className='w-4 h-4 ' /> },
    { name: 'Apply and Sign', value: 'sign', icon: <Signature className='w-4 h-4' /> },
  ];

  return (
    <div className='flex flex-row select-none transition-all duration-300 ease-in-out h-full'>
        {menuItems.map((menuItem) => (              
            <div className={`flex py-[1rem] px-[1rem] justify-center items-center cursor-pointer border-b-4 ${menuItem.value == currentTab ? 'border-[#D3455B] text-[#D3455B]' : 'border-[#fff] text-[#4b5c6b]'}`} key={menuItem.value}
              onClick={() => handleTabChange(menuItem.value)}>
              {menuItem.icon} <p className={`text-[16px] font-semibold text-nowrap ml-2`}>{menuItem.name}</p>                  
            </div>
          ))}
    </div>
  );
};

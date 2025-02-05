import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AppointmentTabsHeader } from './AppointmentTabsHeader';

interface AppointmentHeaderProps {
  onClose: () => void;
}

export const AppointmentHeader: FC<AppointmentHeaderProps> = ({ onClose }) => {

  return (
    <div id="appointment-header">
      <div className="flex mx-3 items-center">        
        <Button onClick={onClose} className='bg-white text-red-500 hover:bg-red-600 hover:text-white border border-red-500 mr-[1rem]'>
          <ArrowLeft /> Back to Visits
        </Button>        

        <AppointmentTabsHeader />
      </div>
    </div>
  );
};

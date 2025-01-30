import { FC } from 'react';
import { AppBar, Box, useTheme } from '@mui/material';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppointmentTabsHeader } from './AppointmentTabsHeader';
import { ArrowLeft } from 'lucide-react';

interface AppointmentHeaderProps {
  onClose: () => void;
}

export const AppointmentHeader: FC<AppointmentHeaderProps> = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        backgroundColor: theme.palette.background.paper,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box sx={{ display: 'flex', mt: 1, mx: 3, justifyContent: 'space-between', alignItems: 'start' }}>        
        <Button onClick={onClose} className='bg-white text-red-500 hover:bg-red-600 hover:text-white border border-red-500'>
          <ArrowLeft /> Go Back to General Info
        </Button>        

        <AppointmentTabsHeader />
      </Box>
    </AppBar>
  );
};

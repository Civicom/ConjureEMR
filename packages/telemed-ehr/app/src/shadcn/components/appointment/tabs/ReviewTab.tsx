import React, { FC } from 'react';
import { getSelectors } from '../../../../shared/store/getSelectors';
import { useAppointmentStore } from '../../../../state';
import { Button } from '@/components/ui/button';

export const ReviewTab: FC = () => {
  const { isChartDataLoading } = getSelectors(useAppointmentStore, ['isChartDataLoading']);

  if (isChartDataLoading) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <div>
        <Button>Sign</Button>
    </div>
  );
};

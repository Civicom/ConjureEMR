import React, { FC, useEffect } from 'react';
import { getSelectors } from '../../../shared/store/getSelectors';
import { EXAM_OBSERVATIONS_FIELDS, useAppointmentStore, useGetChartData } from '@/telemed';
import { useZapEHRAPIClient } from '@/telemed/hooks/useZapEHRAPIClient';
import { useExamObservations } from '@/telemed/hooks/useExamObservations';

import { cn } from "@/lib/utils";

type TabBoxProps = {
    title?: string;
    children: React.ReactNode;
    className?: string;
};

const TabBox = ({ title, children, className }: TabBoxProps) => {
    return (
        <div className={cn("bg-white rounded-lg border border-gray-300", className)}>
            { title && <div>
                <div className="text-lg bg-gray-100 rounded-lg px-4 py-3">{title}</div>
            </div> }
            <div className="p-4">{children}</div>
        </div>
    );
};

export const AppointmentTabs: FC = () => {
  const apiClient = useZapEHRAPIClient();
  const { currentTab, encounter, chartData, isReadOnly } = getSelectors(useAppointmentStore, [
    'currentTab',
    'encounter',
    'chartData',
    'isReadOnly',
  ]);
  const { update, isLoading } = useExamObservations();

  const { isFetching } = useGetChartData({ apiClient, encounterId: encounter.id }, (data) => {
    useAppointmentStore.setState({ chartData: data });
    update(EXAM_OBSERVATIONS_FIELDS, (data.examObservations && data.examObservations.length > 0) || isReadOnly);
    update(data.examObservations, true);
  });

  useEffect(() => {
    useAppointmentStore.setState({ isChartDataLoading: isFetching || !chartData });
  }, [chartData, isFetching]);

  useEffect(() => {
    useAppointmentStore.setState({ isExamObservationsLoading: isFetching || !chartData || isLoading });
  }, [chartData, isFetching, isLoading]);

  return (
      <div id="appointment-tabs">
        <TabBox title="Notes">            

        </TabBox>
      </div>
  );
};

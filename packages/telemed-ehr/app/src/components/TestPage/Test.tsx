import { useApiClients } from '@/hooks/useAppClients';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Appointment, Location, Resource } from 'fhir/r4';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Locations } from './Locations';
import { Patients } from './Patients';
import { Appointments } from './Appointments';

const Resources = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-4">
      <div className="h-fit">
        <Appointments />
      </div>
      <div className="h-fit">
        <Locations />
      </div>
      <div className="h-fit">
        <Patients />
      </div>
    </div>
  );
};

export default Resources;

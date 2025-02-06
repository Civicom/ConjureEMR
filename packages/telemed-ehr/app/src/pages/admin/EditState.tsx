import * as React from 'react';
import { AllStates, AllStatesToNames, State, StateType } from '@/types/types';
import { useStatesQuery } from '@/telemed/features/telemed-admin/telemed-admin.queries';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { FhirClient } from '@zapehr/sdk';
import { Location } from 'fhir/r4';
import { useApiClients } from '@/hooks/useAppClients';
import PageContainer from '@/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
type StateDetails = {
  state: StateType;
  name: string;
  abbreviation: string;
  operateInState: boolean;
}


export default function EditState(): JSX.Element {

    const { state } = useParams();
    const fullLabel = `${state} - ${AllStatesToNames[state as StateType]}`;
    const [isOperateInStateChecked, setIsOperateInStateChecked] = useState<boolean>(false);
    const [stateName, setStateName] = useState<string | undefined>(undefined);
    const { fhirClient } = useApiClients();
    if (!fhirClient || !state) {
        throw new Error('fhirClient or state is not initialized.');
    }
    
    return (
        <PageContainer tabTitle={'Admin'}>
            <div className="flex flex-col max-w-7xl mx-auto my-16 px-4">
                <div className="space-y-8">
                    <h1 className="text-2xl font-bold">Edit {fullLabel}</h1>
                </div>
                <div className="w-full">
                    <div className="rounded-md border bg-white">
                        <Input placeholder="Location Name" value={stateName} />
                        <Checkbox checked={isOperateInStateChecked}>Operate in this state</Checkbox>
                        <Button>Save</Button> <Button>Cancel</Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
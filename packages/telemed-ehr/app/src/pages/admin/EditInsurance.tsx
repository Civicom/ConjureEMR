import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { InsurancePlan } from "fhir/r4";
import { useInsuranceMutation, useInsuranceOrganizationsQuery, useInsurancesQuery } from "@/telemed/features/telemed-admin/telemed-admin.queries";
import { PUBLIC_EXTENSION_BASE_URL } from "ehr-utils";
import { ReactElement, useRef, useState } from "react";

let renderCount = 0;

export const INSURANCE_SETTINGS_MAP = {
    requiresSubscriberId: 'Requires subscriber Id',
    requiresSubscriberName: 'Requires subscriber name',
    requiresSubscriberDOB: 'Requires subscriber date of birth',
    requiresRelationshipToSubscriber: 'Requires relationship to subscriber',
    requiresInsuranceName: 'Requires insurance name',
    requiresInsuranceCardImage: 'Requires insurance card image',
};

type InsuranceSettingsBooleans = {
    [key in keyof typeof INSURANCE_SETTINGS_MAP]: boolean;
};

interface PayorOrg {
    name?: string;
    id?: string;
}

export type InsuranceData = InsuranceSettingsBooleans & {
    id: InsurancePlan['id'];
    payor?: PayorOrg;
    displayName: string;
    status: Extract<InsurancePlan['status'], 'active' | 'retired'>;
};

type InsuranceForm = {
    id?: string | undefined;
    displayName?: string | undefined;
    payorId?: string | undefined;
    settings: InsuranceSettingsBooleans;
};

const BlankInsuranceForm: InsuranceForm = {
    id: undefined,
    displayName: undefined,
    payorId: undefined,
    settings: {
        requiresSubscriberId: false,
        requiresSubscriberName: false,
        requiresSubscriberDOB: false,
        requiresRelationshipToSubscriber: false,
        requiresInsuranceName: false,
        requiresInsuranceCardImage: false,
    }
};

function getInsurancePayor(insuranceDetails: InsurancePlan, orgs: PayorOrg[]): PayorOrg | undefined {
    if (!insuranceDetails.ownedBy?.reference) {
        return undefined;
    }
    return orgs.find((org) => org.id === insuranceDetails.ownedBy?.reference?.replace('Organization/', ''));
}

function payorbyId(payors: PayorOrg[], id: string): PayorOrg | undefined {
    return payors.find((payor) => payor.id === id);
}

export default function EditInsuranceX(): ReactElement {

    const { insurance: insuranceIdParam } = useParams();
    const insuranceId = insuranceIdParam;
    const isNew = insuranceId === undefined;
    const didSetInsuranceDetailsForm = useRef(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { register, getValues, setValue, reset, formState: { errors }   } = useForm<InsuranceForm>({
        defaultValues: BlankInsuranceForm
    });

    ++renderCount;

    // load insurance plan
    const {
        data: insuranceData,
        isFetching: insuranceDataLoading,
        refetch: refetchInsuranceData,
      } = useInsurancesQuery(insuranceId, insuranceId !== undefined);
    const insuranceDetails = isNew ? undefined : insuranceData?.[0];
    const isActive = insuranceDetails?.status === 'active';   

    // load payors from organizations where type == pay
    const { isFetching: insuranceOrgsFetching, data: insuranceOrgsData } = useInsuranceOrganizationsQuery();
    const insurancePayorOrgs: PayorOrg[] = insuranceOrgsData?.map((org) => ({ 
        name: org.name, id: org.id 
    })) || [{ id: '', name: '' },];

    const insuranceRelatedDataFetching = insuranceDataLoading || insuranceOrgsFetching;

    const insurancePayor =
        insuranceId && insuranceDetails && insurancePayorOrgs
            ? getInsurancePayor(insuranceDetails, insurancePayorOrgs)
            : undefined;
    
    const settingsMap = Object.fromEntries(
        Object.entries(INSURANCE_SETTINGS_MAP).map(([key, _]) => [key as keyof typeof INSURANCE_SETTINGS_MAP, false]),
    ) as InsuranceSettingsBooleans;
            
    insuranceDetails?.extension
        ?.find((ext) => ext.url === `${PUBLIC_EXTENSION_BASE_URL}/insurance-requirements`)
            ?.extension?.forEach((settingExt) => {
                settingsMap[settingExt.url as keyof typeof INSURANCE_SETTINGS_MAP] = settingExt.valueBoolean || false;
            }
        );

    if (insuranceDetails && insuranceOrgsData && !didSetInsuranceDetailsForm.current) {
        reset({
            payorId: insurancePayor?.id,
            displayName: insuranceDetails.name,
            settings: settingsMap,
        });
        didSetInsuranceDetailsForm.current = true;
    }

    const { mutateAsync: mutateInsurance, isLoading: mutationPending } = useInsuranceMutation(insuranceId);
    

    const saveInsurance = async (): Promise<void> => {

    };  

    const onSubmit = async (event: any): Promise<void> => {

        setError('');
        event.preventDefault();
        const formData = getValues();
        try {
            await mutateInsurance({
                id: insuranceId,
                status: insuranceDetails?.status === 'active' ? 'active' : 'retired',
                payor: payorbyId(insurancePayorOrgs, formData.payorId || ''),
                displayName: formData.displayName || '',
                ...formData.settings
            });

        } catch {
            setError('Error trying to save insurance configuration. Please, try again');
        }
    };
    
    const handleStatusChange = async (newStatus: InsuranceData['status']): Promise<void> => {

        const formData = getValues();
        try {
            await mutateInsurance({
              id: insuranceId,
              payor: insurancePayor!,
              displayName: insuranceDetails!.name || '',
              ...formData.settings,
              status: newStatus,
            });
            await refetchInsuranceData();
          } catch {
            setError('Error trying to change insurance configuration status. Please, try again');
          }
    };

    return (
        <div className="flex flex-col max-w-7xl mx-auto my-16 px-4 border-gray-500">
            <form 
                className="p-4 border rounded shadow-md max-w-3xs " 
                onSubmit={onSubmit}
            >
                <div>
                    {/*
                    <div>Render Count: {renderCount}</div>
                    <div>Insurance ID: {isNew ? 'New' : insuranceId}</div>
                    <div>Insurance Details: <code>{JSON.stringify(insuranceDetails, null, 2)}</code></div>
                    <div>Insurance Form: <code>{JSON.stringify(getValues(), null, 2)}</code></div>
                    <div>SettingsMap: <code>{JSON.stringify(settingsMap, null, 2)}</code></div>
                    */}
                </div>
                <div className="mb-4">
                    <label className="block font-bold">Name:</label>
                    <input
                        type="text"
                        placeholder="Insurance name"
                        {...register("displayName", {
                            required: "Insurance name is Required", 
                            minLength: {
                                value: 3, 
                                message: "Insurance name must be at least 3 characters"
                            }                        
                        })}
                        className="w-full p-2 border rounded"
                    />
                    <p className="text-red-500">{errors.displayName?.message}</p>
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Payor:</label>
                    <select
                        {...register("payorId", {required: "You must select a payor"})}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select a payor</option>
                        {insurancePayorOrgs.map((payor) => (
                            <option key={payor.id} value={payor.id}>
                                {payor.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-red-500">{errors.payorId?.message}</p>
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Options:</label>
                    {
                        Object.entries(INSURANCE_SETTINGS_MAP).map(([key, value]) => {
                            const settingKey = `settings.${key}` as const;
                            return (
                                <div key={key} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        {...register(settingKey)}
                                        className="mr-2"
                                    />
                                    <span>{value}</span>
                                </div>
                            );
                        })
                    }
                </div>
                <div className="mb-4">
                    <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded">
                        Save
                    </button>
                    <Link to="/admin/insurance">
                        <button className="px-4 py-2 bg-white text-red-500 border border-red-500 rounded">
                            Cancel
                        </button>
                    </Link>
                </div>
            </form>
            <div className="mb-4">
                {(isNew === false && insuranceRelatedDataFetching === false) &&
                    <div>
                   		<div>{isActive ? 'Deactivate' : 'Activate'} insurance</div>
                        <div>
                			{isActive
				                ? 'When you deactivate this insurance, patients will not be able to select it.'
				                : 'Activate this license.'}
		                </div>
                        <div>
		                    <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={() => handleStatusChange(isActive ? 'retired' : 'active')}>
			                    {isActive ? 'Deactivate' : 'Activate'}
		                    </button>
	                    </div>
                    </div>
                }
            </div>
        </div>
    )
}


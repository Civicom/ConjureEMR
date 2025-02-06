import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useInsuranceMutation, useInsuranceOrganizationsQuery, 
    useInsurancesQuery } from "@/telemed/features/telemed-admin/telemed-admin.queries";
import { PUBLIC_EXTENSION_BASE_URL } from "ehr-utils";
import { ReactElement, useRef, useState } from "react";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { InsuranceSettingsBooleans, INSURANCE_SETTINGS_MAP, 
        BlankInsuranceForm, InsuranceForm, PayorOrg, 
        getInsurancePayor, payorbyId, InsuranceData } from "./helpers/Constants";



let renderCount = 0;


export default function EditInsurance(): ReactElement {

    const { id: insuranceIdParam } = useParams();
    const insuranceId = insuranceIdParam;
    const isNew = insuranceId === undefined;
    const didSetInsuranceDetailsForm = useRef(false);
    const [error, setError] = useState('');

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
    const pageName = isNew ? 'New Insurance' : insuranceDetails?.name;
    return (
        <div className="flex flex-col max-w-7xl mx-auto my-16 px-4 border-gray-500">
            <Breadcrumbs pageName={pageName} />
            <form 
                className="p-4 border rounded shadow-md max-w-3xs " 
                onSubmit={onSubmit}
            >
                <div>
                    {/*
                    <div>Render Count: {renderCount}</div>
                    <div>Insurance ID: {insuranceId}</div>
                    <div>Is New: {isNew ? 'Yes' : 'No'}</div>
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
                                <div key={key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-grey-400 focus:ring-2" 
                                        {...register(settingKey)}
                                    />
                                    <span>{value}</span>
                                </div>
                            );
                        })
                    }
                </div>
                <div className="mb-4 flex gap-2">
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


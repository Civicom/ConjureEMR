import { RoleType } from "ehr-utils";
import { InsurancePlan } from "fhir/r4";

export const AVAILABLE_ROLES: {
    value: RoleType;
    label: string;
    hint: string;
  }[] = [
    {
      value: RoleType.Administrator,
      label: 'Administrator',
      hint: `Adjust full settings for entire system`,
    },
    {
      value: RoleType.Manager,
      label: 'Manager',
      hint: `Adjust operating hours or schedule overrides; adjust pre-booked visits per hour`,
    },
    {
      value: RoleType.Staff,
      label: 'Staff',
      hint: `No settings changes; essentially read-only`,
    },
    {
      value: RoleType.Provider,
      label: 'Provider',
      hint: `A clinician, such as a doctor, a PA or an NP`,
    },
    {
      value: RoleType.Prescriber,
      label: 'Prescriber',
      hint: `A clinician that is allowed to prescribe`,
    },
  ];



export const INSURANCE_SETTINGS_MAP = {
    requiresSubscriberId: 'Requires subscriber Id',
    requiresSubscriberName: 'Requires subscriber name',
    requiresSubscriberDOB: 'Requires subscriber date of birth',
    requiresRelationshipToSubscriber: 'Requires relationship to subscriber',
    requiresInsuranceName: 'Requires insurance name',
    requiresInsuranceCardImage: 'Requires insurance card image',
};

export type InsuranceSettingsBooleans = {
    [key in keyof typeof INSURANCE_SETTINGS_MAP]: boolean;
};

export interface PayorOrg {
    name?: string;
    id?: string;
}

export type InsuranceForm = {
    id?: string | undefined;
    displayName?: string | undefined;
    payorId?: string | undefined;
    settings: InsuranceSettingsBooleans;
};

export type InsuranceData = InsuranceSettingsBooleans & {
    id: InsurancePlan['id'];
    payor?: PayorOrg;
    displayName: string;
    status: Extract<InsurancePlan['status'], 'active' | 'retired'>;
};

export const BlankInsuranceForm: InsuranceForm = {
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

export function getInsurancePayor(insuranceDetails: InsurancePlan, orgs: PayorOrg[]): PayorOrg | undefined {
    if (!insuranceDetails.ownedBy?.reference) {
        return undefined;
    }
    return orgs.find((org) => org.id === insuranceDetails.ownedBy?.reference?.replace('Organization/', ''));
}

export function payorbyId(payors: PayorOrg[], id: string): PayorOrg | undefined {
    return payors.find((payor) => payor.id === id);
}

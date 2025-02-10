import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Appointment, Location, Patient, RelatedPerson, Resource, PatientContact, Address, ContactPoint} from 'fhir/r4';
import {
  Cake,
  Calendar,
  CalendarPlus2,
  Clock,
  Clock1,
  EllipsisVertical,
  File,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Phone,
  UserRound,
  Video,
  User,
  LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { calculateAge, getInitials } from '@/lib/utils';
import { formatISODateToLocaleDate, formatISOStringToDateAndTime } from '../../helpers/formatDateTime';
import { Skeleton } from '@/components/ui/skeleton';

import { EditableField } from './EditableField';
import { useToast } from '../../hooks/use-toast';

import { formatAddress } from '@zapehr/sdk';
import { standardizePhoneNumber } from '../../../../../ehr-utils';

interface RelatedPersonUpdate {
  resourceType: 'RelatedPerson';
  id: string;
  telecom: ContactPoint[];
}

interface PatientField {
  label: string;
  value: string;
  icon: LucideIcon;
  editable?: boolean;
  type?: 'text' | 'date' | 'select';
  options?: string[];
  onUpdate?: (value: string) => Promise<void>;
}

interface Section {
  title?: string;
  fields: PatientField[];
}

export function PatientInfoCard({
  patient,
  loading,
  lastAppointment,
  onUpdatePatient,
  patientId,
}: {
  patient: Patient | undefined;
  loading: boolean;
  lastAppointment: string | undefined;
  onUpdatePatient: (updatedPatient: Patient) => Promise<void>;
  patientId: string | undefined; 
}) {
  const { toast } = useToast();
  

  const handleContactUpdate = async (type: 'phone' | 'email' | 'address' | 'gender' | 'birthDate', value: string) => {
    if (!patient?.id) {
      throw new Error('Patient data is not available');
    }
  
    try {
      console.log("patientData", patient)
      // Start with all existing patient data
      // const updatedPatient: Patient = {
      //   ...patient,
      //   resourceType: 'Patient',
      //   id: patientId,
      //   meta: patient.meta,
      //   active: true,
      // };
      if (type === 'gender') {
        // Create a specific update for gender
        const updatedPatient: Patient = {
          resourceType: 'Patient',
          gender: value as 'male' | 'female' | 'other' | 'unknown',
        };
        // console.log('Updating gender with:', updatedPatient);
        await onUpdatePatient(updatedPatient);
        toast({
          title: "Updated Successfully",
          description: `Gender has been updated.`,
        });
        return;
      }
      if (type === 'phone') {
        const updatedPatient: Patient = {
          resourceType: 'Patient',
          telecom: [
            // ...(patient.telecom?.filter(t => t.system !== 'phone' && t.system !== 'sms') || []),
            ...(patient.telecom?.filter(t => t.system !== 'phone') || []),
            {
              system: 'phone' as const,
              value: value,
              use: 'home' as const
            },
            // Add new sms entry
            // {
            //   system: 'sms' as const,
            //   value: value,
            //   use: 'home' as const
            // }
          ],
        };
      
        console.log('Updating phone with:', updatedPatient);
        await onUpdatePatient(updatedPatient);
        toast({
          title: "Updated Successfully",
          description: "Phone number has been updated.",
        });
        return;
      }
      if (type === 'email') {
        const updatedPatient: Patient = {
          resourceType: 'Patient',
          telecom: [
            ...(patient.telecom?.filter(t => t.system !== 'email') || []),
            {
              system: 'email' as const,
              value: value,
            },
          ],
        };
        // console.log('Updating email with:', updatedPatient);
        await onUpdatePatient(updatedPatient);
        toast({
          title: "Updated Successfully",
          description: "Email has been updated.",
        });
        return;
      }

      if (type === 'address') {
        updatedPatient.address = [value as Address];
      }
      if (type === 'birthDate') { 
        // Format the date to YYYY-MM-DD as required by FHIR
        const formattedDate = new Date(value).toISOString().split('T')[0];
        const updatedPatient: Patient = {
          resourceType: 'Patient',
          birthDate: formattedDate,
        };
         // console.log('Updating birthDate with:', updatedPatient);
        await onUpdatePatient(updatedPatient);
        toast({
          title: "Updated Successfully",
          description: `Birthday has been updated.`,
        });
        return;
      }
      toast({
        title: "Updated Successfully",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been updated.`,
      });
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update',
        variant: "destructive",
      });
      throw error;
    }
  };

  const location = useLocation();

  useEffect(() => {
    try {
      // Update fields when patient data changes
      const name = patient?.name?.[0];
      const phone = patient?.telecom?.find((t) => t.system === 'phone')?.value;
      const email = patient?.telecom?.find((t) => t.system === 'email')?.value;
      const address = patient?.address?.[0];
      const addressStr = address
        ? `${address.line?.[0] || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`
        : '-';

      visitInfoFields[0].value = formatISODateToLocaleDate(lastAppointment ?? '') ?? 'No visits'; // Last visit
      visitInfoFields[1].value = formatISODateToLocaleDate(patient?.meta?.lastUpdated ?? ''); // Next visit

      patientInfoFields[0].value = patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '';
      patientInfoFields[1].value = patient?.birthDate ? calculateAge(patient.birthDate).toString() : '';
      patientInfoFields[2].value = patient?.birthDate ?? '';

      contactInfoFields[0].value = phone ?? '';
      contactInfoFields[1].value = email || '';
      contactInfoFields[2].value = addressStr;
    } catch (e) {}
  }, [patient, location.pathname]);

  const patientName = `${patient?.name?.[0]?.family}, ${patient?.name?.[0]?.given?.[0]}`;
  const patientIsActive = patient?.active ?? false;

  // Construct fields data directly from patient
  const visitInfoFields = [
    {
      label: 'Last visit',
      icon: Calendar,
      value: formatISODateToLocaleDate(lastAppointment ?? '') ?? 'No visits',
      // value: formatISODateToLocaleDate(patient?.meta?.lastUpdated ?? 'N/A'), // This would need to come from appointments data
      // value: 'No visits', // This would need to come from appointments data
    },
    {
      label: 'Paperwork last updated',
      icon: File,
      value: formatISODateToLocaleDate(patient?.meta?.lastUpdated ?? ''),
    },
  ];

  const patientInfoFields = [
    {
      label: 'Gender',
      icon: UserRound,
      value: patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '',
    },
    {
      label: 'Age',
      icon: Clock1,
      value: patient?.birthDate ? calculateAge(patient.birthDate).toString() : '',
    },
    {
      label: 'Birthday',
      icon: Cake,
      value: patient?.birthDate || '',
    },
  ];

  const address = patient?.address?.[0];
  const addressStr = address
    ? // check if fields are not empty string
      [
        address.line?.[0] && `${address.line[0]}`,
        address.city && `${address.city}`,
        address.state && `${address.state}`,
        address.postalCode && `${address.postalCode}`,
      ]
        .filter(Boolean)
        .join(', ') || 'N/A'
    : 'N/A';

  const contactInfoFields = [
    {
      label: 'Phone',
      icon: Phone,
      value: patient?.telecom?.find((t) => t.system === 'phone')?.value || 'N/A',
    },
    {
      label: 'Email',
      icon: Mail,
      value: patient?.telecom?.find((t) => t.system === 'email')?.value || 'N/A',
    },
    {
      label: 'Address',
      icon: Home,
      value: addressStr,
    },
  ];

  // Add this helper function to format dates consistently
  const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(); // This will format as MM/DD/YYYY
  };

  const formatBirthDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      // Split the ISO date string directly
      const [year, month, day] = dateString.split('-');
      // Convert to M/D/YYYY format, ensuring we don't lose the correct date
      return `${parseInt(month)}/${parseInt(day)}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const sections: Section[] = [
    {
      title: "Patient Information",
      fields: [
        {
          label: 'Gender',
          value: patient?.gender || 'Unknown',
          icon: User,
          editable: true,
          type: 'select',
          options: ['male', 'female', 'other', 'unknown'],
          onUpdate: async (value: string) => {
            await handleContactUpdate('gender', value);
          },
        },
        {
          label: 'Birthday',
          value: formatBirthDate(patient?.birthDate),
          icon: Calendar,
          editable: true,
          type: 'date',
          onUpdate: (value: string) => handleContactUpdate('birthDate', value),
        },
      ]
    },
    {
      title: "Contact Information",
      fields: [
        {
          label: 'Address',
          // value: formatAddress(patient?.address?.[0] ?? { use: 'home', type: 'physical', country: 'USA' }) || 'N/A',
          value: patient?.address?.[0]?.line?.[0] || 'N/A',
          icon: Home,
          editable: false,
          onUpdate: (value: string) => handleContactUpdate('address', value),
        },
        {
          label: 'Phone',
          // value: getPhoneFromRelatedPerson() || 'N/A',
          value: standardizePhoneNumber(patient?.telecom?.find((t) => t.system === 'phone')?.value) || 'N/A',
          icon: Phone,
          editable: true,
          onUpdate: (value: string) => handleContactUpdate('phone', value),
        },
        {
          label: 'Email',
          value: patient?.telecom?.find((t) => t.system === 'email')?.value || 'N/A',
          icon: Mail,
          editable: true,
          onUpdate: (value: string) => handleContactUpdate('email', value),
        },
      ]
    },
    {
      title: "Visit Information",
      fields: [
        {
          label: 'Last Visit',
          value: lastAppointment ? formatISOStringToDateAndTime(lastAppointment) : 'No visits',
          icon: Clock,
          editable: false,
        },
        {
          label: 'Paperwork Last Updated',
          value: '03/15/2024, 14:30',
          icon: FileText,
          editable: false,
        },
      ]
    }
  ];

  return (
    <Card className="pb-2 xs:w-full lg:w-auto min-w-[400px]">
      <CardHeader>
        {loading ? (
          <Skeleton className="bg-gray-200 w-16 h-16 rounded-full mb-2" />
        ) : (
          <Avatar className="w-16 h-16 mb-2">
            {/* <AvatarImage src={`https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`} /> */}
            <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
          </Avatar>
        )}
        {loading ? (
          <Skeleton className="bg-gray-200 flex w-48 h-8" />
        ) : (
          <CardTitle className="flex items-center gap-2">
            {patientName}
            {patientIsActive ? (
              <Badge className="bg-teal-500 text-white hover:bg-teal-500">Active</Badge>
            ) : (
              <Badge className="bg-red-500 text-white hover:bg-red-500">Inactive</Badge>
            )}
          </CardTitle>
        )}
        {loading ? (
          <Skeleton className="bg-gray-200 flex w-24 h-6" />
        ) : (
          <CardDescription className="flex items-center gap-2">{contactInfoFields[0].value}</CardDescription>
        )}
        {loading ? (
          <Skeleton className="bg-gray-200 flex h-8" />
        ) : (
          <div className="pt-2 flex gap-1">
            {/* <Button disabled={true} className="font-bold bg-blue-500 text-white hover:bg-blue-600 px-3 disabled:opacity-50">
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button disabled={true} className="font-bold bg-blue-500 text-white hover:bg-blue-600 px-3 disabled:opacity-50">
              <Video className="w-4 h-4" />
            </Button>
            <Button  variant="outline" className="font-bold flex-none lg:flex-1 disabled:opacity-50">
              <CalendarPlus2 className="w-4 h-4" />
              Set Appointment
            </Button>
            <Button variant="outline" className="ml-auto px-3 disabled:opacity-50">
              <EllipsisVertical className="h-4" />
            </Button> */}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        
      {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-2 border-t pt-4">
            {loading && section.title ? (
              <Skeleton className="bg-gray-200 w-48 h-8" />
            ) : section.title ? (
              <h1 className="text-lg font-bold py-1">{section.title}</h1>
            ) : null}
            
            {section.fields.map((field) =>
              loading ? (
                <div key={field.label} className="flex justify-between items-center gap-2">
                  <Skeleton
                    className="bg-gray-200 flex h-5"
                    style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
                  />
                  <Skeleton
                    className="bg-gray-200 flex h-5"
                    style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
                  />
                </div>
              ) : (
                <div className={`${!field.editable && 'mr-[40px]'}`}> 
                  <EditableField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    icon={field.icon}
                    editable={field.editable}
                    type={field.type}
                    options={field.options}
                    onUpdate={field.onUpdate}
                  />
                </div>
              )
            )}
          </div>
        ))}

        <div className="flex flex-col gap-2 border-t pt-4">
          {loading ? (
            <Skeleton className="bg-gray-200 w-48 h-8" />
          ) : (
            <h1 className="text-lg font-bold py-1">Next Visits</h1>
          )}
          {loading ? (
            <div className="flex justify-between items-center gap-2">
              <Skeleton
                className="bg-gray-200 flex h-5"
                style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
              />
              <Skeleton
                className="bg-gray-200 flex h-5"
                style={{ width: `${Math.floor(Math.random() * (200 - 100 + 1)) + 50}px` }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <CardDescription className="flex justify-between items-center cursor-pointers group/item rounded-md">
                {/* Visit card component */}
                <Card className="pb-2 p-2 w-full min-w-[400px]">
                  <div className="flex">
                    <div className="h-auto w-2 bg-red-500 mr-4 rounded-full"></div>
                    <div className="flex gap-1 w-full">
                      <div className="flex flex-col flex-1 gap-1">
                        <h3 className="text-md font-bold">NY Office - Dr. Tom Yen</h3>
                        <div className="text-sm text-gray-500">May 17, 2025 (10:15 AM - 12:15 PM)</div>
                      </div>
                      <div>
                        <Badge className="text-md bg-red-500 text-white hover:bg-red-500 ml-auto">In-Person</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </CardDescription>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

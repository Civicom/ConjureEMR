import { HealthcareService, Location, Practitioner } from 'fhir/r4';
import React, { Dispatch, MouseEventHandler, ReactElement, SetStateAction, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from 'lucide-react';

interface ScheduleOverridesDialogProps {
  item: Location | Practitioner | HealthcareService;
  setItem: React.Dispatch<React.SetStateAction<Location | Practitioner | HealthcareService | undefined>>;
  open: boolean;
  setIsScheduleOverridesDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateItem: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function ScheduleOverridesDialog({
  item,
  setItem,
  open,
  setIsScheduleOverridesDialogOpen,
  updateItem,
}: ScheduleOverridesDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateItem(e as any);
      setIsScheduleOverridesDialogOpen(false);
    } catch (error) {
      console.error('Error updating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setIsScheduleOverridesDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule change may affect visits</DialogTitle>
          <DialogDescription>
            Your changes will be applied immediately after confirmation. Please make sure that no previously booked visits
            are affected by this schedule change.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-md">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
          <p className="text-sm text-gray-800">
            If there are conflicts in booked visits and new schedule, please contact patients to move their visits.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsScheduleOverridesDialogOpen(false)}
            disabled={loading}
            className=" px-4 py-2 border border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white"
          >
            Cancel
          </Button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-500 text-white hover:bg-red-600 min-w-[130px] rounded-full px-4 py-2 font-bold bg-primary text-white disabled:opacity-50 text-center"
          >
            {loading 
            ? <svg aria-hidden="true" className="fill-white text-black w-5 h-5 animate-spin dark:text-gray-600 mx-auto" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>   
            : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

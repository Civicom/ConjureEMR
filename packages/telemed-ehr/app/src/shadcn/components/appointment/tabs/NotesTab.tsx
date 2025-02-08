import { FC, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { getSelectors } from "@/../../../utils/lib/store";
import { useAppointmentStore } from "@/state";
import { getQuestionnaireResponseByLinkId } from "ehr-utils";
import { AppointmentTab } from "./AppointmentTab";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export const NotesTab: FC = () => {

    const { questionnaireResponse } = getSelectors(useAppointmentStore, ['questionnaireResponse']);

    const [notes, setNotes] = useState('');

    useEffect(() => {
        const notes = getQuestionnaireResponseByLinkId('notes', questionnaireResponse)?.answer[0].valueString;
        setNotes(notes || '');
    }, [questionnaireResponse]);

    const saveNotes = () => {
        
    }
    
    return (
        <AppointmentTab title="Notes" icon="📝">
            <div className="flex flex-col gap-4">
                <Textarea 
                    placeholder="Type visit notes here." 
                    className='h-80' 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <Button className="bg-[#D3455B] text-white hover:bg-[#D3455B]/90" onClick={saveNotes}>
                        <Save className="w-4 h-4" /> Save
                    </Button>
                </div>
            </div>
        </AppointmentTab>
    );
}
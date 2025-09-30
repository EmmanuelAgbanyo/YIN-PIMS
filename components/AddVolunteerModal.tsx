import React, { useState, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { FormGroup } from './ui/FormGroup';
import { useToast } from '../hooks/useToast';
import type { Participant, Volunteer, UUID, VolunteerRole, VolunteerStatus } from '../types';

interface AddVolunteerModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Participant[];
    volunteers: Volunteer[];
    addVolunteer: (volunteer: Omit<Volunteer, 'id'>) => Promise<any>;
}

const VOLUNTEER_ROLES: VolunteerRole[] = ['Event Staff', 'Mentor', 'Logistics', 'Administrative', 'Fundraising'];

export const AddVolunteerModal: React.FC<AddVolunteerModalProps> = ({ isOpen, onClose, participants, volunteers, addVolunteer }) => {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedParticipantId, setSelectedParticipantId] = useState<UUID | null>(null);
    const [formData, setFormData] = useState({
        role: VOLUNTEER_ROLES[0],
        startDate: new Date().toISOString().split('T')[0],
    });
    const addToast = useToast();

    const availableParticipants = useMemo(() => {
        const existingVolunteerPIds = new Set(volunteers.map(v => v.participantId));
        return participants
            .filter(p => !existingVolunteerPIds.has(p.id))
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [participants, volunteers, searchTerm]);
    
    const selectedParticipant = useMemo(() => {
        return participants.find(p => p.id === selectedParticipantId);
    }, [selectedParticipantId, participants]);

    const handleSelectParticipant = (pid: UUID) => {
        setSelectedParticipantId(pid);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParticipantId) return;
        
        await addVolunteer({
            participantId: selectedParticipantId,
            role: formData.role,
            status: 'Active',
            startDate: new Date(formData.startDate),
        });

        addToast(`${selectedParticipant?.name} is now a volunteer!`, 'success');
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Volunteer">
            {step === 1 && (
                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold">Step 1: Select a Participant</h3>
                    <p className="text-sm text-gray-500 -mt-2">Choose an existing participant to make them a volunteer. They must not already be in the volunteer list.</p>
                    <Input label="Search participants..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <div className="max-h-64 overflow-y-auto border dark:border-gray-700 rounded-md p-2 space-y-2">
                        {availableParticipants.length > 0 ? availableParticipants.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => handleSelectParticipant(p.id)}
                                className="p-2 rounded-md hover:bg-primary/10 flex items-center justify-between cursor-pointer"
                            >
                                <span>{p.name} <span className="text-gray-400 text-xs">({p.institution})</span></span>
                                <Button size="sm">Select</Button>
                            </div>
                        )) : <p className="text-center text-sm text-gray-500 py-4">No available participants found.</p>}
                    </div>
                </div>
            )}
            {step === 2 && selectedParticipant && (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="font-semibold">Step 2: Assign Volunteer Details</h3>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <p className="text-sm">Participant: <strong className="font-bold">{selectedParticipant.name}</strong></p>
                    </div>
                    <FormGroup>
                        <Select label="Assign Role" value={formData.role} onChange={e => setFormData(f => ({...f, role: e.target.value as VolunteerRole}))}>
                            {VOLUNTEER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </Select>
                    </FormGroup>
                     <FormGroup>
                        <Input label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData(f => ({...f, startDate: e.target.value}))} />
                    </FormGroup>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button type="submit">Add Volunteer</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

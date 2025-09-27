import React, { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useToast } from '../hooks/useToast';
import type { Event, Participant, Participation, UserRole, UUID } from '../types';
import { Gender, Region } from '../types';
import { INSTITUTIONS } from '../constants';
import { Input } from './ui/Input';
import { FormGroup } from './ui/FormGroup';

type EventDetailPanelProps = {
  event: Event;
  participants: Participant[];
  participations: Participation[];
  addParticipant: (participant: Omit<Participant, 'id' | 'createdAt'>) => Participant;
  addParticipation: (participantId: UUID, eventId: UUID) => boolean;
  deleteParticipation: (participantId: UUID, eventId: UUID) => void;
  deleteEvent: (eventId: UUID) => void;
  onEdit: (event: Event) => void;
  currentUserRole: UserRole;
};

const QuickAddParticipantForm: React.FC<{
  onAdd: (participant: Omit<Participant, 'id' | 'createdAt'>) => void;
}> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [institution, setInstitution] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !institution) return;
    onAdd({
      name,
      contact,
      institution,
      gender: Gender.Other,
      region: Region.GreaterAccra,
      membershipStatus: true,
      certificateIssued: false,
      notes: 'Added via quick-add from event panel.',
    });
    setName('');
    setContact('');
    setInstitution('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup>
        <Input type="text" label="Full Name" value={name} onChange={e => setName(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Input type="text" label="Contact Info" value={contact} onChange={e => setContact(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Input list="institutions" label="Institution" value={institution} onChange={e => setInstitution(e.target.value)} required />
        <datalist id="institutions">
          {INSTITUTIONS.map(i => <option key={i} value={i} />)}
        </datalist>
      </FormGroup>
      <Button type="submit" className="w-full !mt-6">Create & Register</Button>
    </form>
  );
};


export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ event, participants, participations, addParticipant, addParticipation, deleteParticipation, deleteEvent, onEdit, currentUserRole }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'create'>('register');
  const [searchExisting, setSearchExisting] = useState('');
  const [searchAttendees, setSearchAttendees] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const addToast = useToast();

  const isSuperAdmin = currentUserRole === 'Super Admin';

  const attendees = useMemo(() => {
    const attendeeIds = new Set(participations.filter(p => p.eventId === event.id).map(p => p.participantId));
    return participants
      .filter(p => attendeeIds.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [participations, participants, event.id]);

  const availableToRegister = useMemo(() => {
    const attendeeIds = new Set(attendees.map(a => a.id));
    return participants
      .filter(p => !attendeeIds.has(p.id) && p.name.toLowerCase().includes(searchExisting.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10); // Limit results for performance
  }, [participants, attendees, searchExisting]);

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => a.name.toLowerCase().includes(searchAttendees.toLowerCase()));
  }, [attendees, searchAttendees]);

  const handleRegister = (participantId: UUID) => {
    const success = addParticipation(participantId, event.id);
    if (success) {
      addToast('Participant registered!', 'success');
      setSearchExisting('');
    } else {
      addToast('Already registered.', 'error');
    }
  };

  const handleCreateAndRegister = (participantData: Omit<Participant, 'id' | 'createdAt'>) => {
    const newParticipant = addParticipant(participantData);
    if (newParticipant) {
      addParticipation(newParticipant.id, event.id);
      addToast(`${newParticipant.name} created and registered!`, 'success');
    } else {
        addToast('Failed to create participant.', 'error');
    }
  };
  
  const handleUnregister = (participantId: UUID, participantName: string) => {
      deleteParticipation(participantId, event.id);
      addToast(`${participantName} unregistered from event.`, 'success');
  };
  
  const confirmDeleteEvent = () => {
    deleteEvent(event.id);
    addToast(`Event "${event.title}" deleted.`, 'success');
    setIsConfirmDeleteOpen(false);
  };

  return (
    <>
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold">{event.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{event.date.toLocaleDateString()} • {event.location} • {event.category}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <Button variant="ghost" onClick={() => onEdit(event)}>Edit</Button>
                {isSuperAdmin && <Button variant="danger" onClick={() => setIsConfirmDeleteOpen(true)}>Delete</Button>}
            </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
        {/* Left Side: Add Participants */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Add to Event</h3>
            <div className="flex border-b dark:border-gray-700">
                <button onClick={() => setActiveTab('register')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'register' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Register Existing</button>
                <button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'create' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Create & Register New</button>
            </div>
            {activeTab === 'register' ? (
                <div className="space-y-3">
                    <input type="text" placeholder="Search for participant..." value={searchExisting} onChange={e => setSearchExisting(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600" />
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchExisting && availableToRegister.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                <div>
                                    <p className="font-medium text-sm">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.institution}</p>
                                </div>
                                <Button size="sm" onClick={() => handleRegister(p.id)}>Add</Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <QuickAddParticipantForm onAdd={handleCreateAndRegister} />
            )}
        </div>

        {/* Right Side: Current Attendees */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Current Attendees ({filteredAttendees.length})</h3>
            <input type="text" placeholder="Search attendees..." value={searchAttendees} onChange={e => setSearchAttendees(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600" />
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[50vh]">
                {filteredAttendees.length > 0 ? filteredAttendees.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                        <div>
                           <p className="font-medium text-sm">{p.name}</p>
                           <p className="text-xs text-gray-500">{p.institution}</p>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => handleUnregister(p.id, p.name)}>Remove</Button>
                    </div>
                )) : <p className="text-center text-sm text-gray-500 pt-8">No attendees registered yet.</p>}
            </div>
        </div>
      </div>
       <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Deletion">
        <div>
            <p>Are you sure you want to delete the event "{event.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDeleteEvent}>Delete</Button>
            </div>
        </div>
      </Modal>
    </>
  );
};
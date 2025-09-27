import React, { useState, useMemo } from 'react';
import type { usePIMSData } from '../hooks/usePIMSData';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import type { Participant, Event, UserRole, Participation, UUID } from '../types';
import { useToast } from '../hooks/useToast';
import { Select } from './ui/Select';
import { FormGroup } from './ui/FormGroup';

type RegistrationsViewProps = ReturnType<typeof usePIMSData> & { currentUserRole: UserRole };

interface RegistrationWithDetails extends Participation {
    participantName: string;
    eventName: string;
    eventDate: Date | undefined;
}

const RegistrationForm: React.FC<{
  participants: Participant[];
  events: Event[];
  onSubmit: (participantId: UUID, eventId: UUID) => boolean;
  onClose: () => void;
}> = ({ participants, events, onSubmit, onClose }) => {
  const [participantId, setParticipantId] = useState<UUID>(participants[0]?.id || '');
  const [eventId, setEventId] = useState<UUID>(events[0]?.id || '');
  const addToast = useToast();
  
  const sortedParticipants = useMemo(() => [...participants].sort((a,b) => a.name.localeCompare(b.name)), [participants]);
  const sortedEvents = useMemo(() => [...events].sort((a,b) => b.date.getTime() - a.date.getTime()), [events]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId || !eventId) {
        addToast('Please select a participant and an event.', 'error');
        return;
    }
    const success = onSubmit(participantId, eventId);
    if(success) {
        onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup>
        <Select label="Participant" value={participantId} onChange={(e) => setParticipantId(e.target.value)} required >
          {sortedParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </FormGroup>
      <FormGroup>
        <Select label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
          {sortedEvents.map(e => <option key={e.id} value={e.id}>{e.title} ({e.date.toLocaleDateString()})</option>)}
        </Select>
      </FormGroup>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">Add Registration</Button>
      </div>
    </form>
  );
};

export const RegistrationsView: React.FC<RegistrationsViewProps> = ({ participants, events, participations, addParticipation, deleteParticipation, currentUserRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<RegistrationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const addToast = useToast();

  const registrationsWithDetails = useMemo(() => {
    return participations
      .map(p => {
        const participant = participants.find(par => par.id === p.participantId);
        const event = events.find(e => e.id === p.eventId);
        return {
          ...p,
          participantName: participant?.name || 'N/A',
          eventName: event?.title || 'N/A',
          eventDate: event?.date,
        };
      })
      .sort((a, b) => (b.eventDate?.getTime() || 0) - (a.eventDate?.getTime() || 0));
  }, [participations, participants, events]);
  
  const filteredRegistrations = useMemo(() => {
      return registrationsWithDetails.filter(r => 
        r.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.eventName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [registrationsWithDetails, searchTerm]);

  const handleFormSubmit = (participantId: UUID, eventId: UUID) => {
    const success = addParticipation(participantId, eventId);
    if(success) {
      const participantName = participants.find(p => p.id === participantId)?.name;
      addToast(`Registered ${participantName} successfully!`, 'success');
      return true;
    } else {
      addToast('This participant is already registered for this event.', 'error');
      return false;
    }
  };
  
  const handleDeleteRequest = (registration: RegistrationWithDetails) => {
    setRegistrationToDelete(registration);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (registrationToDelete) {
      deleteParticipation(registrationToDelete.participantId, registrationToDelete.eventId);
      addToast(`Un-registered "${registrationToDelete.participantName}" successfully.`, 'success');
      setIsConfirmDeleteOpen(false);
      setRegistrationToDelete(null);
    }
  };

  const isSuperAdmin = currentUserRole === 'Super Admin';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Event Registrations ({filteredRegistrations.length})</h2>
        <div className="flex items-center gap-2">
            <input type="text" placeholder="Search participant or event..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
            <Button onClick={() => setIsModalOpen(true)}>Add Registration</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRegistrations.length > 0 ? filteredRegistrations.map(r => (
              <tr key={`${r.participantId}-${r.eventId}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.participantName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.eventName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.eventDate?.toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {isSuperAdmin && <Button variant="danger" onClick={() => handleDeleteRequest(r)}>Delete</Button>}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Participant for Event">
        <RegistrationForm participants={participants} events={events} onSubmit={handleFormSubmit} onClose={() => setIsModalOpen(false)} />
      </Modal>
      <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Deletion">
        <div>
            <p>Are you sure you want to un-register "{registrationToDelete?.participantName}" from the event "{registrationToDelete?.eventName}"? This action can be undone by re-registering them.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
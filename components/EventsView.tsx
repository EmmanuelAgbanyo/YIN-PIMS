import React, { useState, useEffect } from 'react';
import type { usePIMSData } from '../hooks/usePIMSData';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import type { Event, UserRole } from '../types';
import { EVENT_CATEGORIES, LOCATIONS } from '../constants';
import { useToast } from '../hooks/useToast';
import { EventDetailPanel } from './EventDetailPanel';
import { Input } from './ui/Input';
import { FormGroup } from './ui/FormGroup';

type EventsViewProps = ReturnType<typeof usePIMSData> & { currentUserRole: UserRole };

const initialEventState: Omit<Event, 'id' | 'year' | 'date'> & { dateStr: string } = {
  title: '',
  dateStr: new Date().toISOString().split('T')[0],
  location: '',
  category: '',
};

const EventForm: React.FC<{
  onSubmit: (event: Omit<Event, 'id' | 'year'>) => void;
  initialData?: Event | null;
  onClose: () => void;
}> = ({ onSubmit, initialData, onClose }) => {
  
  const getInitialState = (data: Event | null) => {
    if (!data) return initialEventState;
    return {
      title: data.title,
      dateStr: data.date.toISOString().split('T')[0],
      location: data.location,
      category: data.category
    };
  };
  
  const [formData, setFormData] = useState(getInitialState(initialData));

  useEffect(() => {
    setFormData(getInitialState(initialData));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { dateStr, ...rest } = formData;
    onSubmit({ ...rest, date: new Date(dateStr) });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
      <FormGroup className="md:col-span-2">
        <Input type="text" label="Event Title" name="title" value={formData.title} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Input type="date" label="Date" name="dateStr" value={formData.dateStr} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Input list="locations" label="Location" name="location" value={formData.location} onChange={handleChange} />
        <datalist id="locations">
            {LOCATIONS.map(l => <option key={l} value={l} />)}
        </datalist>
      </FormGroup>
      <FormGroup className="md:col-span-2">
        <Input list="categories" label="Category" name="category" value={formData.category} onChange={handleChange} />
         <datalist id="categories">
            {EVENT_CATEGORIES.map(c => <option key={c} value={c} />)}
        </datalist>
      </FormGroup>
      <div className="md:col-span-2 flex justify-end space-x-2 pt-6">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Event' : 'Create Event'}</Button>
      </div>
    </form>
  );
};

export const EventsView: React.FC<EventsViewProps> = (props) => {
  const { events, addEvent, updateEvent, currentUserRole } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(events[0] || null);
  const addToast = useToast();

  useEffect(() => {
    // If events list changes (e.g., deletion) and selected event is no longer there,
    // select the first one or null.
    if (selectedEvent && !events.find(e => e.id === selectedEvent.id)) {
      setSelectedEvent(events[0] || null);
    }
    if(!selectedEvent && events.length > 0) {
      setSelectedEvent(events[0]);
    }
  }, [events, selectedEvent]);
  
  const handleAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditRequest = (event: Event) => {
      setEditingEvent(event);
      setIsModalOpen(true);
  };
  
  const handleFormSubmit = (data: Omit<Event, 'id' | 'year'>) => {
    if (editingEvent) {
      updateEvent({ ...editingEvent, ...data, year: data.date.getFullYear() });
      addToast('Event updated successfully!', 'success');
    } else {
      addEvent(data);
      addToast('Event created successfully!', 'success');
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-full gap-6 max-h-[calc(100vh-120px)]">
      {/* Left Panel: Event List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4 p-2">
            <h2 className="text-xl font-semibold">Events ({events.length})</h2>
            <Button onClick={handleAdd}>Create Event</Button>
        </div>
        <div className="overflow-y-auto space-y-2">
            {events.map(event => (
                <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedEvent?.id === event.id 
                        ? 'bg-primary text-white shadow-md' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <p className="font-semibold">{event.title}</p>
                    <p className={`text-sm ${selectedEvent?.id === event.id ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {event.date.toLocaleDateString()} - {event.location}
                    </p>
                </div>
            ))}
        </div>
      </div>
      
      {/* Right Panel: Details and Attendees */}
      <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        {selectedEvent ? (
            <EventDetailPanel
                key={selectedEvent.id} // Re-mount component when event changes to reset state
                event={selectedEvent}
                onEdit={handleEditRequest}
                {...props}
            />
        ) : (
            <div className="flex-1 flex justify-center items-center">
                <div className="text-center text-gray-500">
                    <CalendarIcon />
                    <h3 className="text-xl font-semibold mt-4">No Event Selected</h3>
                    <p>Select an event from the list to manage its attendees.</p>
                </div>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEvent(null); }} title={editingEvent ? 'Edit Event' : 'Create New Event'}>
        <EventForm onSubmit={handleFormSubmit} initialData={editingEvent} onClose={() => { setIsModalOpen(false); setEditingEvent(null); }} />
      </Modal>
    </div>
  );
};

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
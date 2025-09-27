import { useState, useCallback, useMemo } from 'react';
import type { Participant, Event, Participation, UUID, User } from '../types';
import { Gender as GenderEnum, Region as RegionEnum } from '../types';

const createInitialParticipants = (): Participant[] => [
    { id: '1', name: 'John Doe', gender: GenderEnum.Male, institution: 'University of Ghana', region: RegionEnum.GreaterAccra, contact: '0244123456', membershipStatus: true, certificateIssued: true, notes: 'Active member', createdAt: new Date('2023-01-15') },
    { id: '2', name: 'Jane Smith', gender: GenderEnum.Female, institution: 'KNUST', region: RegionEnum.Ashanti, contact: '0208123456', membershipStatus: true, certificateIssued: false, notes: '', createdAt: new Date('2023-02-20') },
    { id: '3', name: 'Kwame Nkrumah', gender: GenderEnum.Male, institution: 'University of Cape Coast', region: RegionEnum.Central, contact: '0555123456', membershipStatus: false, certificateIssued: true, notes: 'Founding member', createdAt: new Date('2022-11-10') },
    { id: '4', name: 'Ama Ata Aidoo', gender: GenderEnum.Female, institution: 'Ashesi University', region: RegionEnum.Eastern, contact: '0277123456', membershipStatus: true, certificateIssued: false, notes: '', createdAt: new Date('2023-05-01') },
    { id: '5', name: 'Kofi Annan', gender: GenderEnum.Male, institution: 'Accra Technical University', region: RegionEnum.GreaterAccra, contact: '0266123456', membershipStatus: true, certificateIssued: true, notes: '', createdAt: new Date('2023-03-12') },
];

const createInitialEvents = (): Event[] => [
    { id: '101', title: 'Annual Investment Summit', date: new Date('2023-03-20'), year: 2023, location: 'Accra', category: 'Conference' },
    { id: '102', title: 'Stock Market Workshop', date: new Date('2023-06-15'), year: 2023, location: 'Kumasi', category: 'Workshop' },
    { id: '103', title: 'Fintech Networking Event', date: new Date('2024-01-30'), year: 2024, location: 'Accra', category: 'Networking' },
    { id: '104', title: 'Entrepreneurship Seminar', date: new Date('2024-04-10'), year: 2024, location: 'Cape Coast', category: 'Seminar' },
];

const createInitialParticipations = (): Participation[] => [
    { participantId: '1', eventId: '101' },
    { participantId: '2', eventId: '101' },
    { participantId: '1', eventId: '102' },
    { participantId: '3', eventId: '101' },
    { participantId: '4', eventId: '103' },
    { participantId: '5', eventId: '103' },
    { participantId: '1', eventId: '103' },
    { participantId: '2', eventId: '104' },
];

const createInitialUsers = (): User[] => [
    { id: 'su-admin-001', email: 'admin@yin.com', password: 'password123', role: 'Super Admin', createdAt: new Date() }
];


export const usePIMSData = () => {
  const [participants, setParticipants] = useState<Participant[]>(createInitialParticipants);
  const [events, setEvents] = useState<Event[]>(createInitialEvents);
  const [participations, setParticipations] = useState<Participation[]>(createInitialParticipations);
  const [users, setUsers] = useState<User[]>(createInitialUsers);

  const addParticipant = useCallback((participantData: Omit<Participant, 'id' | 'createdAt'>): Participant => {
    const newParticipant: Participant = {
      ...participantData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setParticipants(prev => [...prev, newParticipant]);
    return newParticipant;
  }, []);

  const updateParticipant = useCallback((updatedParticipant: Participant) => {
    setParticipants(prev => prev.map(p => p.id === updatedParticipant.id ? updatedParticipant : p));
  }, []);

  const deleteParticipant = useCallback((participantId: UUID) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    setParticipations(prev => prev.filter(p => p.participantId !== participantId));
  }, []);

  const addEvent = useCallback((eventData: Omit<Event, 'id' | 'year'>) => {
    const newEvent: Event = {
      ...eventData,
      id: crypto.randomUUID(),
      year: eventData.date.getFullYear(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const updateEvent = useCallback((updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  }, []);
  
  const deleteEvent = useCallback((eventId: UUID) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setParticipations(prev => prev.filter(p => p.eventId !== eventId));
  }, []);

  const addParticipation = useCallback((participantId: UUID, eventId: UUID): boolean => {
    const exists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
    if (exists) {
      return false;
    }
    setParticipations(prev => [...prev, { participantId, eventId }]);
    return true;
  }, [participations]);

  const deleteParticipation = useCallback((participantId: UUID, eventId: UUID) => {
    setParticipations(prev => prev.filter(p => !(p.participantId === participantId && p.eventId === eventId)));
  }, []);
  
  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);

  const deleteUser = useCallback((userId: UUID) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const kpis = useMemo(() => {
    const totalParticipants = participants.length;
    const activeMembers = participants.filter(p => p.membershipStatus).length;
    const totalEvents = events.length;
    const totalParticipations = participations.length;
    const averageParticipationRate = totalParticipants > 0 && totalEvents > 0 ? (totalParticipations / (totalParticipants * totalEvents)) * 100 : 0;
    
    return {
        totalParticipants,
        activeMembers,
        totalEvents,
        averageParticipationRate: parseFloat(averageParticipationRate.toFixed(1))
    };
  }, [participants, events, participations]);

  return {
    participants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    participations,
    addParticipation,
    deleteParticipation,
    users,
    addUser,
    updateUser,
    deleteUser,
    kpis
  };
};

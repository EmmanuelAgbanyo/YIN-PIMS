import { useState, useCallback, useMemo } from 'react';
import { seedData } from '../seedData';
import type { Participant, Event, Participation, User, UUID, KPIs } from '../types';

// A simple UUID generator
const generateUUID = () => crypto.randomUUID();

export const usePIMSData = () => {
  const [participants, setParticipants] = useState<Participant[]>(seedData.participants);
  const [events, setEvents] = useState<Event[]>(seedData.events);
  const [participations, setParticipations] = useState<Participation[]>(seedData.participations);
  const [users, setUsers] = useState<User[]>(seedData.users);

  // --- PARTICIPANTS ---
  const addParticipant = useCallback((data: Omit<Participant, 'id' | 'createdAt' | 'membershipId'>) => {
    const newId = generateUUID();
    const createdAt = new Date();
    const newParticipant: Participant = {
      ...data,
      id: newId,
      createdAt,
      membershipId: `YIN-${createdAt.getFullYear()}-${String(participants.length + 1).padStart(4, '0')}`,
    };
    setParticipants(prev => [...prev, newParticipant]);
    return newParticipant;
  }, [participants.length]);

  const updateParticipant = useCallback((updatedParticipant: Participant) => {
    setParticipants(prev =>
      prev.map(p => (p.id === updatedParticipant.id ? updatedParticipant : p))
    );
  }, []);

  const deleteParticipant = useCallback((id: UUID) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setParticipations(prev => prev.filter(p => p.participantId !== id));
  }, []);

  const deleteMultipleParticipants = useCallback((ids: UUID[]) => {
    const idSet = new Set(ids);
    setParticipants(prev => prev.filter(p => !idSet.has(p.id)));
    setParticipations(prev => prev.filter(p => !idSet.has(p.participantId)));
  }, []);
  
  const updateParticipantMembershipCardTimestamp = useCallback((id: UUID) => {
    setParticipants(p => p.map(participant => participant.id === id ? { ...participant, lastMembershipCardGeneratedAt: new Date() } : participant));
  }, []);

  // --- EVENTS ---
  const addEvent = useCallback((data: Omit<Event, 'id' | 'year'>) => {
    const newEvent: Event = {
      ...data,
      id: generateUUID(),
      year: data.date.getFullYear(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const updateEvent = useCallback((updatedEvent: Event) => {
    setEvents(prev => prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
  }, []);
  
  const deleteEvent = useCallback((id: UUID) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setParticipations(prev => prev.filter(p => p.eventId !== id));
  }, []);

  // --- PARTICIPATIONS ---
  const addParticipation = useCallback(async (participantId: UUID, eventId: UUID): Promise<boolean> => {
    const exists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
    if (exists) {
      return false;
    }
    setParticipations(prev => [...prev, { participantId, eventId }]);
    return true;
  }, [participations]);

  const addMultipleParticipations = useCallback(async (participantIds: UUID[], eventId: UUID): Promise<{ added: number, skipped: number }> => {
    let added = 0;
    let skipped = 0;
    const newParticipations: Participation[] = [];
    participantIds.forEach(participantId => {
      const exists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
      if (exists) {
        skipped++;
      } else {
        added++;
        newParticipations.push({ participantId, eventId });
      }
    });
    setParticipations(prev => [...prev, ...newParticipations]);
    return { added, skipped };
  }, [participations]);

  const deleteParticipation = useCallback((participantId: UUID, eventId: UUID) => {
    setParticipations(prev => prev.filter(p => !(p.participantId === participantId && p.eventId === eventId)));
  }, []);

  // --- USERS ---
  const addUser = useCallback((data: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...data,
      id: generateUUID(),
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
  }, []);
  
  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);
  
  const deleteUser = useCallback((id: UUID) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  // --- DERIVED STATE & KPIs ---
  const participantsWithEngagement = useMemo(() => {
    const engagementMap = new Map<UUID, number>();
    participations.forEach(p => {
      engagementMap.set(p.participantId, (engagementMap.get(p.participantId) || 0) + 1);
    });
    return participants.map(p => ({
      ...p,
      engagementScore: engagementMap.get(p.id) || 0,
    }));
  }, [participants, participations]);

  const kpis: KPIs = useMemo(() => {
    const totalParticipants = participants.length;
    const activeMembers = participants.filter(p => p.membershipStatus).length;
    const totalEvents = events.length;
    const totalParticipations = participations.length;
    const averageParticipationRate = totalParticipants > 0 && totalEvents > 0 ? (totalParticipations / totalParticipants) / totalEvents * 100 : 0;
    return {
      totalParticipants,
      activeMembers,
      totalEvents,
      averageParticipationRate: parseFloat(averageParticipationRate.toFixed(1)),
    };
  }, [participants, events, participations]);

  return {
    participants: participantsWithEngagement,
    events,
    participations,
    users,
    kpis,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    deleteMultipleParticipants,
    updateParticipantMembershipCardTimestamp,
    addEvent,
    updateEvent,
    deleteEvent,
    addParticipation,
    addMultipleParticipations,
    deleteParticipation,
    addUser,
    updateUser,
    deleteUser,
  };
};
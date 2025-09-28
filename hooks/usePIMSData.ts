import { useState, useCallback, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { seedData } from '../seedData';
import type { Participant, Event, Participation, User, UUID, KPIs } from '../types';

// --- HELPERS ---

// Helper to convert Firebase object to array and parse date strings into Date objects
// Fix: Made the function generic to ensure type safety when setting state.
const firebaseObjectToArray = <T>(data: any, dateFields: string[] = []): T[] => {
  if (!data) return [];
  return Object.entries(data).map(([id, value]) => {
    const item: { [key: string]: any } = { ...(value as object), id };
    dateFields.forEach(field => {
      if (item[field] && typeof item[field] === 'string') {
        item[field] = new Date(item[field]);
      }
    });
    return item as T;
  });
};

// Helper to prepare data for Firebase: removes 'id' and converts Dates to ISO strings
const prepareDataForFirebase = (data: any, dateFields: string[] = []) => {
    const cleanData = { ...data };
    delete cleanData.id; 
    dateFields.forEach(field => {
        if (cleanData[field] instanceof Date) {
            cleanData[field] = cleanData[field].toISOString();
        }
    });
    return cleanData;
}


export const usePIMSData = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // --- SEED DATABASE IF EMPTY ---
    const dbRef = ref(db);
    onValue(ref(db, 'participants'), (snapshot) => {
        if (!snapshot.exists()) {
            console.log("No participants found, seeding database...");
            const seedForFirebase: { [key: string]: any } = {};
            seedData.users.forEach(u => { seedForFirebase[`users/${u.id}`] = prepareDataForFirebase(u, ['createdAt']); });
            seedData.participants.forEach(p => { seedForFirebase[`participants/${p.id}`] = prepareDataForFirebase(p, ['createdAt', 'lastMembershipCardGeneratedAt']); });
            seedData.events.forEach(e => { seedForFirebase[`events/${e.id}`] = prepareDataForFirebase(e, ['date']); });
            // For participations, we use push to generate unique keys
            seedData.participations.forEach(p => { 
                const newKey = push(ref(db, 'participations')).key;
                if(newKey) seedForFirebase[`participations/${newKey}`] = p; 
            });
            update(dbRef, seedForFirebase);
        }
    }, { onlyOnce: true });

    // --- SETUP REALTIME LISTENERS ---
    const participantsRef = ref(db, 'participants');
    const eventsRef = ref(db, 'events');
    const participationsRef = ref(db, 'participations');
    const usersRef = ref(db, 'users');

    const onParticipants = onValue(participantsRef, (snapshot) => {
        // Fix: Explicitly cast the result to Participant[].
        setParticipants(firebaseObjectToArray<Participant>(snapshot.val(), ['createdAt', 'lastMembershipCardGeneratedAt']));
    });

    const onEvents = onValue(eventsRef, (snapshot) => {
        // Fix: Explicitly cast the result to Event[].
        setEvents(firebaseObjectToArray<Event>(snapshot.val(), ['date']));
    });

    const onParticipations = onValue(participationsRef, (snapshot) => {
        // Fix: Explicitly cast the result to Participation[].
        setParticipations(firebaseObjectToArray<Participation>(snapshot.val()));
    });

    const onUsers = onValue(usersRef, (snapshot) => {
        // Fix: Explicitly cast the result to User[].
        setUsers(firebaseObjectToArray<User>(snapshot.val(), ['createdAt']));
    });

    // --- CLEANUP LISTENERS ---
    return () => {
      onParticipants();
      onEvents();
      onParticipations();
      onUsers();
    };
  }, []);
  
  // --- PARTICIPANTS ---
  const addParticipant = useCallback(async (data: Omit<Participant, 'id' | 'createdAt' | 'membershipId'>): Promise<Participant> => {
    const newId = crypto.randomUUID();
    const createdAt = new Date();
    // To make IDs more consistent with seed data format, generate a random 4-digit number.
    const randomSuffix = Math.floor(Math.random() * 9000) + 1000;

    const newParticipant: Participant = {
      ...data,
      id: newId,
      createdAt,
      membershipId: `YIN-${createdAt.getFullYear()}-${randomSuffix}`,
    };
    await set(ref(db, `participants/${newId}`), prepareDataForFirebase(newParticipant, ['createdAt']));
    return newParticipant;
  }, []);

  const updateParticipant = useCallback(async (updatedParticipant: Participant) => {
    const preparedData = prepareDataForFirebase(updatedParticipant, ['createdAt', 'lastMembershipCardGeneratedAt']);
    await update(ref(db, `participants/${updatedParticipant.id}`), preparedData);
  }, []);

  const deleteParticipant = useCallback(async (id: UUID) => {
    const updates: { [key: string]: any } = {};
    updates[`/participants/${id}`] = null;
    participations.filter(p => p.participantId === id).forEach(p => {
        if(p.id) updates[`/participations/${p.id}`] = null;
    });
    await update(ref(db), updates);
  }, [participations]);

  const deleteMultipleParticipants = useCallback(async (ids: UUID[]) => {
    const updates: { [key: string]: any } = {};
    const idSet = new Set(ids);
    ids.forEach(id => {
        updates[`/participants/${id}`] = null;
    });
    participations.filter(p => idSet.has(p.participantId)).forEach(p => {
        if(p.id) updates[`/participations/${p.id}`] = null;
    });
    await update(ref(db), updates);
  }, [participations]);
  
  const updateParticipantMembershipCardTimestamp = useCallback(async (id: UUID) => {
    await update(ref(db, `participants/${id}`), { lastMembershipCardGeneratedAt: new Date().toISOString() });
  }, []);

  // --- EVENTS ---
  const addEvent = useCallback(async (data: Omit<Event, 'id' | 'year'>) => {
    const newId = crypto.randomUUID();
    const newEvent: Event = {
      ...data,
      id: newId,
      year: data.date.getFullYear(),
    };
    await set(ref(db, `events/${newId}`), prepareDataForFirebase(newEvent, ['date']));
  }, []);

  const updateEvent = useCallback(async (updatedEvent: Event) => {
    await update(ref(db, `events/${updatedEvent.id}`), prepareDataForFirebase(updatedEvent, ['date']));
  }, []);
  
  const deleteEvent = useCallback(async (id: UUID) => {
    const updates: { [key: string]: any } = {};
    updates[`/events/${id}`] = null;
    participations.filter(p => p.eventId === id).forEach(p => {
        if(p.id) updates[`/participations/${p.id}`] = null;
    });
    await update(ref(db), updates);
  }, [participations]);

  // --- PARTICIPATIONS ---
  const addParticipation = useCallback(async (participantId: UUID, eventId: UUID): Promise<boolean> => {
    const exists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
    if (exists) {
      return false;
    }
    await push(ref(db, 'participations'), { participantId, eventId });
    return true;
  }, [participations]);

  const addMultipleParticipations = useCallback(async (participantIds: UUID[], eventId: UUID): Promise<{ added: number, skipped: number }> => {
    let added = 0;
    let skipped = 0;
    const updates: { [key: string]: any } = {};
    participantIds.forEach(participantId => {
      const exists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
      if (exists) {
        skipped++;
      } else {
        added++;
        const newKey = push(ref(db, 'participations')).key;
        if(newKey) updates[`/participations/${newKey}`] = { participantId, eventId };
      }
    });
    if(Object.keys(updates).length > 0) await update(ref(db), updates);
    return { added, skipped };
  }, [participations]);

  const deleteParticipation = useCallback(async (participantId: UUID, eventId: UUID) => {
    const pToDelete = participations.find(p => p.participantId === participantId && p.eventId === eventId);
    if (pToDelete && pToDelete.id) {
        await remove(ref(db, `participations/${pToDelete.id}`));
    }
  }, [participations]);

  // --- USERS ---
  const addUser = useCallback(async (data: Omit<User, 'id' | 'createdAt'>) => {
    const newId = crypto.randomUUID();
    const newUser: User = {
      ...data,
      id: newId,
      createdAt: new Date(),
    };
    await set(ref(db, `users/${newId}`), prepareDataForFirebase(newUser, ['createdAt']));
  }, []);
  
  const updateUser = useCallback(async (updatedUser: User) => {
    await update(ref(db, `users/${updatedUser.id}`), prepareDataForFirebase(updatedUser, ['createdAt']));
  }, []);
  
  const deleteUser = useCallback(async (id: UUID) => {
    await remove(ref(db, `users/${id}`));
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
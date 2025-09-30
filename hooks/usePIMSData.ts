import { useState, useCallback, useMemo, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { seedData } from '../seedData';
import type { Participant, Event, Participation, User, UUID, KPIs, Club, ClubMembership, Volunteer, Activity } from '../types';

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

// Helper to prepare data for Firebase: removes 'id', undefined values, and converts Dates to ISO strings
const prepareDataForFirebase = (data: any, dateFields: string[] = []) => {
    const cleanData = { ...data };
    delete cleanData.id; 
    dateFields.forEach(field => {
        if (cleanData[field] instanceof Date) {
            cleanData[field] = cleanData[field].toISOString();
        }
    });

    // Firebase disallows `undefined` values. Remove any keys with an undefined value.
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });

    return cleanData;
}


export const usePIMSData = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubMemberships, setClubMemberships] = useState<ClubMembership[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);


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
            seedData.clubs.forEach(c => { seedForFirebase[`clubs/${c.id}`] = prepareDataForFirebase(c, ['createdAt']); });
            seedData.volunteers.forEach(v => { seedForFirebase[`volunteers/${v.id}`] = prepareDataForFirebase(v, ['startDate']); });
            seedData.activities.forEach(a => { seedForFirebase[`activities/${a.id}`] = prepareDataForFirebase(a, ['date']); });
            
            seedData.participations.forEach(p => { 
                const newKey = push(ref(db, 'participations')).key;
                if(newKey) seedForFirebase[`participations/${newKey}`] = p; 
            });
            seedData.clubMemberships.forEach(cm => {
                const newKey = push(ref(db, 'clubMemberships')).key;
                if(newKey) seedForFirebase[`clubMemberships/${newKey}`] = prepareDataForFirebase(cm, ['joinDate']);
            });

            update(dbRef, seedForFirebase);
        }
    }, { onlyOnce: true });

    // --- SETUP REALTIME LISTENERS ---
    const participantsRef = ref(db, 'participants');
    const eventsRef = ref(db, 'events');
    const participationsRef = ref(db, 'participations');
    const usersRef = ref(db, 'users');
    const clubsRef = ref(db, 'clubs');
    const clubMembershipsRef = ref(db, 'clubMemberships');
    const volunteersRef = ref(db, 'volunteers');
    const activitiesRef = ref(db, 'activities');

    const onParticipants = onValue(participantsRef, (snapshot) => {
        setParticipants(firebaseObjectToArray<Participant>(snapshot.val(), ['createdAt', 'lastMembershipCardGeneratedAt']));
    });

    const onEvents = onValue(eventsRef, (snapshot) => {
        setEvents(firebaseObjectToArray<Event>(snapshot.val(), ['date']));
    });

    const onParticipations = onValue(participationsRef, (snapshot) => {
        setParticipations(firebaseObjectToArray<Participation>(snapshot.val()));
    });

    const onUsers = onValue(usersRef, (snapshot) => {
        setUsers(firebaseObjectToArray<User>(snapshot.val(), ['createdAt']));
    });

    const onClubs = onValue(clubsRef, (snapshot) => {
        setClubs(firebaseObjectToArray<Club>(snapshot.val(), ['createdAt']));
    });

    const onClubMemberships = onValue(clubMembershipsRef, (snapshot) => {
        setClubMemberships(firebaseObjectToArray<ClubMembership>(snapshot.val(), ['joinDate']));
    });
    
    const onVolunteers = onValue(volunteersRef, (snapshot) => {
        setVolunteers(firebaseObjectToArray<Volunteer>(snapshot.val(), ['startDate']));
    });

    const onActivities = onValue(activitiesRef, (snapshot) => {
        setActivities(firebaseObjectToArray<Activity>(snapshot.val(), ['date']));
    });

    // --- CLEANUP LISTENERS ---
    return () => {
      onParticipants();
      onEvents();
      onParticipations();
      onUsers();
      onClubs();
      onClubMemberships();
      onVolunteers();
      onActivities();
    };
  }, []);
  
  // --- CLUB MEMBERSHIPS ---
  const addClubMembership = useCallback(async (participantId: UUID, clubId: UUID): Promise<boolean> => {
    const exists = clubMemberships.some(cm => cm.participantId === participantId && cm.clubId === clubId);
    if (exists) {
      return false;
    }
    await push(ref(db, 'clubMemberships'), { participantId, clubId, joinDate: new Date().toISOString() });
    return true;
  }, [clubMemberships]);
  
  const deleteClubMembership = useCallback(async (participantId: UUID, clubId: UUID) => {
    const cmToDelete = clubMemberships.find(cm => cm.participantId === participantId && cm.clubId === clubId);
    if (cmToDelete && cmToDelete.id) {
        await remove(ref(db, `clubMemberships/${cmToDelete.id}`));
    }
  }, [clubMemberships]);

  // --- PARTICIPANTS ---
  const addParticipant = useCallback(async (data: Omit<Participant, 'id' | 'createdAt' | 'membershipId'>, clubId?: UUID): Promise<Participant> => {
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
    
    if (clubId) {
        await addClubMembership(newId, clubId);
    }
    
    return newParticipant;
  }, [addClubMembership]);

  const updateParticipant = useCallback(async (updatedParticipant: Participant) => {
    const preparedData = prepareDataForFirebase(updatedParticipant, ['createdAt', 'lastMembershipCardGeneratedAt']);
    await update(ref(db, `participants/${updatedParticipant.id}`), preparedData);
  }, []);
  
  const addMultipleParticipants = useCallback(async (participantsData: Omit<Participant, 'id' | 'createdAt' | 'membershipId'>[]): Promise<{ created: number }> => {
    const updates: { [key: string]: any } = {};
    let createdCount = 0;

    for (const data of participantsData) {
        const newId = crypto.randomUUID();
        const createdAt = new Date();
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
        const newParticipant: Participant = {
            ...data,
            id: newId,
            createdAt,
            membershipId: `YIN-${createdAt.getFullYear()}-${randomSuffix}`,
        };
        updates[`/participants/${newId}`] = prepareDataForFirebase(newParticipant, ['createdAt']);
        createdCount++;
    }

    if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
    }

    return { created: createdCount };
  }, []);

  const deleteParticipant = useCallback(async (id: UUID) => {
    const updates: { [key: string]: any } = {};
    updates[`/participants/${id}`] = null;
    participations.filter(p => p.participantId === id).forEach(p => {
        if(p.id) updates[`/participations/${p.id}`] = null;
    });
    clubMemberships.filter(cm => cm.participantId === id).forEach(cm => {
        if(cm.id) updates[`/clubMemberships/${cm.id}`] = null;
    });
    // Also remove volunteer record if they are one
    volunteers.filter(v => v.participantId === id).forEach(v => {
        updates[`/volunteers/${v.id}`] = null;
        // And their activities
        activities.filter(a => a.volunteerId === v.id).forEach(a => {
            updates[`/activities/${a.id}`] = null;
        });
    });

    await update(ref(db), updates);
  }, [participations, clubMemberships, volunteers, activities]);

  const deleteMultipleParticipants = useCallback(async (ids: UUID[]) => {
    const updates: { [key: string]: any } = {};
    const idSet = new Set(ids);
    ids.forEach(id => {
        updates[`/participants/${id}`] = null;
    });
    participations.filter(p => idSet.has(p.participantId)).forEach(p => {
        if(p.id) updates[`/participations/${p.id}`] = null;
    });
    clubMemberships.filter(cm => idSet.has(cm.participantId)).forEach(cm => {
        if(cm.id) updates[`/clubMemberships/${cm.id}`] = null;
    });
    // Also handle volunteer records for bulk delete
    volunteers.filter(v => idSet.has(v.participantId)).forEach(v => {
        updates[`/volunteers/${v.id}`] = null;
        activities.filter(a => a.volunteerId === v.id).forEach(a => {
            updates[`/activities/${a.id}`] = null;
        });
    });
    await update(ref(db), updates);
  }, [participations, clubMemberships, volunteers, activities]);
  
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
    // Unlink activities from deleted event
    activities.filter(a => a.eventId === id).forEach(a => {
        updates[`/activities/${a.id}/eventId`] = null;
    });
    await update(ref(db), updates);
  }, [participations, activities]);

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

  // --- CLUBS ---
  const addClub = useCallback(async (data: Omit<Club, 'id' | 'createdAt'>): Promise<Club> => {
    const newId = crypto.randomUUID();
    const newClub: Club = {
      ...data,
      id: newId,
      createdAt: new Date(),
    };
    await set(ref(db, `clubs/${newId}`), prepareDataForFirebase(newClub, ['createdAt']));
    return newClub;
  }, []);

  const updateClub = useCallback(async (updatedClub: Club) => {
    await update(ref(db, `clubs/${updatedClub.id}`), prepareDataForFirebase(updatedClub, ['createdAt']));
  }, []);
  
  const deleteClub = useCallback(async (id: UUID) => {
    const updates: { [key: string]: any } = {};
    updates[`/clubs/${id}`] = null;
    clubMemberships.filter(cm => cm.clubId === id).forEach(cm => {
        if(cm.id) updates[`/clubMemberships/${cm.id}`] = null;
    });
    await update(ref(db), updates);
  }, [clubMemberships]);

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
  
  // --- VOLUNTEERS ---
  const addVolunteer = useCallback(async (data: Omit<Volunteer, 'id'>) => {
    const newId = crypto.randomUUID();
    const newVolunteer: Volunteer = { ...data, id: newId };
    await set(ref(db, `volunteers/${newId}`), prepareDataForFirebase(newVolunteer, ['startDate']));
    return newVolunteer;
  }, []);

  const updateVolunteer = useCallback(async (updatedVolunteer: Volunteer) => {
    await update(ref(db, `volunteers/${updatedVolunteer.id}`), prepareDataForFirebase(updatedVolunteer, ['startDate']));
  }, []);

  const deleteVolunteer = useCallback(async (id: UUID) => {
    const updates: { [key: string]: any } = {};
    updates[`/volunteers/${id}`] = null;
    activities.filter(a => a.volunteerId === id).forEach(a => {
        updates[`/activities/${a.id}`] = null;
    });
    await update(ref(db), updates);
  }, [activities]);

  // --- ACTIVITIES ---
  const addActivity = useCallback(async (data: Omit<Activity, 'id'>) => {
    const newId = crypto.randomUUID();
    const newActivity: Activity = { ...data, id: newId };
    await set(ref(db, `activities/${newId}`), prepareDataForFirebase(newActivity, ['date']));
    return newActivity;
  }, []);
  
  const deleteActivity = useCallback(async (id: UUID) => {
    await remove(ref(db, `activities/${id}`));
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
    clubs,
    clubMemberships,
    volunteers,
    activities,
    kpis,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    deleteMultipleParticipants,
    addMultipleParticipants,
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
    addClub,
    updateClub,
    deleteClub,
    addClubMembership,
    deleteClubMembership,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
    addActivity,
    deleteActivity,
  };
};

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Participant, Event, Participation, UUID, User } from '../types';
import { db } from '../firebase';
import { ref, onValue, set, push, update, remove, query, orderByChild, equalTo, get } from 'firebase/database';
import { seedData } from '../seedData';

const firebaseObjectToArray = (snapshot: any, dateFields: string[] = []) => {
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([id, value]: [string, any]) => {
    const item: any = { ...value, id };
    dateFields.forEach(field => {
        if (item[field]) {
            item[field] = new Date(item[field]);
        }
    });
    return item;
  });
};


export const usePIMSData = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const seedDatabase = useCallback(async (): Promise<boolean> => {
    try {
        const { users, participants, events, participations } = seedData;
        
        const prepareForFirebase = (items: any[], dateFields: string[] = []) => {
            return items.reduce((acc, item) => {
                const { id, ...data } = item;
                const firebaseItem: any = { ...data };
                dateFields.forEach(field => {
                    if (firebaseItem[field] instanceof Date) {
                        firebaseItem[field] = firebaseItem[field].toISOString();
                    }
                });
                acc[id] = firebaseItem;
                return acc;
            }, {} as Record<string, any>);
        };
        
        const participationsForDb = participations.reduce((acc, p, index) => {
            acc[`participation_${index + 1}`] = p;
            return acc;
        }, {} as Record<string, any>);

        const updates: Record<string, any> = {
            users: prepareForFirebase(users, ['createdAt']),
            participants: prepareForFirebase(participants, ['createdAt']),
            events: prepareForFirebase(events, ['date']),
            participations: participationsForDb,
        };

        await set(ref(db), updates);
        
        return true;
    } catch (error) {
        console.error("Database seeding failed:", error);
        return false;
    }
  }, []);

  useEffect(() => {
    const participantsRef = ref(db, 'participants');
    const eventsRef = ref(db, 'events');
    const participationsRef = ref(db, 'participations');
    const usersRef = ref(db, 'users');

    const fetchDataAndSeedIfNeeded = async () => {
      try {
        // First, check if users exist. If not, seed the database.
        const usersSnapForCheck = await get(usersRef);
        if (!usersSnapForCheck.exists()) {
          console.log("No users found. Seeding database with initial data...");
          const success = await seedDatabase();
          if (success) {
            console.log("Database seeded successfully.");
          } else {
            console.error("Automatic database seeding failed.");
          }
        }

        // Now, proceed with fetching all data. This will get fresh data if seeding just happened.
        const [
          participantsSnap,
          eventsSnap,
          participationsSnap,
          usersSnap
        ] = await Promise.all([
          get(participantsRef),
          get(eventsRef),
          get(participationsRef),
          get(usersRef)
        ]);

        // Set initial state from the snapshots
        setParticipants(firebaseObjectToArray(participantsSnap, ['createdAt']));
        setEvents(firebaseObjectToArray(eventsSnap, ['date']));
        setParticipations(participationsSnap.exists() ? Object.values(participationsSnap.val()) : []);
        setUsers(firebaseObjectToArray(usersSnap, ['createdAt']));
        
      } catch (error) {
        console.error("Failed to fetch initial PIMS data:", error);
      } finally {
        // Once initial data is fetched (or fails), stop loading
        setIsLoading(false);
      }
    };

    fetchDataAndSeedIfNeeded();

    // Now, set up the real-time listeners for updates after the initial load.
    const listeners = [
      onValue(participantsRef, (snapshot) => {
        setParticipants(firebaseObjectToArray(snapshot, ['createdAt']));
      }),
      onValue(eventsRef, (snapshot) => {
        setEvents(firebaseObjectToArray(snapshot, ['date']));
      }),
      onValue(participationsRef, (snapshot) => {
        setParticipations(snapshot.exists() ? Object.values(snapshot.val()) : []);
      }),
      onValue(usersRef, (snapshot) => {
        setUsers(firebaseObjectToArray(snapshot, ['createdAt']));
      }),
    ];

    // Cleanup function to detach listeners when the component unmounts
    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, [seedDatabase]);

  const addParticipant = useCallback((participantData: Omit<Participant, 'id' | 'createdAt'>): Participant => {
    const participantsListRef = ref(db, 'participants');
    const newParticipantRef = push(participantsListRef);
    const newParticipantData = {
      ...participantData,
      createdAt: new Date().toISOString(),
    };
    set(newParticipantRef, newParticipantData);
    return {
        ...participantData,
        id: newParticipantRef.key!,
        createdAt: new Date(newParticipantData.createdAt),
    };
  }, []);

  const updateParticipant = useCallback((updatedParticipant: Participant) => {
    const { id, ...data } = updatedParticipant;
    const participantRef = ref(db, `participants/${id}`);
    update(participantRef, {
        ...data,
        createdAt: data.createdAt.toISOString(),
    });
  }, []);

  const deleteParticipant = useCallback(async (participantId: UUID) => {
    await remove(ref(db, `participants/${participantId}`));
    const participationsQuery = query(ref(db, 'participations'), orderByChild('participantId'), equalTo(participantId));
    const snapshot = await get(participationsQuery);
    if (snapshot.exists()) {
        const updates: Record<string, null> = {};
        snapshot.forEach(child => {
            updates[`/participations/${child.key}`] = null;
        });
        await update(ref(db), updates);
    }
  }, []);

  const deleteMultipleParticipants = useCallback(async (participantIds: UUID[]) => {
    const updates: Record<string, null> = {};
    participantIds.forEach(id => {
        updates[`/participants/${id}`] = null;
    });
    
    // Find all participations related to the deleted participants and mark them for deletion.
    const participationsRef = ref(db, 'participations');
    const snapshot = await get(participationsRef);
    if (snapshot.exists()) {
        snapshot.forEach(child => {
            const participation = child.val();
            if (participantIds.includes(participation.participantId)) {
                updates[`/participations/${child.key}`] = null;
            }
        });
    }

    await update(ref(db), updates);
  }, []);

  const addEvent = useCallback((eventData: Omit<Event, 'id' | 'year'>) => {
    const eventListRef = ref(db, 'events');
    const newEventRef = push(eventListRef);
    set(newEventRef, {
        ...eventData,
        date: eventData.date.toISOString(),
        year: eventData.date.getFullYear(),
    });
  }, []);

  const updateEvent = useCallback((updatedEvent: Event) => {
    const { id, ...data } = updatedEvent;
    const eventRef = ref(db, `events/${id}`);
    update(eventRef, {
        ...data,
        date: data.date.toISOString(),
        year: data.date.getFullYear(),
    });
  }, []);
  
  const deleteEvent = useCallback(async (eventId: UUID) => {
    await remove(ref(db, `events/${eventId}`));
    const participationsQuery = query(ref(db, 'participations'), orderByChild('eventId'), equalTo(eventId));
    const snapshot = await get(participationsQuery);
    if (snapshot.exists()) {
        const updates: Record<string, null> = {};
        snapshot.forEach(child => {
            updates[`/participations/${child.key}`] = null;
        });
        await update(ref(db), updates);
    }
  }, []);

  const addParticipation = useCallback(async (participantId: UUID, eventId: UUID): Promise<boolean> => {
      const existing = participations.some(p => p.participantId === participantId && p.eventId === eventId);
      if (existing) {
          return false;
      }
      const participationListRef = ref(db, 'participations');
      const newParticipationRef = push(participationListRef);
      await set(newParticipationRef, { participantId, eventId });
      return true;
  }, [participations]);

  const addMultipleParticipations = useCallback(async (participantIds: UUID[], eventId: UUID): Promise<{ added: number, skipped: number }> => {
    let addedCount = 0;
    const updates: Record<string, { participantId: UUID; eventId: UUID }> = {};
    const participationsRef = ref(db, 'participations');

    participantIds.forEach(participantId => {
      const alreadyExists = participations.some(p => p.participantId === participantId && p.eventId === eventId);
      if (!alreadyExists) {
        const newKey = push(participationsRef).key;
        if (newKey) {
          updates[`/participations/${newKey}`] = { participantId, eventId };
          addedCount++;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }

    return { added: addedCount, skipped: participantIds.length - addedCount };
  }, [participations]);

  const deleteParticipation = useCallback(async (participantId: UUID, eventId: UUID) => {
    const participationsRef = ref(db, 'participations');
    const snapshot = await get(participationsRef);
    if(snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
            const participation = childSnapshot.val();
            if (participation.participantId === participantId && participation.eventId === eventId) {
                remove(ref(db, `participations/${childSnapshot.key}`));
            }
        });
    }
  }, []);
  
  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>): User => {
    const userListRef = ref(db, 'users');
    const newUserRef = push(userListRef);
    const newUserData = {
        ...userData,
        createdAt: new Date().toISOString(),
    };
    set(newUserRef, newUserData);
    return {
        ...newUserData,
        id: newUserRef.key!,
        createdAt: new Date(newUserData.createdAt),
    };
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    const { id, ...data } = updatedUser;
    const userRef = ref(db, `users/${id}`);
    update(userRef, {
        ...data,
        createdAt: data.createdAt.toISOString(),
    });
  }, []);

  const deleteUser = useCallback((userId: UUID) => {
    remove(ref(db, `users/${userId}`));
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
    deleteMultipleParticipants,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    participations,
    addParticipation,
    addMultipleParticipations,
    deleteParticipation,
    users,
    addUser,
    updateUser,
    deleteUser,
    kpis,
    isLoading,
    seedDatabase,
  };
};
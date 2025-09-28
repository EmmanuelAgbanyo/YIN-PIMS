import type { User, Participant, Event, Participation } from './types';
import { Gender, Region } from './types';

// --- USERS ---
export const seedUsers: User[] = [
  {
    id: 'user_super_admin',
    email: 'super@yin.com',
    password: 'password',
    role: 'Super Admin',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'user_admin',
    email: 'admin@yin.com',
    password: 'password',
    role: 'Admin',
    createdAt: new Date('2023-01-02'),
  },
  {
    id: 'user_organizer',
    email: 'organizer@yin.com',
    password: 'password',
    role: 'Organizer',
    createdAt: new Date('2023-01-03'),
  },
  {
    id: 'user_viewer',
    email: 'viewer@yin.com',
    password: 'password',
    role: 'Viewer',
    createdAt: new Date('2023-01-04'),
  },
];

// --- PARTICIPANTS ---
const participantNames = [
  "Ama Badu", "Kofi Mensah", "Adwoa Serwaa", "Yaw Owusu", "Akua Agyemang",
  "Kwame Appiah", "Esi Nkrumah", "Kweku Annan", "Abena Darko", "Kwasi Boakye",
  "Yaa Asantewaa", "Kojo Antwi", "Afia Amponsah", "Kwabena Asante", "Akosua Boateng"
];
const institutions = ['University of Ghana', 'KNUST', 'University of Cape Coast', 'Ashesi University', 'Accra Technical University'];
const regions = Object.values(Region);

export const seedParticipants: Participant[] = participantNames.map((name, index) => {
    const year = 2023 + Math.floor(index / 10); // Increment year for every 10 participants
    const idInYear = (index % 10) + 1;
    return {
        id: `participant_${index + 1}`,
        name,
        gender: index % 3 === 0 ? Gender.Female : Gender.Male,
        institution: institutions[index % institutions.length],
        region: regions[index % regions.length],
        contact: `+233 24 123 ${1000 + index}`,
        membershipStatus: Math.random() > 0.2, // 80% are active
        certificateIssued: false,
        notes: `Sample note for ${name}.`,
        createdAt: new Date(year, index % 12, (index % 28) + 1),
        membershipId: `YIN-${year}-${String(idInYear).padStart(3, '0')}`,
    };
});


// --- EVENTS ---
export const seedEvents: Event[] = [
  {
    id: 'event_1',
    title: 'Intro to Stock Market Investing',
    date: new Date('2024-03-15'),
    year: 2024,
    location: 'Accra',
    category: 'Workshop',
  },
  {
    id: 'event_2',
    title: 'Real Estate Investment Summit',
    date: new Date('2024-05-20'),
    year: 2024,
    location: 'Kumasi',
    category: 'Conference',
  },
  {
    id: 'event_3',
    title: 'YIN Annual Networking Gala',
    date: new Date('2024-07-10'),
    year: 2024,
    location: 'Accra',
    category: 'Networking',
  },
  {
    id: 'event_4',
    title: 'Financial Literacy for Students',
    date: new Date('2023-11-05'),
    year: 2023,
    location: 'Cape Coast',
    category: 'Seminar',
  },
    {
    id: 'event_5',
    title: 'The YIN Investment Challenge',
    date: new Date('2024-08-01'),
    year: 2024,
    location: 'Online',
    category: 'Competition',
  },
];

// --- PARTICIPATIONS ---
export const seedParticipations: Participation[] = [];

// Create participation data. Each event will have a random number of attendees.
seedEvents.forEach(event => {
  const shuffledParticipants = [...seedParticipants].sort(() => 0.5 - Math.random());
  const attendeeCount = Math.floor(Math.random() * (shuffledParticipants.length / 2)) + 5; 
  const attendees = shuffledParticipants.slice(0, attendeeCount);
  
  attendees.forEach(participant => {
    seedParticipations.push({
      participantId: participant.id,
      eventId: event.id,
    });
  });
});

export const seedData = {
    users: seedUsers,
    participants: seedParticipants,
    events: seedEvents,
    participations: seedParticipations
}
import type { User, Participant, Event, Participation, Club, ClubMembership, Volunteer, Activity } from './types';
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
    id: 'user_volunteer_coord',
    email: 'volunteer@yin.com',
    password: 'password',
    role: 'Volunteer Coordinator',
    createdAt: new Date('2023-01-03'),
  },
  {
    id: 'user_viewer',
    email: 'viewer@yin.com',
    password: 'password',
    role: 'Viewer',
    createdAt: new Date('2023-01-04'),
  },
  {
    id: 'user_club_exec',
    email: 'executive@yin.com',
    password: 'password',
    role: 'Club Executive',
    createdAt: new Date('2023-01-05'),
    assignedClubId: 'club_1', // Assigned to UG Business & Finance Club
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

// --- CLUBS ---
export const seedClubs: Club[] = [
    {
        id: 'club_1',
        name: 'UG Business & Finance Club',
        description: 'A club for students at the University of Ghana interested in finance.',
        institution: 'University of Ghana',
        createdAt: new Date('2023-09-01'),
    },
    {
        id: 'club_2',
        name: 'KNUST Tech Investors',
        description: 'Focuses on technology stocks and startups.',
        institution: 'KNUST',
        createdAt: new Date('2023-10-15'),
    },
    {
        id: 'club_3',
        name: 'UCC Investment Society',
        description: 'General investment club at the University of Cape Coast.',
        institution: 'University of Cape Coast',
        createdAt: new Date('2024-01-20'),
    }
];

// --- CLUB MEMBERSHIPS ---
export const seedClubMemberships: ClubMembership[] = [
    // Members for UG Club
    { participantId: 'participant_1', clubId: 'club_1', joinDate: new Date('2023-09-05') },
    { participantId: 'participant_6', clubId: 'club_1', joinDate: new Date('2023-09-10') },
    { participantId: 'participant_11', clubId: 'club_1', joinDate: new Date('2023-09-12') },
    // Members for KNUST Club
    { participantId: 'participant_2', clubId: 'club_2', joinDate: new Date('2023-10-20') },
    { participantId: 'participant_7', clubId: 'club_2', joinDate: new Date('2023-10-21') },
    // Members for UCC Club
    { participantId: 'participant_3', clubId: 'club_3', joinDate: new Date('2024-02-01') },
    { participantId: 'participant_8', clubId: 'club_3', joinDate: new Date('2024-02-05') },
    { participantId: 'participant_13', clubId: 'club_3', joinDate: new Date('2024-02-06') },
].map(cm => ({...cm, id: crypto.randomUUID()}));


// --- VOLUNTEERS ---
export const seedVolunteers: Volunteer[] = [
    { id: 'volunteer_1', participantId: 'participant_1', role: 'Event Staff', status: 'Active', startDate: new Date('2024-02-01') },
    { id: 'volunteer_2', participantId: 'participant_3', role: 'Mentor', status: 'Active', startDate: new Date('2024-01-15') },
    { id: 'volunteer_3', participantId: 'participant_5', role: 'Logistics', status: 'Inactive', startDate: new Date('2023-12-10') },
    { id: 'volunteer_4', participantId: 'participant_8', role: 'Event Staff', status: 'Active', startDate: new Date('2024-04-05') },
];

// --- ACTIVITIES ---
export const seedActivities: Activity[] = [
    // Activities for volunteer_1 (Ama Badu)
    { id: 'activity_1', volunteerId: 'volunteer_1', eventId: 'event_1', description: 'Assisted with registration and check-in.', hours: 4, date: new Date('2024-03-15') },
    { id: 'activity_2', volunteerId: 'volunteer_1', eventId: 'event_3', description: 'Helped set up the venue and decorations.', hours: 6, date: new Date('2024-07-09') },
    { id: 'activity_3', volunteerId: 'volunteer_1', description: 'Administrative tasks for Q2 planning.', hours: 8, date: new Date('2024-06-20') },
    
    // Activities for volunteer_2 (Adwoa Serwaa)
    { id: 'activity_4', volunteerId: 'volunteer_2', eventId: 'event_4', description: 'Led a breakout session on budgeting.', hours: 3, date: new Date('2023-11-05') },
    { id: 'activity_5', volunteerId: 'volunteer_2', description: 'Mentored two new YIN members.', hours: 10, date: new Date('2024-05-15') },
    { id: 'activity_6', volunteerId: 'volunteer_2', eventId: 'event_5', description: 'Judged first round of the competition.', hours: 5, date: new Date('2024-08-01') },

    // Activities for volunteer_4 (Kweku Annan)
    { id: 'activity_7', volunteerId: 'volunteer_4', eventId: 'event_2', description: 'Managed the Q&A microphone during panels.', hours: 5, date: new Date('2024-05-20') },
    { id: 'activity_8', volunteerId: 'volunteer_4', description: 'Helped with social media promotion.', hours: 3, date: new Date('2024-05-18') },
];


export const seedData = {
    users: seedUsers,
    participants: seedParticipants,
    events: seedEvents,
    participations: seedParticipations,
    clubs: seedClubs,
    clubMemberships: seedClubMemberships,
    volunteers: seedVolunteers,
    activities: seedActivities,
};

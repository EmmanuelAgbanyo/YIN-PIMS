
export type UUID = string;

export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
}

export enum Region {
  Ashanti = 'Ashanti',
  GreaterAccra = 'Greater Accra',
  Volta = 'Volta',
  Western = 'Western',
  Eastern = 'Eastern',
  Central = 'Central',
}

export type UserRole = 'Super Admin' | 'Admin' | 'Organizer' | 'Viewer';

export interface User {
  id: UUID;
  email: string;
  password?: string; // For seed data, should not be exposed in app state
  role: UserRole;
  createdAt: Date;
}

export interface Participant {
  id: UUID;
  name: string;
  gender: Gender;
  institution: string;
  region: Region;
  contact: string;
  membershipStatus: boolean;
  certificateIssued: boolean;
  notes: string;
  createdAt: Date;
  membershipId: string;
  engagementScore?: number;
  lastMembershipCardGeneratedAt?: Date;
  photoUrl?: string; // For membership card
}

export interface Event {
  id: UUID;
  title: string;
  date: Date;
  year: number;
  location: string;
  category: string;
}

export interface Participation {
  id?: UUID; // To hold the firebase key
  participantId: UUID;
  eventId: UUID;
}

export interface KPIs {
  totalParticipants: number;
  activeMembers: number;
  totalEvents: number;
  averageParticipationRate: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export type AppView =
  | 'dashboard'
  | 'participants'
  | 'events'
  | 'registrations'
  | 'reports'
  | 'certificates'
  | 'verification'
  | 'settings'
  | 'profile';
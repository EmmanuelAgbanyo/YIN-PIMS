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
  participantId: UUID;
  eventId: UUID;
}

export interface User {
  id: UUID;
  email: string;
  password: string; // In a real app, this would be a hash
  role: UserRole;
  createdAt: Date;
}

export type View = 'dashboard' | 'participants' | 'events' | 'registrations' | 'reports' | 'certificates' | 'settings';

export type UserRole = 'Super Admin' | 'Admin/Staff';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

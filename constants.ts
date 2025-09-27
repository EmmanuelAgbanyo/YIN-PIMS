

// Fix: Changed 'import type' to a regular 'import' to allow enums to be used as values.
import { Gender, Region } from './types';

export const GENDERS: Gender[] = [Gender.Male, Gender.Female, Gender.Other];
export const REGIONS: Region[] = [Region.Ashanti, Region.GreaterAccra, Region.Volta, Region.Western, Region.Eastern, Region.Central];
export const INSTITUTIONS: string[] = [
    'University of Ghana', 
    'KNUST', 
    'University of Cape Coast', 
    'Ashesi University', 
    'Accra Technical University'
];
export const EVENT_CATEGORIES: string[] = ['Workshop', 'Seminar', 'Conference', 'Networking', 'Competition'];
export const LOCATIONS: string[] = ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Koforidua'];
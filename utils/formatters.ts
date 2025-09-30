/**
 * Generates a short code for an institution name.
 * @param institution The full name of the institution.
 * @returns A short, uppercase code (e.g., 'UG', 'KNUST').
 */
export const getInstitutionCode = (institution: string): string => {
    if (!institution) return 'N/A';
    
    const knownCodes: { [key: string]: string } = {
        'University of Ghana': 'UG',
        'KNUST': 'KNUST',
        'Kwame Nkrumah University of Science and Technology': 'KNUST',
        'University of Cape Coast': 'UCC',
        'Ashesi University': 'ASH',
        'Accra Technical University': 'ATU',
    };

    const trimmedInstitution = institution.trim();
    
    // Check against known codes, case-insensitively for robustness
    for (const key in knownCodes) {
        if (key.toLowerCase() === trimmedInstitution.toLowerCase()) {
            return knownCodes[key];
        }
    }

    // Fallback: Generate from initials
    return trimmedInstitution
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 5); // Limit length to 5 chars
};

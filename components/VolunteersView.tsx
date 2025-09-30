import React, { useState, useMemo, useEffect } from 'react';
import type { usePIMSData } from '../hooks/usePIMSData';
import type { User, Volunteer, Participant, Activity, UUID } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { VolunteerDetailPanel } from './VolunteerDetailPanel';
import { AddVolunteerModal } from './AddVolunteerModal';
import { ImportVolunteersModal } from './ImportVolunteersModal';
import { useToast } from '../hooks/useToast';
import { exportToCsv } from '../utils/csv';


type VolunteersViewProps = ReturnType<typeof usePIMSData> & { currentUser: User };

const statusStyles: Record<string, string> = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export const VolunteersView: React.FC<VolunteersViewProps> = (props) => {
    const { participants, volunteers, activities, currentUser } = props;
    const [selectedVolunteerId, setSelectedVolunteerId] = useState<UUID | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const addToast = useToast();

    const canManage = ['Super Admin', 'Admin', 'Volunteer Coordinator'].includes(currentUser.role);
    
    const volunteersWithDetails = useMemo(() => {
        // Fix: Explicitly type the Map to prevent `participant` from being inferred as `unknown`.
        const participantMap: Map<UUID, Participant> = new Map(participants.map(p => [p.id, p]));
        const activityHoursMap = new Map<UUID, number>();

        activities.forEach(act => {
            const volunteer = volunteers.find(v => v.id === act.volunteerId);
            if (volunteer) {
                 activityHoursMap.set(volunteer.id, (activityHoursMap.get(volunteer.id) || 0) + act.hours);
            }
        });

        return volunteers.map(v => {
            const participant = participantMap.get(v.participantId);
            return {
                ...v,
                name: participant?.name || 'Unknown',
                photoUrl: participant?.photoUrl,
                contact: participant?.contact || 'N/A',
                institution: participant?.institution || 'N/A',
                totalHours: activityHoursMap.get(v.id) || 0,
            };
        })
        .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a,b) => a.name.localeCompare(b.name));
    }, [participants, volunteers, activities, searchTerm]);

    const kpis = useMemo(() => {
        const activeVolunteers = volunteers.filter(v => v.status === 'Active').length;
        const totalHoursThisYear = activities
            .filter(a => a.date.getFullYear() === new Date().getFullYear())
            .reduce((sum, a) => sum + a.hours, 0);
        
        const monthlyHours = new Map<string, number>();
        const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
        activities
            .filter(a => `${a.date.getFullYear()}-${a.date.getMonth()}` === currentMonthKey)
            .forEach(a => monthlyHours.set(a.volunteerId, (monthlyHours.get(a.volunteerId) || 0) + a.hours));

        let topVolunteerThisMonth = { name: 'N/A', hours: 0 };
        if (monthlyHours.size > 0) {
            const topVolunteerId = [...monthlyHours.entries()].sort((a,b) => b[1] - a[1])[0][0];
            const topVolData = volunteersWithDetails.find(v => v.id === topVolunteerId);
            if (topVolData) {
                topVolunteerThisMonth = { name: topVolData.name, hours: monthlyHours.get(topVolunteerId)! };
            }
        }

        return { activeVolunteers, totalHoursThisYear, topVolunteerThisMonth };
    }, [volunteers, activities, volunteersWithDetails]);

    const leaderboard = useMemo(() => {
        return [...volunteersWithDetails].sort((a, b) => b.totalHours - a.totalHours).slice(0, 5);
    }, [volunteersWithDetails]);
    
    const selectedVolunteerData = useMemo(() => {
        if (!selectedVolunteerId) return null;
        return volunteersWithDetails.find(v => v.id === selectedVolunteerId) || null;
    }, [selectedVolunteerId, volunteersWithDetails]);
    
    // Auto-select first volunteer or handle deselection
    useEffect(() => {
        if (volunteersWithDetails.length > 0 && !selectedVolunteerData) {
            setSelectedVolunteerId(volunteersWithDetails[0].id);
        }
        if (volunteersWithDetails.length === 0) {
            setSelectedVolunteerId(null);
        }
    }, [volunteersWithDetails, selectedVolunteerData]);

    const handleExport = () => {
        if (volunteersWithDetails.length === 0) {
            addToast('No volunteer data to export.', 'info');
            return;
        }

        const dataToExport = volunteersWithDetails.map(v => ({
            'ParticipantName': v.name,
            'Contact': v.contact,
            'Institution': v.institution,
            'VolunteerRole': v.role,
            'VolunteerStatus': v.status,
            'StartDate': v.startDate.toLocaleDateString(),
            'TotalHoursLogged': v.totalHours,
        }));
        
        const filename = `YIN-Volunteers-Export-${new Date().toISOString().split('T')[0]}.csv`;
        exportToCsv(filename, dataToExport);
        addToast('Volunteer data exported successfully!', 'success');
    };

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Active Volunteers" value={kpis.activeVolunteers} icon={<UsersIcon />} color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" />
                <Card title="Hours Logged (This Year)" value={kpis.totalHoursThisYear} icon={<ClockIcon />} color="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" />
                <Card title="Top Volunteer (Month)" value={kpis.topVolunteerThisMonth.name} icon={<StarIcon />} color="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300" />
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-2">Leaderboard</h3>
                    <ul className="space-y-1">
                        {leaderboard.map((v, i) => (
                            <li key={v.id} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{i+1}. {v.name}</span>
                                <span className="font-bold text-primary">{v.totalHours} hrs</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col md:flex-row h-full gap-6 max-h-[calc(100vh-270px)]">
                {/* Left Panel: Volunteer List */}
                <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-2 p-2 flex-wrap gap-2">
                        <h2 className="text-xl font-semibold">Volunteers ({volunteersWithDetails.length})</h2>
                        {canManage && (
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsImportModalOpen(true)}><UploadIcon /> Import</Button>
                                <Button size="sm" variant="ghost" onClick={handleExport}><DownloadIcon /> Export</Button>
                                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>Add</Button>
                            </div>
                        )}
                    </div>
                    <div className="mb-4 px-2">
                        <Input label="Search volunteers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="overflow-y-auto space-y-2">
                        {volunteersWithDetails.map(v => (
                            <div
                                key={v.id}
                                onClick={() => setSelectedVolunteerId(v.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedVolunteerId === v.id ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <img src={v.photoUrl || `https://ui-avatars.com/api/?name=${v.name}&background=random`} alt={v.name} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold">{v.name}</p>
                                    <p className={`text-sm ${selectedVolunteerId === v.id ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{v.role}</p>
                                </div>
                                <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[v.status]}`}>{v.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Right Panel: Details */}
                <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
                    {selectedVolunteerData ? (
                        <VolunteerDetailPanel
                            key={selectedVolunteerId}
                            volunteer={selectedVolunteerData}
                            {...props}
                        />
                    ) : (
                        <div className="flex-1 flex justify-center items-center">
                            <div className="text-center text-gray-500">
                                <HeartIcon />
                                <h3 className="text-xl font-semibold mt-4">No Volunteer Selected</h3>
                                <p>Select a volunteer from the list to view their details.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {isAddModalOpen && (
                <AddVolunteerModal 
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    {...props}
                />
            )}

            {isImportModalOpen && (
                <ImportVolunteersModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    {...props}
                />
            )}
        </div>
    );
};

// --- Icons ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0L8 8m4-4v12" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { usePIMSData } from '../hooks/usePIMSData';
import type { User, Volunteer, Participant, Activity, Event, UUID, VolunteerRole, VolunteerStatus } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { FormGroup } from './ui/FormGroup';
import { useToast } from '../hooks/useToast';

interface VolunteerWithDetails extends Volunteer {
    name: string;
    photoUrl?: string;
    totalHours: number;
}

type VolunteerDetailPanelProps = Omit<ReturnType<typeof usePIMSData>, 'volunteers' | 'participants'> & {
    volunteer: VolunteerWithDetails;
    currentUser: User;
    events: Event[];
    activities: Activity[];
};

const VOLUNTEER_ROLES: VolunteerRole[] = ['Event Staff', 'Mentor', 'Logistics', 'Administrative', 'Fundraising'];
const VOLUNTEER_STATUSES: VolunteerStatus[] = ['Active', 'Inactive', 'Pending'];

const statusStyles: Record<string, string> = {
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

// Log Activity Form
const LogActivityForm: React.FC<{
    volunteerId: UUID;
    events: Event[];
    addActivity: (activity: Omit<Activity, 'id'>) => Promise<any>;
    onLogged: () => void;
}> = ({ volunteerId, events, addActivity, onLogged }) => {
    const [formData, setFormData] = useState({
        description: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        eventId: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(formData.hours);
        if (isNaN(hours) || hours <= 0) {
            alert('Please enter a valid number of hours.');
            return;
        }
        await addActivity({
            volunteerId,
            description: formData.description,
            hours,
            date: new Date(formData.date),
            eventId: formData.eventId || undefined,
        });
        onLogged();
        setFormData({ description: '', hours: '', date: new Date().toISOString().split('T')[0], eventId: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
            <h4 className="font-semibold">Log New Activity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <FormGroup><Input label="Description" name="description" value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} required /></FormGroup>
                 <FormGroup><Input label="Hours" type="number" name="hours" value={formData.hours} onChange={e => setFormData(f => ({...f, hours: e.target.value}))} required step="0.5" min="0" /></FormGroup>
                 <FormGroup><Input label="Date" type="date" name="date" value={formData.date} onChange={e => setFormData(f => ({...f, date: e.target.value}))} required /></FormGroup>
                 <FormGroup>
                    <Select label="Link to Event (Optional)" name="eventId" value={formData.eventId} onChange={e => setFormData(f => ({...f, eventId: e.target.value}))}>
                        <option value="">None</option>
                        {events.sort((a,b) => b.date.getTime() - a.date.getTime()).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </Select>
                 </FormGroup>
            </div>
            <Button type="submit" size="sm" className="w-full">Log Activity</Button>
        </form>
    );
};


export const VolunteerDetailPanel: React.FC<VolunteerDetailPanelProps> = (props) => {
    const { volunteer, currentUser, activities, events, updateVolunteer, deleteVolunteer, addActivity, deleteActivity } = props;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const addToast = useToast();

    const canManage = ['Super Admin', 'Admin', 'Volunteer Coordinator'].includes(currentUser.role);
    
    const volunteerActivities = useMemo(() => {
        return activities
            .filter(a => a.volunteerId === volunteer.id)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activities, volunteer.id]);

    const contributionData = useMemo(() => {
        const monthlyHours = new Map<string, number>();
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);

        volunteerActivities.forEach(act => {
            if (act.date > lastYear) {
                const monthKey = act.date.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlyHours.set(monthKey, (monthlyHours.get(monthKey) || 0) + act.hours);
            }
        });
        // We need to ensure we have data for the last 12 months for a consistent chart
        const data = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            data.push({
                name: monthKey,
                hours: monthlyHours.get(monthKey) || 0,
            });
        }
        return data;
    }, [volunteerActivities]);

    const handleUpdate = async (formData: { role: VolunteerRole, status: VolunteerStatus, startDate: string }) => {
        await updateVolunteer({
            ...volunteer,
            role: formData.role,
            status: formData.status,
            startDate: new Date(formData.startDate),
        });
        addToast(`${volunteer.name}'s details updated.`, 'success');
        setIsEditModalOpen(false);
    };
    
    const handleDelete = async () => {
        await deleteVolunteer(volunteer.id);
        addToast(`${volunteer.name} removed from volunteers.`, 'success');
        setIsConfirmDeleteOpen(false);
    };

    const handleLogActivity = () => {
        // This is a placeholder for potential state refresh logic if needed
        addToast('Activity logged!', 'success');
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <img src={volunteer.photoUrl || `https://ui-avatars.com/api/?name=${volunteer.name}&background=random`} alt={volunteer.name} className="w-16 h-16 rounded-full object-cover" />
                    <div>
                        <h2 className="text-2xl font-bold">{volunteer.name}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>{volunteer.role}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[volunteer.status]}`}>{volunteer.status}</span>
                        </div>
                    </div>
                     <div className="ml-auto flex gap-2">
                        {canManage && <Button variant="ghost" onClick={() => setIsEditModalOpen(true)}>Edit</Button>}
                        {canManage && <Button variant="danger" onClick={() => setIsConfirmDeleteOpen(true)}>Remove</Button>}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-y-auto">
                {/* Left side: Chart and Activity Log Form */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div>
                        <h3 className="font-semibold mb-2">Contribution Timeline (Last 12 Months)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={contributionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'rgba(240,240,240,0.5)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                                <Bar dataKey="hours" fill="#1D4ED8" name="Hours Logged" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     {canManage && <LogActivityForm volunteerId={volunteer.id} events={events} addActivity={addActivity} onLogged={handleLogActivity} />}
                </div>

                {/* Right side: Activity List */}
                <div className="lg:col-span-2 flex flex-col gap-2">
                    <h3 className="font-semibold">Activity Log ({volunteerActivities.length})</h3>
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {volunteerActivities.length > 0 ? volunteerActivities.map(act => (
                            <div key={act.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm">{act.description}</p>
                                    <span className="text-sm font-bold text-primary">{act.hours} hrs</span>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                                    <span>{act.date.toLocaleDateString()}</span>
                                     {canManage && <button onClick={() => deleteActivity(act.id)} className="text-red-500 hover:underline">Delete</button>}
                                </div>
                            </div>
                        )) : <p className="text-center text-sm text-gray-500 pt-8">No activities logged yet.</p>}
                    </div>
                </div>
            </div>
            
            {isEditModalOpen && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${volunteer.name}`}>
                    <EditVolunteerForm volunteer={volunteer} onSubmit={handleUpdate} onClose={() => setIsEditModalOpen(false)} />
                </Modal>
            )}

            <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Removal">
                <div>
                    <p>Are you sure you want to remove <strong>{volunteer.name}</strong> as a volunteer? This will also delete all their logged activities.</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Remove Volunteer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


const EditVolunteerForm: React.FC<{
    volunteer: Volunteer;
    onSubmit: (formData: { role: VolunteerRole, status: VolunteerStatus, startDate: string }) => void;
    onClose: () => void;
}> = ({ volunteer, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        role: volunteer.role,
        status: volunteer.status,
        startDate: volunteer.startDate.toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormGroup>
                <Select label="Role" value={formData.role} onChange={e => setFormData(f => ({...f, role: e.target.value as VolunteerRole}))}>
                    {VOLUNTEER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </FormGroup>
            <FormGroup>
                <Select label="Status" value={formData.status} onChange={e => setFormData(f => ({...f, status: e.target.value as VolunteerStatus}))}>
                    {VOLUNTEER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
            </FormGroup>
            <FormGroup>
                <Input label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData(f => ({...f, startDate: e.target.value}))} />
            </FormGroup>
             <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    );
};

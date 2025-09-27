import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { usePIMSData } from '../hooks/usePIMSData';
import { Card } from './ui/Card';
import type { Region, Gender, Participant } from '../types';
import { REGIONS, INSTITUTIONS } from '../constants';

type DashboardProps = ReturnType<typeof usePIMSData>;

const COLORS = ['#1D4ED8', '#9333EA', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'];

export const Dashboard: React.FC<DashboardProps> = ({ participants, events, participations, kpis: rawKpis }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');

  const years = useMemo(() => ['all', ...Array.from(new Set(events.map(e => e.year))).sort((a,b) => b - a).map(String)], [events]);
  const regions = useMemo(() => ['all', ...REGIONS], []);
  const institutions = useMemo(() => ['all', ...INSTITUTIONS], []);

  const filteredData = useMemo(() => {
    let filteredParticipants = [...participants];
    
    if (selectedRegion !== 'all') {
      filteredParticipants = filteredParticipants.filter(p => p.region === selectedRegion);
    }
    if (selectedInstitution !== 'all') {
      filteredParticipants = filteredParticipants.filter(p => p.institution === selectedInstitution);
    }

    const filteredParticipantIds = new Set(filteredParticipants.map(p => p.id));
    
    let filteredEvents = [...events];
    if (selectedYear !== 'all') {
        filteredEvents = filteredEvents.filter(e => e.year === parseInt(selectedYear, 10));
    }

    const filteredEventIds = new Set(filteredEvents.map(e => e.id));

    const filteredParticipations = participations.filter(p => 
        filteredParticipantIds.has(p.participantId) && filteredEventIds.has(p.eventId)
    );
    
    return {
        participants: filteredParticipants,
        events: filteredEvents,
        participations: filteredParticipations
    };

  }, [participants, events, participations, selectedYear, selectedRegion, selectedInstitution]);

  const participationFrequency = useMemo(() => {
    const frequency = new Map<string, number>();
    filteredData.participations.forEach(p => {
        frequency.set(p.participantId, (frequency.get(p.participantId) || 0) + 1);
    });
    return frequency;
  }, [filteredData.participations]);

  const kpis = useMemo(() => {
      const totalParticipants = filteredData.participants.length;
      const activeMembers = filteredData.participants.filter(p => p.membershipStatus).length;
      const totalEvents = filteredData.events.length;
      const totalParticipations = filteredData.participations.length;
      const averageParticipationRate = totalParticipants > 0 && totalEvents > 0 ? (totalParticipations / totalParticipants) / totalEvents * 100 : 0;

      return {
          totalParticipants,
          activeMembers,
          totalEvents,
          averageParticipationRate: parseFloat(averageParticipationRate.toFixed(1))
      };
  }, [filteredData]);


  const regionalDistribution = useMemo(() => {
    const distribution = new Map<Region, number>();
    filteredData.participants.forEach(p => {
      distribution.set(p.region, (distribution.get(p.region) || 0) + 1);
    });
    return Array.from(distribution.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData.participants]);
  
  const genderBreakdown = useMemo(() => {
    const breakdown = new Map<Gender, number>();
    filteredData.participants.forEach(p => {
      breakdown.set(p.gender, (breakdown.get(p.gender) || 0) + 1);
    });
    return Array.from(breakdown.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData.participants]);

  const topEngagedParticipants = useMemo(() => {
    return Array.from(participationFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([participantId, eventsAttended]) => {
        const participant = participants.find(p => p.id === participantId);
        return {
          name: participant ? participant.name.split(' ')[0] : 'Unknown',
          eventsAttended,
        };
      });
  }, [participationFrequency, participants]);

  const participationTrends = useMemo(() => {
    const trends = new Map<string, { participants: Set<string> }>();
    const sortedEvents = [...filteredData.events].sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedEvents.forEach(event => {
        const monthYear = `${event.date.getFullYear()}-${String(event.date.getMonth() + 1).padStart(2, '0')}`;
        if (!trends.has(monthYear)) {
            trends.set(monthYear, { participants: new Set() });
        }
    });

    filteredData.participants.forEach(p => {
      const registrationMonth = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (trends.has(registrationMonth)) {
        trends.get(registrationMonth)!.participants.add(p.id);
      }
    });

    return Array.from(trends.entries()).map(([name, data]) => ({ name, registrations: data.participants.size })).slice(-12);
  }, [filteredData.participants, filteredData.events]);


  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-wrap items-center gap-4">
          <h3 className="text-md font-semibold mr-4">Filters:</h3>
          <FilterSelect label="Year" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} options={years} />
          <FilterSelect label="Region" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} options={regions} />
          <FilterSelect label="Institution" value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} options={institutions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Participants" value={kpis.totalParticipants} icon={<UsersIcon />} color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" />
        <Card title="Active Members" value={kpis.activeMembers} icon={<CheckCircleIcon />} color="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300" />
        <Card title="Total Events" value={kpis.totalEvents} icon={<CalendarIcon />} color="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300" />
        <Card title="Avg. Participation" value={`${kpis.averageParticipationRate}%`} icon={<TrendingUpIcon />} color="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Top 10 Engaged Participants</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topEngagedParticipants} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.2)"/>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip cursor={{fill: 'rgba(240,240,240,0.5)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
              <Legend />
              <Bar dataKey="eventsAttended" name="Events Attended" fill="#1D4ED8" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h3 className="text-lg font-semibold mb-4">Participation Trends (New Registrations)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={participationTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                <Legend />
                <Line type="monotone" dataKey="registrations" stroke="#9333EA" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={regionalDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                        {regionalDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Gender Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={genderBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#82ca9d" paddingAngle={5} label>
                        {genderBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff' }}/>
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
  );
};

const FilterSelect: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[]}> = ({label, value, onChange, options}) => (
    <div className="flex items-center gap-2">
        <label htmlFor={label} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}:</label>
        <select id={label} value={value} onChange={onChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {options.map(opt => <option key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</option>)}
        </select>
    </div>
);


// --- SVG Icons ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

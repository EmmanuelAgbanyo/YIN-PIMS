import React, { useState, useMemo, useCallback } from 'react';
// Fix: Added UUID to import to be used for explicit map typing.
import type { Participant, Event, Participation, UUID } from '../types';
import { Button } from './ui/Button';
import { exportToCsv } from '../utils/csv';
import { useToast } from '../hooks/useToast';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { FormGroup } from './ui/FormGroup';
import { REGIONS } from '../constants';

interface ReportsViewProps {
  participants: Participant[];
  events: Event[];
  participations: Participation[];
}

const ALL_COLUMNS = {
  participantName: { label: 'Participant Name', default: true },
  participantContact: { label: 'Participant Contact', default: true },
  participantRegion: { label: 'Participant Region', default: false },
  participantInstitution: { label: 'Participant Institution', default: true },
  eventName: { label: 'Event Name', default: true },
  eventDate: { label: 'Event Date', default: true },
  eventLocation: { label: 'Event Location', default: false },
};

type ColumnKey = keyof typeof ALL_COLUMNS;

const ITEMS_PER_PAGE = 10;

export const ReportsView: React.FC<ReportsViewProps> = ({ participants, events, participations }) => {
  const addToast = useToast();
  
  // State for filters
  const [filters, setFilters] = useState({
    eventId: 'all',
    startDate: '',
    endDate: '',
    region: 'all',
    institution: 'all',
  });

  // State for columns
  const [selectedColumns, setSelectedColumns] = useState<Set<ColumnKey>>(
    new Set(Object.keys(ALL_COLUMNS).filter(key => ALL_COLUMNS[key as ColumnKey].default) as ColumnKey[])
  );

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueInstitutions = useMemo(() => Array.from(new Set(participants.map(p => p.institution))).sort(), [participants]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleColumnChange = (key: ColumnKey) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const reportData = useMemo(() => {
    // Fix: Explicitly typing maps to fix type inference issues within filter/map callbacks.
    const participantMap: Map<UUID, Participant> = new Map(participants.map(p => [p.id, p]));
    const eventMap: Map<UUID, Event> = new Map(events.map(e => [e.id, e]));

    return participations
      .filter(p => {
        const event = eventMap.get(p.eventId);
        const participant = participantMap.get(p.participantId);
        if (!event || !participant) return false;

        if (filters.eventId !== 'all' && p.eventId !== filters.eventId) return false;
        if (filters.region !== 'all' && participant.region !== filters.region) return false;
        if (filters.institution !== 'all' && participant.institution !== filters.institution) return false;
        if (filters.startDate && event.date < new Date(filters.startDate)) return false;
        if (filters.endDate && event.date > new Date(filters.endDate)) return false;

        return true;
      })
      .map(p => {
        const participant = participantMap.get(p.participantId)!;
        const event = eventMap.get(p.eventId)!;
        return {
          participantName: participant.name,
          participantContact: participant.contact,
          participantRegion: participant.region,
          participantInstitution: participant.institution,
          eventName: event.title,
          eventDate: event.date.toLocaleDateString(),
          eventLocation: event.location,
        };
      })
      .sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [participations, participants, events, filters]);

  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
  const paginatedData = reportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExport = () => {
    if (reportData.length === 0) {
      addToast('No data to export based on current filters.', 'error');
      return;
    }

    const orderedColumns = (Object.keys(ALL_COLUMNS) as ColumnKey[]).filter(key => selectedColumns.has(key));
    
    const dataToExport = reportData.map(row => {
      const exportedRow: Record<string, any> = {};
      orderedColumns.forEach(key => {
        exportedRow[ALL_COLUMNS[key].label] = row[key];
      });
      return exportedRow;
    });

    const filename = `YIN_PIMS_Event_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename, dataToExport);
    addToast(`${reportData.length} records exported successfully!`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[calc(100vh-120px)]">
      {/* Left Panel: Configuration */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2">Report Generator</h1>
        
        {/* Filters */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <FormGroup>
            <Select name="eventId" label="Event" value={filters.eventId} onChange={handleFilterChange}>
              <option value="all">All Events</option>
              {events.sort((a,b) => b.date.getTime() - a.date.getTime()).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup><Input name="startDate" label="Start Date" type="date" value={filters.startDate} onChange={handleFilterChange} /></FormGroup>
            <FormGroup><Input name="endDate" label="End Date" type="date" value={filters.endDate} onChange={handleFilterChange} /></FormGroup>
          </div>
          <FormGroup>
            <Select name="region" label="Region" value={filters.region} onChange={handleFilterChange}>
              <option value="all">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </FormGroup>
           <FormGroup>
            <Select name="institution" label="Institution" value={filters.institution} onChange={handleFilterChange}>
              <option value="all">All Institutions</option>
              {uniqueInstitutions.map(i => <option key={i} value={i}>{i}</option>)}
            </Select>
          </FormGroup>
        </div>
        
        {/* Columns */}
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Columns</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {(Object.keys(ALL_COLUMNS) as ColumnKey[]).map(key => (
                  <Checkbox 
                      key={key} 
                      label={ALL_COLUMNS[key].label}
                      checked={selectedColumns.has(key)}
                      onChange={() => handleColumnChange(key)}
                  />
              ))}
            </div>
        </div>

        {/* Export Action */}
        <div>
          <Button className="w-full !mt-4" onClick={handleExport} disabled={reportData.length === 0}>
            <DownloadIcon />
            Export {reportData.length} Records (CSV)
          </Button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col">
         <h2 className="text-xl font-semibold mb-4">Report Preview</h2>
         <div className="overflow-x-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
               <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {(Object.keys(ALL_COLUMNS) as ColumnKey[]).filter(key => selectedColumns.has(key)).map(key => (
                       <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{ALL_COLUMNS[key].label}</th>
                    ))}
                  </tr>
               </thead>
               <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.length > 0 ? paginatedData.map((row, index) => (
                    <tr key={index}>
                        {(Object.keys(ALL_COLUMNS) as ColumnKey[]).filter(key => selectedColumns.has(key)).map(key => (
                           <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{row[key]}</td>
                        ))}
                    </tr>
                )) : (
                  <tr>
                    <td colSpan={selectedColumns.size || 1} className="text-center py-10 text-gray-500">
                        No data matches your current filters.
                    </td>
                  </tr>
                )}
               </tbody>
            </table>
         </div>
         {/* Pagination */}
         {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-auto">
                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
         )}
      </div>
    </div>
  );
};

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
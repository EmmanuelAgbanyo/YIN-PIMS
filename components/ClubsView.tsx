import React, { useState, useEffect, useMemo } from 'react';
import type { usePIMSData } from '../hooks/usePIMSData';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import type { Club, User } from '../types';
import { INSTITUTIONS } from '../constants';
import { useToast } from '../hooks/useToast';
import { ClubDetailPanel } from './ClubDetailPanel';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { FormGroup } from './ui/FormGroup';

type ClubsViewProps = ReturnType<typeof usePIMSData> & { currentUser: User };

const initialClubState: Omit<Club, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  institution: '',
};

const ClubForm: React.FC<{
  onSubmit: (club: Omit<Club, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Club | null;
  onClose: () => void;
}> = ({ onSubmit, initialData, onClose }) => {
  
  const [formData, setFormData] = useState(initialData || initialClubState);

  useEffect(() => {
    setFormData(initialData || initialClubState);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup>
        <Input type="text" label="Club Name" name="name" value={formData.name} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Input list="institutions" label="Institution" name="institution" value={formData.institution} onChange={handleChange} required />
        <datalist id="institutions">
            {INSTITUTIONS.map(i => <option key={i} value={i} />)}
        </datalist>
      </FormGroup>
      <FormGroup>
        <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} rows={4} />
      </FormGroup>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Club' : 'Create Club'}</Button>
      </div>
    </form>
  );
};

export const ClubsView: React.FC<ClubsViewProps> = (props) => {
  const { clubs, addClub, updateClub, currentUser } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const addToast = useToast();
  
  const canCreateClub = ['Super Admin', 'Admin', 'Organizer'].includes(currentUser.role);
  
  const filteredAndSortedClubs = useMemo(() => {
    return clubs
      .filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.institution.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let comparison = 0;
        if (sortKey === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else { // createdAt
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [clubs, searchTerm, sortKey, sortDirection]);

  useEffect(() => {
    if (!selectedClub && filteredAndSortedClubs.length > 0) {
        setSelectedClub(filteredAndSortedClubs[0]);
    }
     if (selectedClub && !filteredAndSortedClubs.find(c => c.id === selectedClub.id)) {
      setSelectedClub(filteredAndSortedClubs[0] || null);
    }
  }, [filteredAndSortedClubs, selectedClub]);
  
  const handleAdd = () => {
    setEditingClub(null);
    setIsModalOpen(true);
  };

  const handleEditRequest = (club: Club) => {
      setEditingClub(club);
      setIsModalOpen(true);
  };
  
  const handleFormSubmit = async (data: Omit<Club, 'id' | 'createdAt'>) => {
    if (editingClub) {
      await updateClub({ ...editingClub, ...data });
      addToast('Club updated successfully!', 'success');
    } else {
      await addClub(data);
      addToast('Club created successfully!', 'success');
    }
    setIsModalOpen(false);
    setEditingClub(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 max-h-[calc(100vh-120px)]">
      {/* Left Panel: Club List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2 p-2 flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Clubs ({filteredAndSortedClubs.length})</h2>
            {canCreateClub && <Button onClick={handleAdd}>Create Club</Button> }
        </div>
        <div className="mb-4 px-2">
            <Input label="Search clubs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-4 mb-2 px-2">
            <p className="text-sm font-medium text-gray-500">Sort by:</p>
             <select value={sortKey} onChange={e => setSortKey(e.target.value as 'name' | 'createdAt')} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-auto p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="name">Name</option>
                <option value="createdAt">Date Created</option>
            </select>
            <button onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                {sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
            </button>
        </div>
        <div className="overflow-y-auto space-y-2">
            {filteredAndSortedClubs.map(club => (
                <div
                    key={club.id}
                    onClick={() => setSelectedClub(club)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${
                        selectedClub?.id === club.id 
                        ? 'bg-primary text-white shadow-md border-blue-300' 
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <p className="font-semibold">{club.name}</p>
                    <p className={`text-sm ${selectedClub?.id === club.id ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {club.institution}
                    </p>
                </div>
            ))}
        </div>
      </div>
      
      {/* Right Panel: Details and Members */}
      <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
        {selectedClub ? (
            <ClubDetailPanel
                key={selectedClub.id} // Re-mount component when club changes to reset state
                club={selectedClub}
                onEdit={handleEditRequest}
                currentUser={currentUser}
                {...props}
            />
        ) : (
            <div className="flex-1 flex justify-center items-center">
                <div className="text-center text-gray-500">
                    <CollectionIcon />
                    <h3 className="text-xl font-semibold mt-4">No Club Selected</h3>
                    <p>Select a club from the list to manage its members.</p>
                </div>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingClub(null); }} title={editingClub ? 'Edit Club' : 'Create New Club'}>
        <ClubForm onSubmit={handleFormSubmit} initialData={editingClub} onClose={() => { setIsModalOpen(false); setEditingClub(null); }} />
      </Modal>
    </div>
  );
};

// Icons
const CollectionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h-2" /></svg>;
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 100 2h14a1 1 0 100-2H3z" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 100 2h14a1 1 0 100-2H3z" transform="rotate(180 10 10)" /></svg>;
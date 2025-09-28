import React, { useState, useMemo, useEffect } from 'react';
import type { usePIMSData } from '../hooks/usePIMSData';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import type { Participant, UserRole, UUID } from '../types';
import { GENDERS, REGIONS, INSTITUTIONS } from '../constants';
import { useToast } from '../hooks/useToast';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Textarea } from './ui/Textarea';
import { FormGroup } from './ui/FormGroup';

type ParticipantsViewProps = Omit<ReturnType<typeof usePIMSData>, 'deleteParticipant'> & { 
    deleteParticipant: (id: UUID) => void,
    deleteMultipleParticipants: (ids: UUID[]) => void,
    currentUserRole: UserRole 
};

const initialParticipantState: Omit<Participant, 'id' | 'createdAt'> = {
  name: '',
  gender: GENDERS[0],
  institution: '',
  region: REGIONS[0],
  contact: '',
  membershipStatus: true,
  certificateIssued: false,
  notes: '',
};

const ParticipantForm: React.FC<{
  onSubmit: (participant: Omit<Participant, 'id' | 'createdAt' >) => void;
  initialData?: Participant | null;
  onClose: () => void;
}> = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState(initialData || initialParticipantState);

  useEffect(() => {
    setFormData(initialData || initialParticipantState);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
      <FormGroup className="md:col-span-2">
        <Input type="text" label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
      </FormGroup>
       <FormGroup>
        <Input type="text" label="Contact (Phone/Email)" name="contact" value={formData.contact} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
         <Input list="institutions" label="Institution" name="institution" value={formData.institution} onChange={handleChange} required />
        <datalist id="institutions">
          {INSTITUTIONS.map(i => <option key={i} value={i} />)}
        </datalist>
      </FormGroup>
      <FormGroup>
        <Select label="Region" name="region" value={formData.region} onChange={handleChange}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </FormGroup>
      <FormGroup className="md:col-span-2">
        <Textarea label="Notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
      </FormGroup>
       <FormGroup className="flex items-center gap-4 md:col-span-2">
          <Checkbox name="membershipStatus" label="Active Member" checked={formData.membershipStatus} onChange={handleChange} />
          <Checkbox name="certificateIssued" label="Certificate Issued" checked={formData.certificateIssued} onChange={handleChange} />
      </FormGroup>
      <div className="md:col-span-2 flex justify-end space-x-2 pt-6">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Participant' : 'Create Participant'}</Button>
      </div>
    </form>
  );
};

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({ participants, addParticipant, updateParticipant, deleteParticipant, deleteMultipleParticipants, currentUserRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<UUID>>(new Set());
  const addToast = useToast();

  const canManage = useMemo(() => ['Super Admin', 'Admin'].includes(currentUserRole), [currentUserRole]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.institution.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [participants, searchTerm]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredParticipants.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: UUID) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    setEditingParticipant(null);
    setIsModalOpen(true);
  };

  const handleEditRequest = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsModalOpen(true);
  };
  
  const handleDeleteRequest = (participant: Participant) => {
    setParticipantToDelete(participant);
    setIsConfirmDeleteOpen(true);
  };

  const handleBulkDeleteRequest = () => {
    setIsConfirmBulkDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (participantToDelete) {
      deleteParticipant(participantToDelete.id);
      addToast(`Participant "${participantToDelete.name}" deleted successfully.`, 'success');
      setIsConfirmDeleteOpen(false);
      setParticipantToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    deleteMultipleParticipants(Array.from(selectedIds));
    addToast(`${selectedIds.size} participants deleted successfully.`, 'success');
    setSelectedIds(new Set());
    setIsConfirmBulkDeleteOpen(false);
  };

  const handleFormSubmit = (data: Omit<Participant, 'id' | 'createdAt'>) => {
    if (editingParticipant) {
      updateParticipant({ ...editingParticipant, ...data });
      addToast('Participant updated successfully!', 'success');
    } else {
      addParticipant(data);
      addToast('Participant created successfully!', 'success');
    }
    setIsModalOpen(false);
    setEditingParticipant(null);
  };
  
  const allVisibleSelected = filteredParticipants.length > 0 && selectedIds.size === filteredParticipants.length;
  const isIndeterminate = selectedIds.size > 0 && !allVisibleSelected;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Participants ({filteredParticipants.length})</h2>
        <div className="flex items-center gap-2">
            <input type="text" placeholder="Search by name or institution..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
            {canManage && selectedIds.size > 0 && (
                <Button variant="danger" onClick={handleBulkDeleteRequest}>Delete Selected ({selectedIds.size})</Button>
            )}
            {canManage && <Button onClick={handleAdd}>Add Participant</Button>}
        </div>
      </div>
       <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {canManage && (
                <th className="px-6 py-3">
                  <Checkbox 
                    label=""
                    checked={allVisibleSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                    disabled={filteredParticipants.length === 0}
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredParticipants.length > 0 ? filteredParticipants.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${selectedIds.has(p.id) ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                {canManage && (
                  <td className="px-6 py-4">
                     <Checkbox 
                        label=""
                        checked={selectedIds.has(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                      />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{p.contact}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.institution}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.region}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {p.membershipStatus ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canManage ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => handleEditRequest(p)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(p)}>Delete</Button>
                        </>
                    ) : (
                        <span className="text-xs text-gray-400">No actions</span>
                    )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No participants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

       <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingParticipant(null); }} title={editingParticipant ? 'Edit Participant' : 'Create New Participant'}>
        <ParticipantForm onSubmit={handleFormSubmit} initialData={editingParticipant} onClose={() => { setIsModalOpen(false); setEditingParticipant(null); }} />
      </Modal>

      <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Deletion">
        <div>
            <p>Are you sure you want to delete the participant "{participantToDelete?.name}"? This will also remove all their event registrations. This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmBulkDeleteOpen} onClose={() => setIsConfirmBulkDeleteOpen(false)} title="Confirm Bulk Deletion">
        <div>
            <p>Are you sure you want to delete the {selectedIds.size} selected participants? This will also remove all their event registrations. This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmBulkDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmBulkDelete}>Delete Selected</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
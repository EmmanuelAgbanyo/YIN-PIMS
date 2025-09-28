import React, { useState, useMemo, useEffect } from 'react';
import type { User, UserRole, UUID } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useToast } from '../hooks/useToast';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { FormGroup } from './ui/FormGroup';

interface SettingsViewProps {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: UUID) => void;
  currentUser: User;
  seedDatabase: () => Promise<boolean>;
}

const initialUserState: Omit<User, 'id' | 'createdAt'> = {
  email: '',
  password: '',
  role: 'Viewer',
};

const UserForm: React.FC<{
  onSubmit: (user: Omit<User, 'id' | 'createdAt'>) => void;
  initialData?: User | null;
  onClose: () => void;
  currentUser: User;
}> = ({ onSubmit, initialData, onClose, currentUser }) => {
  const [formData, setFormData] = useState(initialData || initialUserState);

  useEffect(() => {
    setFormData(initialData || initialUserState);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as UserRole }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
        // Simple validation
        return;
    }
    onSubmit(formData);
    onClose();
  };

  const isEditingSelf = initialData?.id === currentUser.id;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <FormGroup>
        <Input type="email" label="Email Address" name="email" value={formData.email} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Input type="password" label="Password" name="password" value={formData.password} onChange={handleChange} required placeholder={initialData ? 'Enter new password or re-enter old' : ''}/>
      </FormGroup>
      <FormGroup>
        <Select label="Role" name="role" value={formData.role} onChange={handleChange} disabled={isEditingSelf}>
          <option value="Viewer">Viewer</option>
          <option value="Organizer">Organizer</option>
          <option value="Admin">Admin</option>
          <option value="Super Admin">Super Admin</option>
        </Select>
        {isEditingSelf && <p className="text-xs text-gray-500 mt-1">You cannot change your own role.</p>}
      </FormGroup>
      <div className="flex justify-end space-x-2 pt-6">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update User' : 'Create User'}</Button>
      </div>
    </form>
  );
};


export const SettingsView: React.FC<SettingsViewProps> = ({ users, addUser, updateUser, deleteUser, currentUser, seedDatabase }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const addToast = useToast();
  
  const sortedUsers = useMemo(() => {
      return [...users].sort((a,b) => a.email.localeCompare(b.email));
  }, [users]);

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditRequest = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleDeleteRequest = (user: User) => {
    setUserToDelete(user);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      addToast(`User "${userToDelete.email}" deleted successfully.`, 'success');
      setIsConfirmDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = (data: Omit<User, 'id' | 'createdAt'>) => {
    if (editingUser) {
      updateUser({ ...editingUser, ...data });
      addToast('User updated successfully!', 'success');
    } else {
      addUser(data);
      addToast('User created successfully!', 'success');
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSeedDatabase = async () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to reset and seed the database? This will overwrite ALL existing data.'
    );
    if (isConfirmed) {
      setIsSeeding(true);
      addToast('Seeding database... This may take a moment.', 'info');
      const success = await seedDatabase();
      if (success) {
        addToast('Database seeded successfully! You may need to refresh to see all changes.', 'success');
      } else {
        addToast('Database seeding failed. Check the console for errors.', 'error');
      }
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">User Management ({users.length})</h2>
          <Button onClick={handleAdd}>Add New User</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.createdAt.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRequest(user)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(user)} disabled={user.id === currentUser.id}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold border-b pb-3 mb-4">Database Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Reset the entire database with a predefined set of sample data. This is useful for testing or starting a fresh demo.
          <br />
          <strong className="text-red-500">Warning:</strong> This is a destructive action and will permanently delete all current data.
        </p>
        <Button variant="danger" onClick={handleSeedDatabase} disabled={isSeeding}>
          {isSeeding ? 'Seeding...' : 'Seed Database with Sample Data'}
        </Button>
      </div>

       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
        <UserForm onSubmit={handleFormSubmit} initialData={editingUser} onClose={() => setIsModalOpen(false)} currentUser={currentUser}/>
      </Modal>

      <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Deletion">
        <div>
            <p>Are you sure you want to delete the user "{userToDelete?.email}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
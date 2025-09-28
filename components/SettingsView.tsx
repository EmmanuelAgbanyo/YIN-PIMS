
import React, { useState, useCallback } from 'react';
import type { User, UserRole, UUID } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { FormGroup } from './ui/FormGroup';
import { useToast } from '../hooks/useToast';
import { useAppSettings } from '../hooks/useAppSettings';

// Super Admins can only be created via seed data, not assigned.
const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Organizer', 'Viewer'];

interface UserFormProps {
  onSubmit: (formData: { email: string; password: string; role: string; }) => void;
  initialData?: User | null;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'Viewer',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as UserRole }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData && !formData.password) {
      return; // Should be caught by 'required' attribute
    }
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup>
        <Input
          type="email"
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={!!initialData}
        />
      </FormGroup>
      <FormGroup>
        <Input
          type="password"
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={initialData ? 'Leave blank to keep current' : ''}
          required={!initialData}
        />
      </FormGroup>
      <FormGroup>
        <Select label="Role" name="role" value={formData.role} onChange={handleChange}>
          {ASSIGNABLE_ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </Select>
      </FormGroup>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update User' : 'Create User'}</Button>
      </div>
    </form>
  );
};

const BrandingSettings: React.FC = () => {
    const { settings, setYinLogo } = useAppSettings();
    const addToast = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addToast('Invalid file type. Please upload a PNG, JPG, or SVG.', 'error');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            addToast('File is too large. Please upload an image under 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setYinLogo(e.target?.result as string);
            addToast('Logo updated successfully!', 'success');
        };
        reader.onerror = () => {
            addToast('Failed to read the file.', 'error');
        }
        reader.readAsDataURL(file);
    }, [setYinLogo, addToast]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0] as File);
    }, [handleFile]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
            <div className="border-b pb-2 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Branding</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your organization's logo for membership cards.</p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Logo</p>
                    <div className="h-24 w-full bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        {settings.yinLogo ? (
                            <img src={settings.yinLogo} alt="YIN Logo Preview" className="max-h-20 max-w-full object-contain" />
                        ) : (
                            <span className="text-sm text-gray-500">No Logo Set</span>
                        )}
                    </div>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()}>
                        {settings.yinLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    {settings.yinLogo && (
                        <Button variant="danger" onClick={() => setYinLogo(null)}>
                            Remove Logo
                        </Button>
                    )}
                    <p className="text-xs text-gray-500 text-center md:text-left mt-2">Recommended: PNG with transparent background, &lt; 2MB.</p>
                </div>
            </div>
        </div>
    );
};


interface SettingsViewProps {
  users: User[];
  currentUser: User;
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: UUID) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ users, currentUser, addUser, updateUser, deleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const addToast = useToast();
  
  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };
  
  const handleDeleteRequest = (user: User) => {
    setUserToDelete(user);
    setIsConfirmDeleteOpen(true);
  };
  
  const handleFormSubmit = (formData: { email: string; password: string; role: string; }) => {
    if (editingUser) {
      const updatedData: User = {
        ...editingUser,
        role: formData.role as UserRole,
        password: formData.password ? formData.password : editingUser.password,
      };
      updateUser(updatedData);
      addToast(`User ${editingUser.email} updated successfully!`, 'success');
    } else {
      addUser({
        email: formData.email,
        password: formData.password,
        role: formData.role as UserRole,
      });
      addToast(`User ${formData.email} created successfully!`, 'success');
    }
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      addToast(`User "${userToDelete.email}" deleted successfully.`, 'success');
      setIsConfirmDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Manage user accounts and their roles within the system.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    {user.id === currentUser.id ? (
                                      <span className="text-xs text-gray-400 italic">Current User (Cannot be modified)</span>
                                    ) : (
                                      <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(user)}>Delete</Button>
                                      </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
          <BrandingSettings />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
          <UserForm onSubmit={handleFormSubmit} initialData={editingUser} onClose={() => setIsModalOpen(false)} />
      </Modal>
       <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Deletion">
        <div>
            <p>Are you sure you want to delete the user "<strong>{userToDelete?.email}</strong>"? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
        </div>
      </Modal>
    </>
  );
};
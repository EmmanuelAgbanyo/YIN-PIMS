import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { FormGroup } from './ui/FormGroup';
import { useToast } from '../hooks/useToast';

interface ProfileViewProps {
  currentUser: User;
  updateUser: (user: User) => void;
  setCurrentUser: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, updateUser, setCurrentUser }) => {
  const [formData, setFormData] = useState({
    email: currentUser.email,
    password: '', // For security, we don't pre-fill the password
  });
  const addToast = useToast();

  useEffect(() => {
    // Reset form if the currentUser prop changes (e.g., after an update)
    setFormData({
      email: currentUser.email,
      password: '',
    });
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      addToast('Email cannot be empty.', 'error');
      return;
    }

    const updatedUserData: User = {
      ...currentUser,
      email: formData.email,
      // Only update the password if a new one was entered
      password: formData.password || currentUser.password,
    };

    // Update the data in Firebase via the hook
    updateUser(updatedUserData);
    
    // Update the local state in App.tsx for immediate UI feedback
    setCurrentUser(updatedUserData);
    
    addToast('Profile updated successfully!', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">View and edit your personal account details.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </FormGroup>
          <FormGroup>
            <Input
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
            />
          </FormGroup>
          <FormGroup>
            <Input
              label="User Role"
              type="text"
              name="role"
              value={currentUser.role}
              disabled // Users cannot change their own role
            />
             <p className="text-xs text-gray-500 mt-1 pl-1">Your user role is managed by a Super Admin.</p>
          </FormGroup>
          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
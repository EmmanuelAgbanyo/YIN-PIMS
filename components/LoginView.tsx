import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay for UX
    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute bg-blue-700 opacity-50 rounded-full w-96 h-96 -top-20 -left-20"></div>
        <div className="absolute bg-blue-600 opacity-40 rounded-full w-[500px] h-[500px] -bottom-40 -right-20"></div>
        <div className="z-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-4xl font-bold mb-3">YIN PIMS</h1>
            <p className="text-xl max-w-sm">Welcome to the Participant Information Management System</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8 lg:hidden">
              <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200">YIN PIMS Login</h1>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">Sign In</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        label="Email Address" 
                        type="email"
                        id="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                    <Input 
                        label="Password" 
                        type="password" 
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                    <div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </div>
                </form>
            </div>
             <p className="text-center text-sm text-gray-500 mt-6">
                © 2025 Young Investors Network. Developed by Emmanuel Agbanyo.
            </p>
          </div>
      </div>
    </div>
  );
};
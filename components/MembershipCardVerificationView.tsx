import React, { useState } from 'react';
import type { Participant } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { FormGroup } from './ui/FormGroup';

interface MembershipCardVerificationViewProps {
    participants: Participant[];
}

type VerificationStatus = 'idle' | 'verified' | 'invalid';

export const MembershipCardVerificationView: React.FC<MembershipCardVerificationViewProps> = ({ participants }) => {
    const [status, setStatus] = useState<VerificationStatus>('idle');
    const [verifiedParticipant, setVerifiedParticipant] = useState<Participant | null>(null);
    const [inputId, setInputId] = useState('');

    const participantMap = new Map(participants.map(p => [p.membershipId, p]));

    const handleVerification = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = inputId.trim();
        if (!trimmedId) return;

        const participant = participantMap.get(trimmedId);
        if (participant) {
            setVerifiedParticipant(participant);
            setStatus('verified');
        } else {
            setStatus('invalid');
        }
    };

    const reset = () => {
        setStatus('idle');
        setVerifiedParticipant(null);
        setInputId('');
    };

    const renderIdleView = () => (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <IDCardIcon className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Member Verification</h2>
            <p className="mt-2 text-sm text-gray-500 max-w-sm">Enter the member's unique ID from their card to verify their status.</p>
            <form onSubmit={handleVerification} className="w-full max-w-sm mt-6">
                <FormGroup>
                    <Input 
                        label="Membership ID" 
                        value={inputId} 
                        onChange={(e) => setInputId(e.target.value)} 
                        placeholder="e.g., YIN-2024-0001"
                        required 
                        autoFocus
                    />
                </FormGroup>
                <Button type="submit" className="w-full !mt-4" disabled={!inputId}>
                    <SearchIcon /> Verify Member
                </Button>
            </form>
        </div>
    );

    const renderResultView = () => {
        const isVerified = status === 'verified' && verifiedParticipant;
        const isInvalid = status === 'invalid';

        return (
            <div className="p-6 flex flex-col items-center justify-center text-center h-full">
                {isVerified && (
                    <>
                        <CheckCircleIcon className="w-24 h-24 text-green-500" />
                        <h2 className="text-3xl font-bold mt-4 text-gray-800 dark:text-gray-100">Member Verified</h2>
                        
                        <div className="mt-6 w-full max-w-sm bg-gray-100 dark:bg-gray-700/50 p-6 rounded-lg text-left space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
                                    {verifiedParticipant.photoUrl ? (
                                        <img src={verifiedParticipant.photoUrl} alt={verifiedParticipant.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                                    <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{verifiedParticipant.name}</p>
                                </div>
                            </div>
                            <div>
                               <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Member ID</p>
                               <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono">{verifiedParticipant.membershipId}</p>
                            </div>
                            <div>
                               <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</p>
                               <p className={`font-semibold text-lg ${verifiedParticipant.membershipStatus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                   {verifiedParticipant.membershipStatus ? 'Active' : 'Inactive'}
                               </p>
                           </div>
                        </div>
                    </>
                )}

                {isInvalid && (
                    <>
                        <XCircleIcon className="w-24 h-24 text-red-500" />
                        <h2 className="text-3xl font-bold mt-4 text-gray-800 dark:text-gray-100">Invalid Member ID</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">This ID does not correspond to a valid member. Please check the ID and try again.</p>
                    </>
                )}

                <Button onClick={reset} className="!mt-8 shadow-lg">Verify Another ID</Button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">Membership Verification</h1>
            <div className="relative w-full min-h-[24rem] sm:aspect-square bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
                {status === 'idle' && renderIdleView()}
                {(status === 'verified' || status === 'invalid') && renderResultView()}
            </div>
        </div>
    );
};

// Icons
const IDCardIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm.375 0a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CheckCircleIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon = (props: {className?: string}) => (<svg xmlns="http://www.w3.org/2000/svg" className={props.className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);
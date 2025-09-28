
import React from 'react';
import type { Participant } from '../../types';

interface MembershipCardProps {
    participant: Participant;
    yinLogo: string | null;
}

const UserIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);


export const MembershipCard: React.FC<MembershipCardProps> = ({ participant, yinLogo }) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(participant.membershipId)}&bgcolor=F1F5F9`;

    return (
        <div className="w-[3.375in] h-[2.125in] bg-[#0F172A] text-white shadow-lg rounded-xl flex flex-col p-4 font-sans relative overflow-hidden print:shadow-none">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-tr from-blue-900/50 to-purple-900/50 rounded-full -translate-y-1/3 translate-x-1/4 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-800/50 to-transparent rounded-full translate-y-1/4 -translate-x-1/4 opacity-30"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between">
                    {yinLogo ? (
                        <img src={yinLogo} alt="YIN Logo" className="h-8 max-w-[100px] object-contain" />
                    ) : (
                        <span className="text-2xl font-bold">YIN</span>
                    )}
                    <div className="text-right">
                        <h1 className="text-xs font-bold uppercase tracking-wider text-gray-300">Membership Card</h1>
                        <p className="text-[10px] text-gray-400">Young Investors Network</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex items-center pt-2 gap-4">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-600">
                        {participant.photoUrl ? (
                             <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <UserIcon className="w-16 h-16 text-gray-500" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
                        <p className="text-lg font-bold leading-tight -mt-1 truncate">{participant.name}</p>
                        
                        <p className="text-xs text-gray-400 uppercase tracking-wide mt-2">Member ID</p>
                        <p className="text-sm font-mono leading-tight bg-gray-800/50 px-2 py-1 rounded-md inline-block">
                            {participant.membershipId}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between -mb-1">
                    <div className="text-left">
                       <p className="text-[10px] text-gray-400 uppercase tracking-wide">Institution</p>
                       <p className="text-xs font-semibold -mt-1">{participant.institution}</p>
                    </div>
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-200 p-1 rounded-md">
                        <img src={qrCodeUrl} alt="Membership QR Code" className="w-full h-full object-contain rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
};
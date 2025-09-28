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

const formatMembershipId = (id: string): string => {
    if (!id || typeof id !== 'string') {
        return 'YIN 0000 0000'; // Provide a safe fallback
    }
    const parts = id.split('-');
    if (parts.length === 3) {
        // Assuming format YIN-YYYY-NNNN
        return `${parts[0]} ${parts[1]} ${parts[2].padStart(4, '0')}`;
    }
    // Fallback for other formats
    return id.replace(/-/g, ' ');
};

export const MembershipCard: React.FC<MembershipCardProps> = ({ participant, yinLogo }) => {
    
    const getNameSizeClass = (name: string): string => {
        const len = name.length;
        if (len > 30) {
            return 'text-base leading-tight';
        }
        if (len > 22) {
            return 'text-lg';
        }
        return 'text-xl';
    };
    
    const nameSizeClass = getNameSizeClass(participant.name);

    return (
        <div className="w-[3.375in] h-[2.125in] bg-[#0f172a] text-white shadow-2xl rounded-xl flex flex-col p-4 font-sans relative overflow-hidden print:shadow-none">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff11_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-purple-900/30"></div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="flex items-center justify-between">
                    {yinLogo ? (
                        <img src={yinLogo} alt="YIN Logo" className="h-8 max-w-[100px] object-contain" />
                    ) : (
                        <span className="text-2xl font-bold tracking-tighter">YIN</span>
                    )}
                    <h1 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/80">Member</h1>
                </header>

                {/* Body */}
                <main className="flex-1 flex items-center gap-4 pt-2">
                    {/* Photo on the left */}
                    <div className="w-24 h-32 flex-shrink-0 bg-slate-700/50 rounded-lg flex items-center justify-center p-0.5 border border-white/10">
                        {participant.photoUrl ? (
                             <img src={participant.photoUrl} alt={participant.name} className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <UserIcon className="w-16 h-16 text-slate-500" />
                        )}
                    </div>
                    {/* Details on the right */}
                    <div className="flex flex-col justify-center">
                         <p className={`${nameSizeClass} font-semibold uppercase break-words leading-tight`} title={participant.name}>{participant.name}</p>
                        
                        <div className="mt-4">
                            <p className="font-mono text-xl tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                               {formatMembershipId(participant.membershipId)}
                            </p>
                            <div className="flex items-baseline gap-4 mt-1">
                                <p className="text-[10px] text-blue-200/70">MEMBER SINCE</p>
                                <p className="font-mono text-sm">{participant.createdAt.getFullYear()}</p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex items-end justify-between mt-auto">
                    <p className="text-[7px] text-blue-200/50 max-w-[70%]">
                        This card is non-transferable and remains the property of the Young Investors Network. If found, contact info@yinvestors.org.
                    </p>
                </footer>
            </div>
        </div>
    );
};
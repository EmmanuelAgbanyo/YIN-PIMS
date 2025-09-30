
import React, { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useToast } from '../hooks/useToast';
import type { Club, Participant, ClubMembership, User, UUID } from '../types';
import { exportToCsv } from '../utils/csv';
import { ImportMembersModal } from './ImportMembersModal';
import { AddMemberModal } from './AddMemberModal';

type ClubDetailPanelProps = {
  club: Club;
  participants: Participant[];
  clubMemberships: ClubMembership[];
  addParticipant: (participant: Omit<Participant, 'id' | 'createdAt' | 'membershipId'>, clubId?: UUID) => Promise<Participant>;
  addClubMembership: (participantId: UUID, clubId: UUID) => Promise<boolean>;
  deleteClubMembership: (participantId: UUID, clubId: UUID) => void;
  deleteClub: (clubId: UUID) => void;
  onEdit: (club: Club) => void;
  currentUser: User;
};

export const ClubDetailPanel: React.FC<ClubDetailPanelProps> = (props) => {
  const { club, participants, clubMemberships, deleteClubMembership, deleteClub, onEdit, currentUser } = props;
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const addToast = useToast();

  const canManageClubDetails = useMemo(() => ['Super Admin', 'Admin', 'Organizer'].includes(currentUser.role), [currentUser.role]);
  
  const canManageClubMembers = useMemo(() => {
    if (['Super Admin', 'Admin', 'Organizer'].includes(currentUser.role)) {
        return true;
    }
    if (currentUser.role === 'Club Executive' && currentUser.assignedClubId === club.id) {
        return true;
    }
    return false;
  }, [currentUser, club.id]);

  const members = useMemo(() => {
    const memberMap = new Map(clubMemberships
        .filter(cm => cm.clubId === club.id)
        .map(cm => [cm.participantId, cm.joinDate])
    );
    return participants
      .filter(p => memberMap.has(p.id))
      .map(p => ({ ...p, joinDate: memberMap.get(p.id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubMemberships, participants, club.id]);
  
  const handleRemoveMember = async (participantId: UUID, participantName: string) => {
      await deleteClubMembership(participantId, club.id);
      addToast(`${participantName} removed from the club.`, 'success');
  };
  
  const confirmDeleteClub = async () => {
    await deleteClub(club.id);
    addToast(`Club "${club.name}" and all its memberships have been deleted.`, 'success');
    setIsConfirmDeleteOpen(false);
  };

  const handleExport = () => {
    if (members.length === 0) {
        addToast('This club has no members to export.', 'info');
        return;
    }
    const dataToExport = members.map(member => ({
        'Name': member.name,
        'Contact': member.contact,
        'Gender': member.gender,
        'Region': member.region,
        'MembershipStatus': member.membershipStatus ? 'Active' : 'Inactive',
        'JoinDate': member.joinDate ? member.joinDate.toLocaleDateString() : 'N/A',
        'EngagementScore': member.engagementScore || 0,
    }));
    
    const filename = `YIN-Club-Members_${club.name.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename, dataToExport);
    addToast(`Exported ${members.length} members from ${club.name}.`, 'success');
  }

  return (
    <>
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                <h2 className="text-2xl font-bold">{club.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{club.institution}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-lg">{club.description}</p>
            </div>
             <div className="flex flex-col items-end gap-2 flex-shrink-0">
                 <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 uppercase">Total Members</p>
                    <p className="text-3xl font-bold">{members.length}</p>
                </div>
                {canManageClubDetails && (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onEdit(club)}>Edit</Button>
                        <Button variant="danger" onClick={() => setIsConfirmDeleteOpen(true)}>Delete</Button>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold">Members ({members.length})</h3>
            {canManageClubMembers && (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleExport}><DownloadIcon /> Export Members</Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsImportModalOpen(true)}><UploadIcon /> Import Members</Button>
                    <Button onClick={() => setIsAddMemberModalOpen(true)}>Add Members</Button>
                </div>
            )}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[50vh]">
            {members.length > 0 ? members.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <div>
                       <p className="font-medium text-sm">{p.name}</p>
                       <p className="text-xs text-gray-500">{p.contact}</p>
                    </div>
                    {canManageClubMembers && <Button variant="danger" size="sm" onClick={() => handleRemoveMember(p.id, p.name)}>Remove</Button>}
                </div>
            )) : <p className="text-center text-sm text-gray-500 pt-8">This club has no members yet.</p>}
        </div>
      </div>

      {canManageClubMembers && isAddMemberModalOpen && (
        <AddMemberModal 
            isOpen={isAddMemberModalOpen} 
            onClose={() => setIsAddMemberModalOpen(false)}
            club={club}
            currentMemberIds={new Set(members.map(m => m.id))}
            {...props}
        />
      )}

       {canManageClubMembers && isImportModalOpen && (
        <ImportMembersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          club={club}
          participants={props.participants}
          clubMemberships={props.clubMemberships}
          addParticipant={props.addParticipant}
          addClubMembership={props.addClubMembership}
        />
      )}

       <Modal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} title="Confirm Club Deletion">
        <div>
            <p>Are you sure you want to delete the club "<strong>{club.name}</strong>"? This will remove all associated member records. This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDeleteClub}>Delete</Button>
            </div>
        </div>
      </Modal>
    </>
  );
};


const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0L8 8m4-4v12" /></svg>;
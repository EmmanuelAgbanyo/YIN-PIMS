
import React from 'react';
import type { Participant } from '../../types';
import { Checkbox } from './Checkbox';

interface AttendeeSelectionListProps {
  attendees: Participant[];
  selectedAttendeeIds: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
}

export const AttendeeSelectionList: React.FC<AttendeeSelectionListProps> = ({
  attendees,
  selectedAttendeeIds,
  onSelectionChange,
}) => {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(new Set(attendees.map(a => a.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (participantId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedAttendeeIds);
    if (isSelected) {
      newSelection.add(participantId);
    } else {
      newSelection.delete(participantId);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = attendees.length > 0 && selectedAttendeeIds.size === attendees.length;

  return (
    <div className="border rounded-md dark:border-gray-700 max-h-80 overflow-y-auto">
      <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sticky top-0 backdrop-blur-sm">
        <Checkbox
          label={`Select All (${attendees.length})`}
          checked={allSelected}
          onChange={handleSelectAll}
          disabled={attendees.length === 0}
        />
      </div>
      <div className="p-2 space-y-1">
        {attendees.length > 0 ? (
          attendees.map(attendee => (
            <div key={attendee.id} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <Checkbox
                label={attendee.name}
                checked={selectedAttendeeIds.has(attendee.id)}
                onChange={e => handleSelectOne(attendee.id, e.target.checked)}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-gray-500 py-4">No attendees for this event.</p>
        )}
      </div>
    </div>
  );
};

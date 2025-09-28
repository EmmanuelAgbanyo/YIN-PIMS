import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { usePIMSData } from '../hooks/usePIMSData';
import type { Participant, Event, UUID } from '../types';
import { Button } from './ui/Button';
import { Certificate } from './ui/Certificate';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { FormGroup } from './ui/FormGroup';
import { AttendeeSelectionList } from './ui/AttendeeSelectionList';
import { useToast } from '../hooks/useToast';
import { LogoUploader } from './ui/LogoUploader';

type CertificatesViewProps = ReturnType<typeof usePIMSData>;
type Orientation = 'landscape' | 'portrait';

const defaultCertificateBodyTemplate = `has successfully completed the <strong>{eventName}</strong>. This certificate recognizes their active participation and commitment to enhancing their financial literacy.`;

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  participants,
  events,
  participations,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<UUID>(events[0]?.id || '');
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<UUID>>(new Set());
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const addToast = useToast();
  
  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);

  // Certificate content state
  const [certificateTitle, setCertificateTitle] = useState('Certificate of Participation');
  const [certificateBody, setCertificateBody] = useState(
      defaultCertificateBodyTemplate.replace('{eventName}', selectedEvent?.title || '')
  );
  const [signatoryName, setSignatoryName] = useState('John Appiah');
  const [signatoryTitle, setSignatoryTitle] = useState('President, Young Investors Network');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
      if (selectedEvent) {
          setCertificateBody(defaultCertificateBodyTemplate.replace('{eventName}', selectedEvent.title));
      }
  }, [selectedEvent]);

  const attendees = useMemo(() => {
    if (!selectedEventId) return [];
    const attendeeIds = new Set(
      participations.filter(p => p.eventId === selectedEventId).map(p => p.participantId)
    );
    return participants
      .filter(p => attendeeIds.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedEventId, participations, participants]);

  const previewParticipant = useMemo(() => {
    if (attendees.length > 0) {
      const firstSelectedId = selectedAttendeeIds.values().next().value;
      return participants.find(p => p.id === firstSelectedId) || attendees[0];
    }
    return null;
  }, [attendees, selectedAttendeeIds, participants]);
  
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEventId(e.target.value);
    setSelectedAttendeeIds(new Set()); // Reset selection when event changes
  };
  
  const handlePrint = () => {
    if (selectedAttendeeIds.size === 0) {
      addToast('Please select at least one participant to generate certificates for.', 'error');
      return;
    }
    
    const participantsToPrint = participants.filter(p => selectedAttendeeIds.has(p.id));
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Could not open print window. Please check your popup blocker.', 'error');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Certificates</title>
          <style>
            /* Cinzel font from Google Fonts */
            @font-face {
              font-family: 'Cinzel';
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              src: url(https://fonts.gstatic.com/s/cinzel/v20/8vIK7ww63mVu7gt74-yr0Q.woff2) format('woff2');
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 ${orientation};
              margin: 0;
            }
            body {
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .certificate-page {
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              page-break-after: always;
              box-sizing: border-box;
            }
             .certificate-page:last-child {
                page-break-after: auto;
            }
          </style>
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const PrintLayout = () => (
        <>
            {participantsToPrint.map(participant => (
                <div className="certificate-page" key={participant.id}>
                    <Certificate
                        participantName={participant.name}
                        eventName={selectedEvent?.title || ''}
                        eventDate={selectedEvent?.date || new Date()}
                        certificateTitle={certificateTitle}
                        certificateBody={certificateBody}
                        signatoryName={signatoryName}
                        signatoryTitle={signatoryTitle}
                        logoUrl={logoUrl}
                    />
                </div>
            ))}
        </>
    );

    setTimeout(() => {
        const printRootEl = printWindow.document.getElementById('print-root');
        if (printRootEl) {
            const root = ReactDOM.createRoot(printRootEl);
            root.render(<PrintLayout />);
        }
        
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            } catch (e) {
                console.error("Printing failed", e);
                addToast("Printing failed. The print dialog was likely closed.", "error");
                 if (!printWindow.closed) {
                    printWindow.close();
                }
            }
        }, 500);
    }, 100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[calc(100vh-120px)]">
      {/* Left Panel: Configuration */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col gap-4 overflow-y-auto">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Select Event</h2>
          <Select label="Event" value={selectedEventId} onChange={handleEventChange}>
             {events.sort((a,b) => b.date.getTime() - a.date.getTime()).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
        </div>
        <div>
            <h2 className="text-xl font-semibold mb-2">2. Select Participants ({selectedAttendeeIds.size} selected)</h2>
            <AttendeeSelectionList 
                attendees={attendees}
                selectedAttendeeIds={selectedAttendeeIds}
                onSelectionChange={setSelectedAttendeeIds}
            />
        </div>
         <div>
          <h2 className="text-xl font-semibold mb-2">3. Customize Certificate</h2>
            <FormGroup>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Orientation</label>
                    <div className="flex rounded-md shadow-sm" role="group">
                        <button type="button" onClick={() => setOrientation('landscape')} className={`px-3 py-1 text-sm font-medium rounded-l-lg border ${orientation === 'landscape' ? 'bg-primary text-white border-primary z-10 ring-2 ring-blue-300' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                            Landscape
                        </button>
                        <button type="button" onClick={() => setOrientation('portrait')} className={`px-3 py-1 text-sm font-medium rounded-r-lg border-t border-b border-r ${orientation === 'portrait' ? 'bg-primary text-white border-primary z-10 ring-2 ring-blue-300' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                            Portrait
                        </button>
                    </div>
                </div>
            </FormGroup>
            <FormGroup>
                <LogoUploader logoUrl={logoUrl} onLogoChange={setLogoUrl} />
            </FormGroup>
            <FormGroup>
                <Input label="Certificate Title" value={certificateTitle} onChange={(e) => setCertificateTitle(e.target.value)} />
            </FormGroup>
             <FormGroup>
                <Textarea label="Certificate Body" value={certificateBody} onChange={(e) => setCertificateBody(e.target.value)} rows={6} />
            </FormGroup>
            <FormGroup>
                <Input label="Signatory Name" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
            </FormGroup>
            <FormGroup>
                <Input label="Signatory Title" value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} />
            </FormGroup>
        </div>
        <div>
            <Button className="w-full" onClick={handlePrint} disabled={selectedAttendeeIds.size === 0}>
                Generate & Print ({selectedAttendeeIds.size})
            </Button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className="lg:col-span-2 bg-gray-200 dark:bg-gray-900 p-4 rounded-lg shadow-md flex flex-col justify-center items-center overflow-hidden">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Live Preview</h2>
        <div className={`w-full max-w-4xl bg-white shadow-lg transition-all duration-300 ${orientation === 'landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'}`}>
           {previewParticipant && selectedEvent ? (
             <Certificate
                participantName={previewParticipant.name}
                eventName={selectedEvent.title}
                eventDate={selectedEvent.date}
                certificateTitle={certificateTitle}
                certificateBody={certificateBody}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
                logoUrl={logoUrl}
             />
           ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
                <p>Select an event and participant to see a preview.</p>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};
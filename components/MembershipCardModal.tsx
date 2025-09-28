import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import type { Participant } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { MembershipCard } from './ui/MembershipCard';
import { useToast } from '../hooks/useToast';
import { useAppSettings } from '../hooks/useAppSettings';

interface MembershipCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    participant: Participant;
}

export const MembershipCardModal: React.FC<MembershipCardModalProps> = ({ isOpen, onClose, participant }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const addToast = useToast();
    const { settings } = useAppSettings();

    const handlePrint = async () => {
        if (!cardRef.current) {
            addToast('Card element not found for printing.', 'error');
            return;
        }

        try {
            addToast('Generating high-quality card for printing...', 'info');
            
            const dataUrl = await toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 4, // Produces a high-resolution image suitable for printing
                canvasWidth: 1013, // 3.375 inches * 300 DPI
                canvasHeight: 638,  // 2.125 inches * 300 DPI
                backgroundColor: '#0F172A', // Match card background
            });

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                addToast('Could not open print window. Please check your popup blocker.', 'error');
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Membership Card - ${participant.name}</title>
                        <style>
                            @page {
                                size: 3.375in 2.125in;
                                margin: 0;
                            }
                            html, body {
                                width: 3.375in;
                                height: 2.125in;
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            img {
                                width: 100%;
                                height: 100%;
                                display: block;
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" />
                    </body>
                </html>
            `);
            printWindow.document.close();

            setTimeout(() => {
                try {
                    printWindow.focus();
                    printWindow.print();
                } catch (e) {
                    console.error("Printing failed", e);
                    addToast("Printing was cancelled or failed.", "error");
                } finally {
                    if (!printWindow.closed) {
                        printWindow.close();
                    }
                }
            }, 500);

        } catch (error) {
            console.error('Error generating card image:', error);
            addToast('Failed to generate card for printing. Please try again.', 'error');
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Membership Card for ${participant.name}`}>
            <div className="flex flex-col items-center gap-6">
                <div className="transform scale-125">
                     <div ref={cardRef}>
                        <MembershipCard participant={participant} yinLogo={settings.yinLogo} />
                    </div>
                </div>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    You can print this card or save it as a PDF. The QR code can be scanned to verify membership.
                </p>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrint}>Print Card</Button>
                </div>
            </div>
        </Modal>
    );
};
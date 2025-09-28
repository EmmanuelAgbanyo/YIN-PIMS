import React, { useRef, useState } from 'react';
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

const generateCardImage = (element: HTMLElement) => {
    // Standard credit card size: 3.375 x 2.125 inches
    // At 300 DPI, this is 1012.5 x 637.5 pixels
    return toPng(element, {
        quality: 1.0,
        pixelRatio: 3, // DPI scaling factor. 3 for ~300 DPI on a 96 DPI screen.
        width: 337, // Base width (3.375 * 100)
        height: 212, // Base height (2.125 * 100)
        style: {
             width: '337px',
             height: '212px'
        }
    });
};

export const MembershipCardModal: React.FC<MembershipCardModalProps> = ({ isOpen, onClose, participant }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const addToast = useToast();
    const { settings } = useAppSettings();

    const handlePrint = async () => {
        if (!cardRef.current || isProcessing) return;
        
        setIsProcessing(true);
        addToast('Generating high-quality card for printing...', 'info');
        
        try {
            const dataUrl = await generateCardImage(cardRef.current);
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                addToast('Could not open print window. Please check your popup blocker.', 'error');
                setIsProcessing(false);
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Membership Card - ${participant.name}</title>
                        <style>
                            @page { size: 3.375in 2.125in; margin: 0; }
                            html, body { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #fff; }
                            img { width: 100%; height: 100%; display: block; }
                        </style>
                    </head>
                    <body><img src="${dataUrl}" /></body>
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
            addToast('Failed to generate card. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!cardRef.current || isProcessing) return;
        
        setIsProcessing(true);
        addToast('Generating high-quality card for download...', 'info');

        try {
            const dataUrl = await generateCardImage(cardRef.current);
            const link = document.createElement('a');
            link.download = `YIN-Membership-Card-${participant.name.replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating card image for download:', error);
            addToast('Failed to generate card for download. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Membership Card for ${participant.name}`}>
            <div className="flex flex-col items-center gap-6">
                <div className="transform scale-[1.15] origin-center">
                     <div ref={cardRef} className="w-[3.375in] h-[2.125in]">
                        <MembershipCard participant={participant} yinLogo={settings.yinLogo} />
                    </div>
                </div>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 max-w-md pt-4">
                    This is a digital preview of the member's official card. You can generate a high-resolution version for printing or download a digital copy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Close</Button>
                    <Button onClick={handleDownload} isLoading={isProcessing}>
                        <DownloadIcon /> Download PNG
                    </Button>
                    <Button onClick={handlePrint} isLoading={isProcessing}>
                        <PrintIcon /> Print Card
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
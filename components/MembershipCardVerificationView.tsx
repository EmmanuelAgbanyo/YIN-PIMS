import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import type { Participant } from '../types';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';

interface MembershipCardVerificationViewProps {
    participants: Participant[];
}

type VerificationStatus = 'idle' | 'scanning' | 'verified' | 'invalid';

export const MembershipCardVerificationView: React.FC<MembershipCardVerificationViewProps> = ({ participants }) => {
    const [status, setStatus] = useState<VerificationStatus>('idle');
    const [verifiedParticipant, setVerifiedParticipant] = useState<Participant | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number>();
    const addToast = useToast();

    const participantMap = new Map(participants.map(p => [p.membershipId, p]));

    const stopScan = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const tick = useCallback(() => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (canvas && video) {
                const ctx = canvas.getContext('2d');
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                if (imageData) {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code) {
                        const participant = participantMap.get(code.data);
                        if (participant) {
                            setVerifiedParticipant(participant);
                            setStatus('verified');
                        } else {
                            setStatus('invalid');
                        }
                        stopScan();
                        return;
                    }
                }
            }
        }
        animationFrameRef.current = requestAnimationFrame(tick);
    }, [participantMap, stopScan]);

    const startScan = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
                videoRef.current.play();
                setStatus('scanning');
                animationFrameRef.current = requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            addToast('Camera access is required to scan QR codes.', 'error');
            setStatus('idle');
        }
    }, [addToast, tick]);

    useEffect(() => {
        return () => stopScan();
    }, [stopScan]);

    const reset = () => {
        setStatus('idle');
        setVerifiedParticipant(null);
        stopScan();
    };

    const renderIdleView = () => (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <CameraIcon className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Ready to Scan</h2>
            <p className="mt-2 text-sm text-gray-500">Position a member's QR code in front of the camera to verify their status.</p>
            <Button onClick={startScan} className="!mt-6">
                <QRIcon /> Start Camera Scan
            </Button>
        </div>
    );

    const renderScanningView = () => (
        <>
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="w-full h-full max-w-[250px] max-h-[250px] relative">
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg opacity-80"></div>
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg opacity-80"></div>
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg opacity-80"></div>
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg opacity-80"></div>
                    <div
                        className="absolute left-0 right-0 h-1 bg-red-500/80 shadow-[0_0_10px_red]"
                        style={{ animation: 'scan 2s linear infinite' }}
                    ></div>
                </div>
            </div>
            <p className="absolute bottom-4 left-4 right-4 text-center text-white text-sm bg-black/50 p-2 rounded-md">
                Align QR code within the frame
            </p>
        </>
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
                        <p className="mt-2 text-gray-600 dark:text-gray-400">This QR code does not correspond to a valid member. Please try again with a valid membership card.</p>
                    </>
                )}

                <Button onClick={reset} className="!mt-8 shadow-lg">Scan Another Card</Button>
            </div>
        );
    };


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-center">Membership Card Verification</h1>
            <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
                <canvas ref={canvasRef} className="hidden" />
                {status === 'idle' && renderIdleView()}
                {status === 'scanning' && renderScanningView()}
                {(status === 'verified' || status === 'invalid') && renderResultView()}
            </div>
        </div>
    );
};

// Icons
const QRIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6.5 6.5v-2.5m-2.5 2.5h-1.5a1 1 0 01-1-1v-1.5m-2.5 5.5v-1.5a1 1 0 011-1h1.5m5.5 2.5h1.5a1 1 0 001-1v-1.5m2.5-5.5h-1.5a1 1 0 00-1 1v1.5m-5.5-2.5h-1.5a1 1 0 00-1 1v1.5m-2.5-5.5h1.5a1 1 0 011 1v1.5M4 12h1m11-6.5h2.5m-2.5 2.5v-1.5a1 1 0 011-1h1.5m-5.5-2.5h1.5a1 1 0 011 1v1.5m-5.5 2.5v1.5a1 1 0 001 1h1.5" /></svg>;
const CheckCircleIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CameraIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" /></svg>;
const UserIcon = (props: {className?: string}) => (<svg xmlns="http://www.w3.org/2000/svg" className={props.className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);

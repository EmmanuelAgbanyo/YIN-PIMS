import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useToast } from '../hooks/useToast';

interface PhotoCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoCaptured: (dataUrl: string) => void;
}

type Mode = 'capture' | 'upload';
type CaptureState = 'idle' | 'starting' | 'live' | 'countdown' | 'preview';

const PHOTO_DIMENSION = 480;

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({ isOpen, onClose, onPhotoCaptured }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mode, setMode] = useState<Mode>('capture');
    const [captureState, setCaptureState] = useState<CaptureState>('idle');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [capturedImage, setCapturedImage] = useState<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Cropping state
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const isDraggingImage = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    const addToast = useToast();

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);
    
    const resetState = useCallback(() => {
        stopCamera();
        setCaptureState('idle');
        setCountdown(null);
        setCapturedImage(null);
        setScale(1);
        setOffset({ x: 0, y: 0 });
        if(fileInputRef.current) fileInputRef.current.value = "";
    }, [stopCamera]);

    const startCamera = useCallback(async () => {
        resetState();
        setCaptureState('starting');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: PHOTO_DIMENSION, height: PHOTO_DIMENSION, facingMode: 'user' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onplaying = () => {
                  setCaptureState('live');
                };
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            addToast("Could not access camera. Please check permissions.", "error");
            setMode('upload');
            setCaptureState('idle');
        }
    }, [addToast, resetState]);

    useEffect(() => {
        if (isOpen) {
             if (mode === 'capture') {
                startCamera();
            }
        } else {
            resetState();
        }
    }, [isOpen, mode, startCamera, resetState]);
    
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    const handleCountdown = () => {
        setCaptureState('countdown');
        let count = 3;
        setCountdown(count);
        const interval = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count === 0) {
                clearInterval(interval);
                handleCapture();
            }
        }, 1000);
    };

    const handleCapture = () => {
        if (videoRef.current) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoRef.current.videoWidth;
            tempCanvas.height = videoRef.current.videoHeight;
            const context = tempCanvas.getContext('2d');
            if (context) {
                context.translate(tempCanvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                
                const img = new Image();
                img.onload = () => {
                    setCapturedImage(img);
                    setCaptureState('preview');
                    stopCamera();
                };
                img.src = tempCanvas.toDataURL('image/jpeg');
            }
        }
    };
    
    const processFile = (file: File | null) => {
        if (file) {
            if (!file.type.startsWith('image/')) {
                addToast('Please select an image file.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setCapturedImage(img);
                    setCaptureState('preview');
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0] || null);
    };
    
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        processFile(event.dataTransfer.files?.[0] || null);
    };
    
    // Redraw canvas on crop changes
    useEffect(() => {
        if (captureState === 'preview' && capturedImage && previewCanvasRef.current) {
            const canvas = previewCanvasRef.current;
            const ctx = canvas.getContext('2d')!;
            
            canvas.width = PHOTO_DIMENSION;
            canvas.height = PHOTO_DIMENSION;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
            ctx.clip();
            
            const scaledWidth = capturedImage.width * scale;
            const scaledHeight = capturedImage.height * scale;
            
            ctx.drawImage(capturedImage, offset.x, offset.y, scaledWidth, scaledHeight);
            
            ctx.restore();
        }
    }, [capturedImage, scale, offset, captureState]);

    const handleSaveCropped = () => {
        if (previewCanvasRef.current) {
            const dataUrl = previewCanvasRef.current.toDataURL('image/jpeg', 0.9);
            onPhotoCaptured(dataUrl);
            handleClose();
        }
    };
    
    const handleClose = () => {
        resetState();
        onClose();
    }
    
    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingImage.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingImage.current) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    };
    const handleMouseUp = () => isDraggingImage.current = false;
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = scale - e.deltaY * 0.001;
        setScale(Math.min(Math.max(0.5, newScale), 5)); // Clamp scale
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Participant Photo">
            <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-sm aspect-square bg-black rounded-full overflow-hidden flex items-center justify-center relative">
                    {captureState === 'starting' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <p className="text-white/80 text-sm">Starting Camera...</p>
                        </div>
                    )}

                    {mode === 'capture' && (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className={`w-full h-full object-cover transition-opacity duration-500 transform -scale-x-100 ${captureState === 'live' || captureState === 'countdown' ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {(captureState === 'live' || captureState === 'countdown') && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 text-white/20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2">
                                        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
                                        <path d="M12 14c-2.76 0-5 2.24-5 5v2h10v-2c0-2.76-2.24-5-5-5Z" />
                                    </svg>
                                </div>
                            )}
                            {captureState === 'countdown' && countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="text-white text-9xl font-bold" style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                                        {countdown > 0 ? countdown : ''}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    {captureState === 'preview' && (
                        <canvas 
                            ref={previewCanvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            className="cursor-move"
                        />
                    )}

                    {mode === 'upload' && captureState !== 'preview' && (
                         <div
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full h-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : ''}`}
                        >
                            <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <p className="mt-2">Drag & drop an image</p>
                                <p className="text-xs text-gray-500">or click to select a file</p>
                            </div>
                        </div>
                    )}

                     {captureState === 'preview' && (
                        <p className="absolute bottom-2 text-white/80 bg-black/50 px-2 py-1 rounded-md text-xs">Scroll to zoom, drag to pan</p>
                    )}
                </div>
                 <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                
                <div className="flex gap-4 items-center h-10">
                    {captureState === 'live' && <Button onClick={handleCountdown} disabled={!stream}>Capture Photo</Button>}
                    
                    {captureState === 'preview' && (
                        <>
                            <Button variant="ghost" onClick={() => (mode === 'capture' ? startCamera() : setCaptureState('idle'))}>
                                {mode === 'capture' ? 'Take Again' : 'Choose Another'}
                            </Button>
                            <Button onClick={handleSaveCropped}>Save Photo</Button>
                        </>
                    )}

                    {(captureState === 'idle' || captureState === 'live' || captureState === 'starting') && (
                        <button onClick={() => setMode(mode === 'capture' ? 'upload' : 'capture')} className="text-sm text-primary hover:underline">
                            {mode === 'capture' ? 'Or Upload File' : 'Or Use Camera'}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
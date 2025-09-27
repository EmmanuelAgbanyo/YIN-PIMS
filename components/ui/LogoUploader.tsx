
import React, { useState, useCallback } from 'react';
import { useToast } from '../../hooks/useToast';

interface LogoUploaderProps {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ logoUrl, onLogoChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const addToast = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Invalid file type. Please upload a PNG, JPG, or SVG.', 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      addToast('File is too large. Please upload an image under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onLogoChange(e.target?.result as string);
    };
    reader.onerror = () => {
        addToast('Failed to read the file.', 'error');
    }
    reader.readAsDataURL(file);
  }, [onLogoChange, addToast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] as File);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0] as File);
  }, [handleFile]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveLogo = () => {
    onLogoChange(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const dropzoneBaseClasses = "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out";
  const dropzoneStateClasses = isDragging ? "border-primary bg-blue-50 dark:bg-blue-900/50" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50";

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/svg+xml"
        className="hidden"
      />
      {logoUrl ? (
        <div className="relative w-full p-2 border rounded-lg dark:border-gray-600 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Logo Preview</p>
            <img src={logoUrl} alt="Logo Preview" className="max-h-24 mx-auto object-contain" />
            <button 
                onClick={handleRemoveLogo}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 leading-none hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="Remove logo"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`${dropzoneBaseClasses} ${dropzoneStateClasses}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG (max 2MB)</p>
          </div>
        </div>
      )}
    </div>
  );
};

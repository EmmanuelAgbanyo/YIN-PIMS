import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;
  const hasValue = props.value != null && props.value !== '';

  return (
    <div className="relative">
      <input
        id={inputId}
        className={`
          block px-3 pb-2 pt-4 w-full text-sm text-gray-900 dark:text-white bg-transparent 
          rounded-md border border-gray-300 dark:border-gray-600 
          appearance-none focus:outline-none focus:ring-0 focus:border-primary peer
          transition-colors
        `}
        placeholder=" " // Required for the peer selector to work
        {...props}
      />
      <label
        htmlFor={inputId}
        className={`
          absolute text-sm text-gray-500 dark:text-gray-400 
          duration-300 transform 
          -translate-y-3 scale-75 top-3 z-10 origin-[0] 
          left-3
          peer-focus:text-primary dark:peer-focus:text-blue-500
          peer-placeholder-shown:scale-100 
          peer-placeholder-shown:translate-y-0 
          peer-focus:scale-75 
          peer-focus:-translate-y-3
          ${hasValue ? 'scale-75 -translate-y-3' : ''}
        `}
      >
        {label}
      </label>
    </div>
  );
};
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  const selectId = id || `select-${label.replace(/\s+/g, '-')}`;
  const hasValue = props.value != null && props.value !== '';
  
  return (
    <div className="relative">
      <select
        id={selectId}
        className={`
          block px-3 pb-2 pt-4 w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800
          rounded-md border border-gray-300 dark:border-gray-600 
          appearance-none focus:outline-none focus:ring-0 focus:border-primary peer
          transition-colors
        `}
        {...props}
      >
        {children}
      </select>
      <label
        htmlFor={selectId}
        className={`
          absolute text-sm text-gray-500 dark:text-gray-400 
          duration-300 transform 
          -translate-y-3 scale-75 top-3 z-10 origin-[0] 
          left-3
          peer-focus:text-primary dark:peer-focus:text-blue-500
          ${hasValue ? 'scale-75 -translate-y-3' : 'scale-100 translate-y-0'}
          peer-focus:scale-75 
          peer-focus:-translate-y-3
          bg-white dark:bg-gray-800 px-1
        `}
      >
        {label}
      </label>
      <div className="absolute top-0 right-0 h-full flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
        </svg>
      </div>
    </div>
  );
};
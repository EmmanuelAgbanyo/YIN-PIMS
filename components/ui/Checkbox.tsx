import React, { useRef, useEffect } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, id, className, indeterminate, ...props }) => {
  const checkboxId = id || `checkbox-${label.replace(/\s+/g, '-')}`;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <div className={`flex items-center ${className || ''}`}>
      <input
        id={checkboxId}
        type="checkbox"
        ref={ref}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 transition-colors"
        {...props}
      />
      <label htmlFor={checkboxId} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
        {label}
      </label>
    </div>
  );
};
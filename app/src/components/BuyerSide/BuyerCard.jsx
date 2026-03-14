import React from 'react';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';

export const BuyerCard = ({ children, variant = 'default', className = '', ...props }) => {
  const { isDarkMode } = useDarkMode();
  
  const baseClasses = 'rounded-lg overflow-hidden transition-colors duration-200';
  
  const variantClasses = {
    default: isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200',
    elevated: isDarkMode 
      ? 'bg-gray-800 shadow-lg shadow-black/20' 
      : 'bg-white shadow-md',
    outline: isDarkMode 
      ? 'border border-gray-700 bg-transparent' 
      : 'border border-gray-200 bg-transparent',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const BuyerCardContent = ({ children, className = '' }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`p-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} ${className}`}>
      {children}
    </div>
  );
};
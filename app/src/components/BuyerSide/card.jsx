// card.jsx
import React from 'react';

export const Card = ({ children, variant = 'default', className = '', isDarkMode = false, ...props }) => {
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

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};
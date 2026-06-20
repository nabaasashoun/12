import React, { createContext, useContext, useState, useEffect } from 'react';

export const SellerDarkModeContext = createContext();

export const SellerDarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('sellerTheme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('sellerTheme', isDarkMode ? 'dark' : 'light');
    
    // Check if user is a seller before applying dark mode
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'seller') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Listen for role changes to apply correct theme
  useEffect(() => {
    const handleRoleChange = () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'seller') {
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('authStateChanged', handleRoleChange);
    return () => window.removeEventListener('authStateChanged', handleRoleChange);
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <SellerDarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </SellerDarkModeContext.Provider>
  );
};

export const useSellerDarkMode = () => {
  const context = useContext(SellerDarkModeContext);
  if (!context) {
    throw new Error('useSellerDarkMode must be used within a SellerDarkModeProvider');
  }
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';

export const SellerDarkModeContext = createContext();

export const SellerDarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('sellerTheme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sellerTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sellerTheme', 'light');
    }
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
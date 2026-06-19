// src/context/DataProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({ locations: false, products: false, categories: false });
  const [initialized, setInitialized] = useState(false);
  const loadTimeoutRef = useRef(null);

  const loadLocations = useCallback(async () => {
    if (loading.locations || locations.length > 0) return;
    
    setLoading(prev => ({ ...prev, locations: true }));
    try {
      const data = await api.getLocations();
      if (data) {
        setLocations(data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(prev => ({ ...prev, locations: false }));
    }
  }, [locations.length, loading.locations]);

  const loadProducts = useCallback(async (params = {}) => {
    if (loading.products) return;
    
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await api.getProducts(params);
      if (!response.error && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, [loading.products]);

  const loadCategories = useCallback(async () => {
    if (loading.categories || categories.length > 0) return;
    
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const response = await api.getCategories();
      if (!response.error && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [categories.length, loading.categories]);

  // Initialize data with debounce
  useEffect(() => {
    if (initialized) return;

    // Clear any pending timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      loadLocations();
      loadCategories();
      setInitialized(true);
    }, 100);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [loadLocations, loadCategories, initialized]);

  const value = {
    locations,
    products,
    categories,
    loading,
    loadLocations,
    loadProducts,
    loadCategories,
    refreshProducts: (params) => {
      setProducts([]);
      return loadProducts(params);
    },
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
import { useState, useEffect, useCallback } from 'react';
import api from './api'; 

export function useSearch(initialCategory = 'all') {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.getCategories(); 
   
        if (res.data && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  // Save recent searches to localStorage
  const addRecentSearch = useCallback((term) => {
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(t => t !== term)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Perform search
  const search = useCallback(async (searchQuery = query, searchCategory = category) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.searchProducts(searchQuery, searchCategory); // adjust method
      // Expecting res.data to be an array of products
      setResults(res.data || []);
      addRecentSearch(searchQuery);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, addRecentSearch]);

  return {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    results,
    recentSearches,
    loading,
    focused,
    setFocused,
    search,
    addRecentSearch,
  };
}
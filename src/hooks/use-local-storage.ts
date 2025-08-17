
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get from local storage then parse stored json
  // Note: Do NOT depend on initialValue here to keep this callback stable across renders
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key]);

  // State to store our value; lazy initialize to avoid double parsing and ensure first render uses current storage
  const [storedValue, setStoredValue] = useState<T>(() => readValue());

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Refresh state if the key changes or when running on mount to sync with existing storage
  useEffect(() => {
    const current = readValue();
    setStoredValue(current);
  }, [readValue]);

  return [storedValue, setValue];
}

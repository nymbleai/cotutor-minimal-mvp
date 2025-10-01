import { useState, useEffect, useCallback } from 'react';
import { keyLogger, type DocumentChange } from '../services/keylogger';

interface OfficeJsState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  isWordContext: boolean;
}

// Office.js initialization hook
export const useOfficeJs = () => {
  const [state, setState] = useState<OfficeJsState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    isWordContext: false
  });

  const [isLogging, setIsLogging] = useState(false);
  const [changes, setChanges] = useState<DocumentChange[]>([]);

  // Initialize Office.js with better waiting logic
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    
    const checkOfficeJs = () => {
      attempts++;
      
      try {
        if (typeof window !== 'undefined' && window.Office) {
          if (window.Office.context && window.Office.context.document) {
            setState({
              isInitialized: true,
              isLoading: false,
              error: null,
              isWordContext: true
            });
            console.log('Office.js detected and ready (Word context)');
            return true; // Stop checking
          } else if (window.Office.onReady) {
            // Office.js is available but not ready, wait for onReady
            window.Office.onReady(() => {
              setState({
                isInitialized: true,
                isLoading: false,
                error: null,
                isWordContext: !!(window.Office.context && window.Office.context.document)
              });
              console.log('Office.js initialized via onReady');
            });
            return true; // Stop checking
          }
        }
        
        // If we've tried enough times, give up
        if (attempts >= maxAttempts) {
          setState({
            isInitialized: false,
            isLoading: false,
            error: 'Office.js not available after waiting',
            isWordContext: false
          });
          console.log('Office.js not available after waiting');
          return true; // Stop checking
        }
        
        return false; // Continue checking
      } catch (error) {
        setState({
          isInitialized: false,
          isLoading: false,
          error: `Office.js detection error: ${error}`,
          isWordContext: false
        });
        console.error('Office.js detection failed:', error);
        return true; // Stop checking
      }
    };

    // Check immediately
    if (!checkOfficeJs()) {
      // If not ready, check every 500ms
      const checkInterval = setInterval(() => {
        if (checkOfficeJs()) {
          clearInterval(checkInterval);
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }
  }, []);

  // Start keylogging
  const startLogging = useCallback(() => {
    if (!state.isInitialized || !state.isWordContext) {
      console.warn('Cannot start logging - Office.js not initialized or not in Word context');
      return false;
    }

    try {
      keyLogger.start();
      setIsLogging(true);
      return true;
    } catch (error) {
      console.error('Failed to start logging:', error);
      return false;
    }
  }, [state.isInitialized, state.isWordContext]);

  // Stop keylogging
  const stopLogging = useCallback(() => {
    keyLogger.stop();
    setIsLogging(false);
  }, []);

  // Get current changes
  const getChanges = useCallback((): DocumentChange[] => {
    return keyLogger.getChanges();
  }, []);

  // Get last N changes
  const getLastChanges = useCallback((count: number): DocumentChange[] => {
    return keyLogger.getLastChanges(count);
  }, []);

  // Clear all changes
  const clearChanges = useCallback(() => {
    keyLogger.clearChanges();
    setChanges([]);
  }, []);

  // Get logging statistics
  const getStats = useCallback(() => {
    return keyLogger.getStats();
  }, []);

  // Periodic update of changes (every 2 seconds when logging)
  useEffect(() => {
    if (isLogging) {
      const interval = setInterval(() => {
        setChanges(keyLogger.getChanges());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isLogging]);

  return {
    // Office.js state
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
    isWordContext: state.isWordContext,
    isReady: state.isInitialized && state.isWordContext,
    
    // Keylogging state
    isLogging,
    changes,
    
    // Keylogging controls
    startLogging,
    stopLogging,
    getChanges,
    getLastChanges,
    clearChanges,
    getStats
  };
};


import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  lastSubmissionTime: number;
  failedAttempts: number;
  lockoutUntil: number;
}

const COOLDOWN_MS = 5000; // 5 seconds between submissions
const MAX_FAILED_ATTEMPTS = 3;
const FAILED_WINDOW_MS = 60000; // 1 minute window for failed attempts
const LOCKOUT_DURATION_MS = 60000; // 60 second lockout

const STORAGE_KEY = 'zerodelta_rate_limit';

function getStoredState(): RateLimitState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse rate limit state:', e);
  }
  return {
    lastSubmissionTime: 0,
    failedAttempts: 0,
    lockoutUntil: 0,
  };
}

function saveState(state: RateLimitState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save rate limit state:', e);
  }
}

export function useRateLimit() {
  const [state, setState] = useState<RateLimitState>(getStoredState);
  const [countdown, setCountdown] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Update countdown every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Check if in lockout
      if (state.lockoutUntil > now) {
        setIsLocked(true);
        setCountdown(Math.ceil((state.lockoutUntil - now) / 1000));
        return;
      }
      
      setIsLocked(false);
      
      // Check cooldown
      const timeSinceLastSubmission = now - state.lastSubmissionTime;
      if (timeSinceLastSubmission < COOLDOWN_MS) {
        setCountdown(Math.ceil((COOLDOWN_MS - timeSinceLastSubmission) / 1000));
      } else {
        setCountdown(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state]);

  // Clean up old failed attempts
  useEffect(() => {
    const now = Date.now();
    const windowStart = now - FAILED_WINDOW_MS;
    
    if (state.lastSubmissionTime < windowStart && state.failedAttempts > 0) {
      const newState = { ...state, failedAttempts: 0 };
      setState(newState);
      saveState(newState);
    }
  }, [state]);

  const canSubmit = useCallback((): boolean => {
    const now = Date.now();
    
    // Check lockout
    if (state.lockoutUntil > now) {
      return false;
    }
    
    // Check cooldown
    if (now - state.lastSubmissionTime < COOLDOWN_MS) {
      return false;
    }
    
    return true;
  }, [state]);

  const recordSubmission = useCallback((success: boolean): void => {
    const now = Date.now();
    let newState: RateLimitState;

    if (success) {
      newState = {
        lastSubmissionTime: now,
        failedAttempts: 0,
        lockoutUntil: 0,
      };
    } else {
      const newFailedAttempts = state.failedAttempts + 1;
      
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        newState = {
          lastSubmissionTime: now,
          failedAttempts: 0,
          lockoutUntil: now + LOCKOUT_DURATION_MS,
        };
      } else {
        newState = {
          lastSubmissionTime: now,
          failedAttempts: newFailedAttempts,
          lockoutUntil: 0,
        };
      }
    }

    setState(newState);
    saveState(newState);
  }, [state.failedAttempts]);

  const getCountdownText = useCallback((): string => {
    if (isLocked) {
      return `Locked for ${countdown}s`;
    }
    if (countdown > 0) {
      return `Wait ${countdown}s`;
    }
    return '';
  }, [countdown, isLocked]);

  return {
    canSubmit,
    recordSubmission,
    countdown,
    isLocked,
    getCountdownText,
    remainingAttempts: MAX_FAILED_ATTEMPTS - state.failedAttempts,
  };
}

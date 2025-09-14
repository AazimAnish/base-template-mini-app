'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMiniApp } from '@/lib/miniapp/hooks';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  verifications?: string[];
  isAuthenticated: boolean;
}

interface AuthState {
  user: FarcasterUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useFarcasterAuth() {
  const { isInFarcaster, userContext } = useMiniApp();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  const verifyAuth = useCallback(async () => {
    if (!isInFarcaster) {
      // Not in Farcaster client - use basic auth or guest mode
      setAuthState({
        user: {
          fid: 0,
          username: 'guest',
          displayName: 'Guest User',
          isAuthenticated: false,
        },
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Use Quick Auth to verify the user
      const response = await fetch('/api/auth', {
        headers: {
          'Authorization': `Bearer ${await getQuickAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const { userFid } = await response.json();

      // Combine with Mini App user context
      const authenticatedUser: FarcasterUser = {
        fid: userFid || userContext?.fid || 0,
        username: userContext?.username || `user_${userFid}`,
        displayName: userContext?.displayName || `User ${userFid}`,
        pfpUrl: userContext?.pfpUrl,
        verifications: userContext?.verifications,
        isAuthenticated: true,
      };

      setAuthState({
        user: authenticatedUser,
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Authentication error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, [isInFarcaster, userContext]);

  // Helper function to get Quick Auth token
  const getQuickAuthToken = async (): Promise<string> => {
    // In a real implementation, this would use the Quick Auth SDK
    // For now, we'll simulate it
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).quickAuth) {
      return await ((window as Record<string, unknown>).quickAuth as { getToken: () => Promise<string> }).getToken();
    }
    
    // Fallback - return a mock token for development
    return 'mock_token_' + Date.now();
  };

  const signIn = useCallback(async () => {
    await verifyAuth();
  }, [verifyAuth]);

  const signOut = useCallback(() => {
    setAuthState({
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Auto-verify on mount and when context changes
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return {
    user: authState.user,
    isAuthenticated: authState.user?.isAuthenticated || false,
    isLoading: authState.isLoading,
    error: authState.error,
    isInFarcaster,
    signIn,
    signOut,
    refetch: verifyAuth,
  };
}

// Auth-aware component wrapper
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = false 
}: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useFarcasterAuth();
  const defaultFallback = React.createElement('div', null, 'Loading...');

  if (isLoading) {
    return fallback || defaultFallback;
  }

  if (requireAuth && !isAuthenticated) {
    return React.createElement('div', {
      className: "min-h-screen bg-white flex items-center justify-center p-4"
    }, React.createElement('div', {
      className: "text-center space-y-4"
    }, [
      React.createElement('h2', {
        key: 'title',
        className: "text-xl font-medium text-black"
      }, 'Authentication Required'),
      React.createElement('p', {
        key: 'description',
        className: "text-gray-600"
      }, 'Please sign in to access this game feature.'),
      React.createElement('button', {
        key: 'button',
        onClick: () => window.location.reload(),
        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      }, 'Retry')
    ]));
  }

  return React.createElement(React.Fragment, null, children);
}

// Hook for user preferences and game settings
export function useUserPreferences() {
  const { user } = useFarcasterAuth();
  const [preferences, setPreferences] = useState({
    haptics: true,
    notifications: true,
    autoShare: false,
    theme: 'auto' as 'light' | 'dark' | 'auto',
  });

  const updatePreference = useCallback((key: keyof typeof preferences, value: unknown) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      
      // Save to localStorage if available
      try {
        localStorage.setItem(`sus_prefs_${user?.fid || 'guest'}`, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save preferences:', error);
      }
      
      return updated;
    });
  }, [user?.fid]);

  // Load preferences on mount
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`sus_prefs_${user.fid}`);
        if (saved) {
          setPreferences(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load preferences:', error);
      }
    }
  }, [user]);

  return {
    preferences,
    updatePreference,
  };
}
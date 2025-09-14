'use client';

import { useEffect, useState, useCallback } from 'react';
import { miniAppSDK } from './sdk';

/**
 * Hook for Farcaster Mini App integration
 */
export function useMiniApp() {
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [userContext, setUserContext] = useState<{
    fid: number;
    username: string;
    displayName: string;
    pfpUrl?: string;
    verifications?: string[];
    address?: string;
  } | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        await miniAppSDK.initialize();
        setIsInFarcaster(miniAppSDK.isInFarcasterClient());
        setIsReady(true);

        // Get user context if in Farcaster
        if (miniAppSDK.isInFarcasterClient()) {
          const context = await miniAppSDK.getUserContext();
          setUserContext(context);

          const caps = await miniAppSDK.getCapabilities();
          setCapabilities(caps);
        }
      } catch (error) {
        console.error('Mini App initialization failed:', error);
      }
    };

    initializeMiniApp();
  }, []);

  const shareGame = useCallback(async (lobbyId: string, gameType: 'join' | 'spectate' = 'join') => {
    try {
      const inviteText = miniAppSDK.createGameInvite(lobbyId, gameType);
      await miniAppSDK.shareToFeed(inviteText);
      miniAppSDK.trackEvent('game_shared', { lobbyId, gameType });
    } catch (error) {
      console.error('Failed to share game:', error);
    }
  }, []);

  const hapticFeedback = useCallback(async (
    type: 'impact' | 'notification' | 'selection',
    intensity?: string
  ) => {
    await miniAppSDK.hapticFeedback(type, intensity);
  }, []);

  const sendNotification = useCallback(async (title: string, body: string, targetUrl?: string) => {
    await miniAppSDK.sendNotification(title, body, targetUrl);
  }, []);

  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    miniAppSDK.trackEvent(event, properties);
  }, []);

  return {
    isInFarcaster,
    isReady,
    userContext,
    capabilities,
    shareGame,
    hapticFeedback,
    sendNotification,
    trackEvent,
    navigateBack: miniAppSDK.navigateBack.bind(miniAppSDK),
    openUrl: miniAppSDK.openUrl.bind(miniAppSDK),
  };
}

/**
 * Hook for gamification features
 */
export function useGameFeatures() {
  const { hapticFeedback, trackEvent, sendNotification } = useMiniApp();

  const celebrateWin = useCallback(async () => {
    await hapticFeedback('notification', 'success');
    trackEvent('game_won');
  }, [hapticFeedback, trackEvent]);

  const reactToElimination = useCallback(async () => {
    await hapticFeedback('notification', 'error');
    trackEvent('player_eliminated');
  }, [hapticFeedback, trackEvent]);

  const onVoteCast = useCallback(async () => {
    await hapticFeedback('impact', 'medium');
    trackEvent('vote_cast');
  }, [hapticFeedback, trackEvent]);

  const onGameJoined = useCallback(async (lobbyId: string) => {
    await hapticFeedback('notification', 'success');
    trackEvent('game_joined', { lobbyId });
  }, [hapticFeedback, trackEvent]);

  const onStakeConfirmed = useCallback(async (amount: string) => {
    await hapticFeedback('impact', 'heavy');
    trackEvent('stake_confirmed', { amount });
  }, [hapticFeedback, trackEvent]);

  const notifyGameStart = useCallback(async (lobbyId: string) => {
    await sendNotification(
      '🎮 Game Started!',
      `Your SUS game is ready. Find the traitor!`,
      `${window.location.origin}/game?id=${lobbyId}`
    );
    trackEvent('game_started', { lobbyId });
  }, [sendNotification, trackEvent]);

  const notifyTurnToVote = useCallback(async () => {
    await sendNotification(
      '🗳️ Time to Vote!',
      'Choose who you think is the traitor',
      window.location.href
    );
    await hapticFeedback('impact', 'medium');
    trackEvent('voting_phase_started');
  }, [sendNotification, hapticFeedback, trackEvent]);

  return {
    celebrateWin,
    reactToElimination,
    onVoteCast,
    onGameJoined,
    onStakeConfirmed,
    notifyGameStart,
    notifyTurnToVote,
  };
}

/**
 * Hook for social features
 */
export function useSocialFeatures() {
  const { shareGame, userContext, trackEvent } = useMiniApp();

  const shareVictory = useCallback(async (winnerNames: string[], potAmount: string) => {
    const shareText = `🏆 Just won ${potAmount} ETH in SUS! \n\nWinners: ${winnerNames.join(', ')}\n\nThink you can find the traitor? Join the next game! 🕵️`;
    
    try {
      await miniAppSDK.shareToFeed(shareText, [window.location.origin]);
      trackEvent('victory_shared', { winners: winnerNames, potAmount });
    } catch (error) {
      console.error('Failed to share victory:', error);
    }
  }, [trackEvent]);

  const shareTraitorWin = useCallback(async (potAmount: string) => {
    const shareText = `😈 I just rugged ${potAmount} ETH as the traitor in SUS! \n\nThe crew never saw it coming... \n\nCan you do better? 🎭`;
    
    try {
      await miniAppSDK.shareToFeed(shareText, [window.location.origin]);
      trackEvent('traitor_victory_shared', { potAmount });
    } catch (error) {
      console.error('Failed to share traitor win:', error);
    }
  }, [trackEvent]);

  const inviteToLobby = useCallback(async (lobbyId: string) => {
    await shareGame(lobbyId, 'join');
  }, [shareGame]);

  const createSpectateLink = useCallback(async (lobbyId: string) => {
    await shareGame(lobbyId, 'spectate');
  }, [shareGame]);

  return {
    shareVictory,
    shareTraitorWin,
    inviteToLobby,
    createSpectateLink,
    userContext,
  };
}
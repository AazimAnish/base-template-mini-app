'use client';

import { sdk } from '@farcaster/miniapp-sdk';

export class MiniAppSDK {
  private static instance: MiniAppSDK;
  private isReady = false;

  private constructor() {}

  static getInstance(): MiniAppSDK {
    if (!MiniAppSDK.instance) {
      MiniAppSDK.instance = new MiniAppSDK();
    }
    return MiniAppSDK.instance;
  }

  /**
   * Initialize the Mini App SDK and signal readiness
   */
  async initialize(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await sdk.actions.ready();
        this.isReady = true;
        console.log('🚀 Mini App SDK initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Mini App SDK:', error);
    }
  }

  /**
   * Check if running inside a Farcaster client
   */
  isInFarcasterClient(): boolean {
    return typeof window !== 'undefined' && sdk.context.client.clientType !== 'external';
  }

  /**
   * Get user context from Farcaster
   */
  async getUserContext() {
    try {
      const context = await sdk.context.user();
      return {
        fid: context.fid,
        username: context.username,
        displayName: context.displayName,
        pfpUrl: context.pfpUrl,
        verifications: context.verifications,
      };
    } catch (error) {
      console.error('Failed to get user context:', error);
      return null;
    }
  }

  /**
   * Share content to Farcaster feed
   */
  async shareToFeed(text: string, embeds?: string[]): Promise<void> {
    try {
      if (this.isInFarcasterClient()) {
        await sdk.actions.shareToFeed({
          text,
          embeds: embeds || [],
        });
      } else {
        // Fallback for non-Farcaster clients
        this.shareViaWebShare(text, embeds);
      }
    } catch (error) {
      console.error('Failed to share to feed:', error);
      this.shareViaWebShare(text, embeds);
    }
  }

  /**
   * Trigger haptic feedback for user interactions
   */
  async hapticFeedback(type: 'impact' | 'notification' | 'selection', intensity?: string): Promise<void> {
    try {
      if (!this.isInFarcasterClient()) return;

      switch (type) {
        case 'impact':
          await sdk.haptics.impactOccurred((intensity as 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') || 'medium');
          break;
        case 'notification':
          await sdk.haptics.notificationOccurred((intensity as 'success' | 'warning' | 'error') || 'success');
          break;
        case 'selection':
          await sdk.haptics.selectionChanged();
          break;
      }
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  /**
   * Handle back navigation
   */
  async navigateBack(): Promise<void> {
    try {
      if (this.isInFarcasterClient()) {
        await sdk.actions.close();
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error('Back navigation failed:', error);
      window.history.back();
    }
  }

  /**
   * Get Mini App capabilities
   */
  async getCapabilities() {
    try {
      return await sdk.context.capabilities();
    } catch (error) {
      console.error('Failed to get capabilities:', error);
      return [];
    }
  }

  /**
   * Send notification (if supported)
   */
  async sendNotification(title: string, body: string, targetUrl?: string): Promise<void> {
    try {
      if (this.isInFarcasterClient()) {
        await sdk.actions.sendNotification({
          title,
          body,
          targetUrl: targetUrl || window.location.origin,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Open external URL (client-agnostic)
   */
  async openUrl(url: string): Promise<void> {
    try {
      if (this.isInFarcasterClient()) {
        await sdk.actions.openUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Fallback share method using Web Share API
   */
  private async shareViaWebShare(text: string, _embeds?: string[]): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SUS - Social Deduction Game',
          text,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        console.log('Content copied to clipboard');
      }
    } catch (error) {
      console.error('Web share failed:', error);
    }
  }

  /**
   * Create shareable game invite
   */
  createGameInvite(lobbyId: string, gameType: 'join' | 'spectate' = 'join'): string {
    const baseUrl = window.location.origin;
    const inviteText = `🕵️ Join my SUS game! Lobby: ${lobbyId}\n\nStake ETH, find the traitor, win the pot! 🎮`;
    const gameUrl = `${baseUrl}/${gameType === 'join' ? 'lobby' : 'spectate'}?id=${lobbyId}`;
    
    return `${inviteText}\n\n🎯 ${gameUrl}`;
  }

  /**
   * Analytics tracking for Mini App events
   */
  trackEvent(event: string, properties?: Record<string, unknown>): void {
    try {
      console.log(`📊 Mini App Event: ${event}`, properties);
      // Here you could integrate with analytics services
      // For now, just log for debugging
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
}

// Export singleton instance
export const miniAppSDK = MiniAppSDK.getInstance();

// Auto-initialize on import (client-side only)
if (typeof window !== 'undefined') {
  miniAppSDK.initialize();
}
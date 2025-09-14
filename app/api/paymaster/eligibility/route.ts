import { NextRequest, NextResponse } from 'next/server';

// Eligibility criteria for gasless transactions
const ELIGIBILITY_CRITERIA = {
  minAccountAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  maxDailyTransactions: 10,
  requiredMinBalance: '0.0001', // 0.0001 ETH minimum balance
  blockedAddresses: new Set([
    // Add any blocked addresses here
  ]),
};

// Simple in-memory storage for demo (use database in production)
const userActivity = new Map<string, {
  firstSeen: number;
  transactionsToday: number;
  lastTransactionDate: string;
  totalTransactions: number;
}>();

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { eligible: false, reason: 'Address is required' },
        { status: 400 }
      );
    }

    // Check if address is blocked
    if (ELIGIBILITY_CRITERIA.blockedAddresses.has(address.toLowerCase())) {
      return NextResponse.json({
        eligible: false,
        reason: 'Address is not eligible for gasless transactions',
      });
    }

    // Check daily transaction limits
    const today = new Date().toISOString().split('T')[0];
    let activity = userActivity.get(address);

    if (!activity) {
      // First time user
      activity = {
        firstSeen: Date.now(),
        transactionsToday: 0,
        lastTransactionDate: today,
        totalTransactions: 0,
      };
      userActivity.set(address, activity);
    } else {
      // Reset daily counter if it's a new day
      if (activity.lastTransactionDate !== today) {
        activity.transactionsToday = 0;
        activity.lastTransactionDate = today;
      }
    }

    // Check account age (for new accounts)
    const accountAge = Date.now() - activity.firstSeen;
    if (accountAge < ELIGIBILITY_CRITERIA.minAccountAge && activity.totalTransactions === 0) {
      return NextResponse.json({
        eligible: false,
        reason: 'Account too new for gasless transactions',
        details: {
          accountAge: Math.floor(accountAge / (24 * 60 * 60 * 1000)),
          requiredAge: 7,
        },
      });
    }

    // Check daily transaction limit
    if (activity.transactionsToday >= ELIGIBILITY_CRITERIA.maxDailyTransactions) {
      return NextResponse.json({
        eligible: false,
        reason: 'Daily transaction limit exceeded',
        details: {
          transactionsToday: activity.transactionsToday,
          dailyLimit: ELIGIBILITY_CRITERIA.maxDailyTransactions,
        },
      });
    }

    // Check account balance (this would require RPC call in production)
    const hasMinBalance = await checkMinBalance(address);
    if (!hasMinBalance) {
      return NextResponse.json({
        eligible: false,
        reason: 'Insufficient account balance for eligibility',
        details: {
          requiredBalance: ELIGIBILITY_CRITERIA.requiredMinBalance,
        },
      });
    }

    // Additional checks for game-specific eligibility
    const gameEligibility = await checkGameEligibility(address);
    if (!gameEligibility.eligible) {
      return NextResponse.json({
        eligible: false,
        reason: gameEligibility.reason,
        details: gameEligibility.details,
      });
    }

    // All checks passed
    return NextResponse.json({
      eligible: true,
      reason: 'Account is eligible for gasless transactions',
      details: {
        transactionsRemaining: ELIGIBILITY_CRITERIA.maxDailyTransactions - activity.transactionsToday,
        accountAge: Math.floor(accountAge / (24 * 60 * 60 * 1000)),
        totalTransactions: activity.totalTransactions,
      },
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json(
      {
        eligible: false,
        reason: 'Unable to verify eligibility',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function checkMinBalance(address: string): Promise<boolean> {
  try {
    // In production, this would make an RPC call to check balance
    // For now, we'll simulate based on address characteristics
    
    // Mock implementation - assume addresses with certain patterns have balance
    const addressLower = address.toLowerCase();
    
    // Always approve for development/demo addresses
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // Simple heuristic - addresses with more variety in characters likely have some balance
    const uniqueChars = new Set(addressLower.slice(2)).size;
    return uniqueChars >= 8; // Addresses with at least 8 unique hex characters
    
  } catch (error) {
    console.error('Balance check failed:', error);
    return false;
  }
}

async function checkGameEligibility(address: string): Promise<{
  eligible: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}> {
  try {
    // Game-specific eligibility rules
    
    // 1. Check if user has any pending/active games
    // In production, this would query the game contract or database
    const activegames = await getActiveGamesForUser(address);
    
    if (activegames.length > 3) {
      return {
        eligible: false,
        reason: 'Too many active games',
        details: { activeGames: activegames.length, maxAllowed: 3 },
      };
    }

    // 2. Check reputation/previous behavior
    const reputation = await getUserReputation(address);
    
    if (reputation.score < 0.5) {
      return {
        eligible: false,
        reason: 'Account reputation too low',
        details: { reputationScore: reputation.score, minimumRequired: 0.5 },
      };
    }

    // 3. Check for recent suspicious activity
    if (reputation.flags.includes('suspicious_activity')) {
      return {
        eligible: false,
        reason: 'Recent suspicious activity detected',
        details: { flags: reputation.flags },
      };
    }

    return { eligible: true };

  } catch (error) {
    console.error('Game eligibility check failed:', error);
    // Default to eligible if checks fail
    return { eligible: true };
  }
}

async function getActiveGamesForUser(_address: string): Promise<unknown[]> {
  // Mock implementation
  // In production, this would query the smart contract or database
  return [];
}

async function getUserReputation(address: string): Promise<{
  score: number;
  flags: string[];
}> {
  // Mock implementation
  // In production, this would calculate based on:
  // - Game completion rate
  // - Whether user frequently abandons games
  // - Community reports
  // - Transaction patterns
  
  const activity = userActivity.get(address);
  
  if (!activity) {
    // New user - neutral reputation
    return { score: 0.75, flags: [] };
  }

  // Simple score based on transaction history
  let score = 0.5; // Base score
  
  if (activity.totalTransactions > 5) score += 0.2;
  if (activity.totalTransactions > 20) score += 0.1;
  if (activity.totalTransactions > 50) score += 0.1;
  
  // Cap at 1.0
  score = Math.min(score, 1.0);

  const flags: string[] = [];
  
  // Flag accounts with suspicious patterns
  if (activity.totalTransactions > 100 && Date.now() - activity.firstSeen < 7 * 24 * 60 * 60 * 1000) {
    flags.push('high_volume_new_account');
  }

  return { score, flags };
}

// Endpoint to update user activity (called after successful transactions)
export async function PUT(request: NextRequest) {
  try {
    const { address, gasUsed: _gasUsed } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    let activity = userActivity.get(address);

    if (!activity) {
      activity = {
        firstSeen: Date.now(),
        transactionsToday: 1,
        lastTransactionDate: today,
        totalTransactions: 1,
      };
    } else {
      if (activity.lastTransactionDate !== today) {
        activity.transactionsToday = 1;
      } else {
        activity.transactionsToday += 1;
      }
      activity.totalTransactions += 1;
      activity.lastTransactionDate = today;
    }

    userActivity.set(address, activity);

    return NextResponse.json({
      success: true,
      transactionsToday: activity.transactionsToday,
      totalTransactions: activity.totalTransactions,
    });

  } catch (error) {
    console.error('Activity update error:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}
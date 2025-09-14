import { NextRequest, NextResponse } from 'next/server';

// Base Paymaster configuration
const PAYMASTER_URL = process.env.BASE_PAYMASTER_URL || 'https://paymaster.base.org/v1/sponsor';
const PAYMASTER_API_KEY = process.env.BASE_PAYMASTER_API_KEY;

// Transaction sponsorship limits
const SPONSORSHIP_LIMITS = {
  maxGasPerUser: 500000, // Max gas per user per day
  maxTransactionsPerUser: 10, // Max transactions per user per day
  maxValuePerTransaction: '0.1', // Max ETH value we'll sponsor
  allowedContracts: [
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, // SUS Game contract
  ],
};

// In-memory rate limiting (in production, use Redis)
const userLimits = new Map<string, { gasUsed: number; txCount: number; lastReset: number }>();

export async function POST(request: NextRequest) {
  try {
    const { to, data, value, from } = await request.json();

    // Validate request
    if (!to || !data || !from) {
      return NextResponse.json(
        { sponsored: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if contract is allowed for sponsorship
    if (!SPONSORSHIP_LIMITS.allowedContracts.includes(to.toLowerCase())) {
      return NextResponse.json(
        { sponsored: false, error: 'Contract not eligible for sponsorship' },
        { status: 400 }
      );
    }

    // Check value limits
    if (value && parseFloat(value) > parseFloat(SPONSORSHIP_LIMITS.maxValuePerTransaction)) {
      return NextResponse.json(
        { sponsored: false, error: 'Transaction value too high for sponsorship' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(from);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { sponsored: false, error: rateLimitResult.reason },
        { status: 429 }
      );
    }

    // Estimate gas for the transaction
    const gasEstimate = await estimateGas(to, data, value, from);
    
    if (gasEstimate > SPONSORSHIP_LIMITS.maxGasPerUser) {
      return NextResponse.json(
        { sponsored: false, error: 'Gas estimate too high' },
        { status: 400 }
      );
    }

    // Try to sponsor the transaction
    const sponsorResult = await requestSponsorship({
      to,
      data,
      value: value || '0',
      from,
      gasLimit: gasEstimate.toString(),
    });

    if (sponsorResult.success) {
      // Update rate limits
      updateRateLimit(from, gasEstimate);
      
      return NextResponse.json({
        sponsored: true,
        transactionHash: sponsorResult.txHash,
        gasSponsored: gasEstimate,
        paymasterData: sponsorResult.paymasterData,
      });
    } else {
      return NextResponse.json({
        sponsored: false,
        error: sponsorResult.error || 'Sponsorship failed',
      });
    }

  } catch (error) {
    console.error('Paymaster sponsorship error:', error);
    return NextResponse.json(
      { 
        sponsored: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function checkRateLimit(userAddress: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  let userLimit = userLimits.get(userAddress);
  
  // Reset limits if a day has passed
  if (!userLimit || now - userLimit.lastReset > oneDayMs) {
    userLimit = { gasUsed: 0, txCount: 0, lastReset: now };
    userLimits.set(userAddress, userLimit);
  }

  // Check transaction count limit
  if (userLimit.txCount >= SPONSORSHIP_LIMITS.maxTransactionsPerUser) {
    return { allowed: false, reason: 'Daily transaction limit exceeded' };
  }

  // Check gas usage limit
  if (userLimit.gasUsed >= SPONSORSHIP_LIMITS.maxGasPerUser) {
    return { allowed: false, reason: 'Daily gas limit exceeded' };
  }

  return { allowed: true };
}

function updateRateLimit(userAddress: string, gasUsed: number) {
  const userLimit = userLimits.get(userAddress);
  if (userLimit) {
    userLimit.gasUsed += gasUsed;
    userLimit.txCount += 1;
    userLimits.set(userAddress, userLimit);
  }
}

async function estimateGas(
  to: string,
  data: string,
  _value: string,
  _from: string
): Promise<number> {
  try {
    // In a real implementation, this would call an RPC endpoint to estimate gas
    // For now, we'll use heuristics based on the transaction data
    
    const dataSize = data.length;
    let baseGas = 21000; // Base transaction cost
    
    // Add gas for data
    baseGas += (dataSize / 2 - 1) * 16; // 16 gas per non-zero byte
    
    // Game-specific estimates
    if (data.includes('createGame')) return 180000;
    if (data.includes('joinGame')) return 85000;
    if (data.includes('endGame')) return 95000;
    if (data.includes('rugPot')) return 45000;
    if (data.includes('vote')) return 35000;
    
    return Math.max(baseGas, 50000); // Minimum 50k gas
    
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return 100000; // Conservative fallback
  }
}

async function requestSponsorship(params: {
  to: string;
  data: string;
  value: string;
  from: string;
  gasLimit: string;
}): Promise<{ success: boolean; txHash?: string; paymasterData?: string; error?: string }> {
  try {
    if (!PAYMASTER_API_KEY) {
      throw new Error('Paymaster API key not configured');
    }

    // Call Base Paymaster service
    const response = await fetch(PAYMASTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYMASTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'pm_sponsorUserOperation',
        params: [{
          sender: params.from,
          nonce: '0x0', // Would need actual nonce in production
          initCode: '0x',
          callData: params.data,
          callGasLimit: params.gasLimit,
          verificationGasLimit: '100000',
          preVerificationGas: '21000',
          maxFeePerGas: '20000000000',
          maxPriorityFeePerGas: '1000000000',
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Paymaster request failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return {
      success: true,
      txHash: result.result?.transactionHash,
      paymasterData: result.result?.paymasterAndData,
    };

  } catch (error) {
    console.error('Paymaster request failed:', error);
    
    // Fallback: simulate successful sponsorship for development
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        txHash: `0x${'0'.repeat(64)}`, // Mock transaction hash
        paymasterData: '0x',
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Sponsorship request failed' 
    };
  }
}
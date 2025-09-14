import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, embeds, lobbyId, gameType } = await request.json();

    // Log sharing activity for analytics
    console.log('🔗 Share request:', {
      text: text?.substring(0, 100) + '...',
      embeds: embeds?.length || 0,
      lobbyId,
      gameType,
      timestamp: new Date().toISOString(),
    });

    // Here you could:
    // 1. Store sharing analytics in database
    // 2. Generate dynamic share images
    // 3. Track viral coefficient
    // 4. Send notifications to relevant users

    // Return share metadata for client
    const shareData = {
      success: true,
      shareId: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metadata: {
        text,
        embeds: embeds || [],
        lobbyId: lobbyId || null,
        gameType: gameType || 'unknown',
      }
    };

    return NextResponse.json(shareData);

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process share request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle share link previews and metadata
  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get('lobbyId');
  const gameType = searchParams.get('type') || 'join';

  try {
    // Generate dynamic share metadata
    const shareData = {
      title: 'SUS - Social Deduction Game',
      description: lobbyId 
        ? `Join lobby ${lobbyId} and help find the traitor! 🕵️` 
        : 'Stake ETH, find the traitor, win the pot! 🎮',
      image: `${process.env.NEXT_PUBLIC_URL || 'https://susonbase.vercel.app'}/hero.png`,
      url: lobbyId 
        ? `${process.env.NEXT_PUBLIC_URL || 'https://susonbase.vercel.app'}/lobby?id=${lobbyId}`
        : process.env.NEXT_PUBLIC_URL || 'https://susonbase.vercel.app',
      gameType,
      lobbyId,
    };

    return NextResponse.json(shareData);

  } catch (error) {
    console.error('Share metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to get share metadata' },
      { status: 500 }
    );
  }
}
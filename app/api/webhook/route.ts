import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log webhook events for debugging
    console.log('Webhook received:', body);
    
    // Handle different webhook event types
    switch (body.type) {
      case 'frame_added':
        // Handle when frame is added to a cast
        console.log('Frame added to cast:', body.data);
        break;
      
      case 'frame_removed':
        // Handle when frame is removed from a cast
        console.log('Frame removed from cast:', body.data);
        break;
      
      case 'button_clicked':
        // Handle button clicks
        console.log('Button clicked:', body.data);
        break;
      
      default:
        console.log('Unknown webhook type:', body.type);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'SUS Game Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
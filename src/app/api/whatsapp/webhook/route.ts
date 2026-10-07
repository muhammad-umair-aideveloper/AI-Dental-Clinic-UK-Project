import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService } from '@/lib/whatsapp';

// Secret token for Meta WhatsApp Business Cloud Webhook verification
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'VERTEX_DENTAL_UK_WEBHOOK_2026';

/**
 * GET: Webhook Verification Endpoint
 * Meta WhatsApp Cloud API sends a GET challenge when verifying webhook subscription
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Unauthorized webhook verification failed.' }, { status: 403 });
}

/**
 * POST: Incoming WhatsApp Event Processing
 * Receives incoming messages, interactive button clicks (Confirm / Cancel), and delivery receipts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a standard WhatsApp Cloud API payload or our direct simulated payload
    let fromPhone = '';
    let incomingText = '';
    let buttonId = '';
    let messageId = '';

    // 1. Check Meta WhatsApp Cloud API standard payload structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      fromPhone = message.from;
      messageId = message.id;

      if (message.type === 'interactive' && message.interactive?.button_reply) {
        buttonId = message.interactive.button_reply.id;
        incomingText = message.interactive.button_reply.title;
      } else if (message.type === 'text') {
        incomingText = message.text?.body || '';
      }
    } else {
      // 2. Direct simulation payload format
      fromPhone = body.from || body.phone || '+44 7700 900111';
      incomingText = body.text || '';
      buttonId = body.buttonId || '';
      messageId = body.messageId || `sim-${Date.now()}`;
    }

    const result = await WhatsAppService.handleIncomingWebhook({
      from: fromPhone,
      text: incomingText,
      buttonId,
      messageId,
    });

    return NextResponse.json({
      success: true,
      processed: true,
      actionTaken: result.actionTaken,
      replyMessage: result.replyMessage,
      appointmentId: result.appointmentId,
    });
  } catch (err: any) {
    console.error('WhatsApp Webhook error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal webhook error' }, { status: 500 });
  }
}

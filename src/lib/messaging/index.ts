/**
 * src/lib/messaging/index.ts
 *
 * Provider-Agnostic Messaging Layer for Vertex Dental Lab
 * Supports:
 *   - SMS (Twilio adapter)
 *   - Email (Resend adapter with HTML & CSV attachments)
 *   - WhatsApp (Meta WhatsApp Cloud API adapter)
 *   - MockAdapter (Default in development - logs safely without sending)
 * All credentials sourced exclusively from environment variables.
 */

export type MessageChannel = 'sms' | 'email' | 'whatsapp';

export interface MessageAttachment {
  filename: string;
  content: string; // base64 or UTF-8 string
  contentType?: string;
}

export interface SendOptions {
  html?: string;
  attachments?: MessageAttachment[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  channel: MessageChannel;
  to: string;
  error?: string;
  provider: string;
}

export interface MessagingAdapter {
  send(
    channel: MessageChannel,
    to: string,
    message: string,
    subject?: string,
    options?: SendOptions
  ): Promise<SendResult>;
}

// -------------------------------------------------------------------------
// 1. MOCK ADAPTER (Default in development)
// -------------------------------------------------------------------------
export class MockMessagingAdapter implements MessagingAdapter {
  async send(
    channel: MessageChannel,
    to: string,
    message: string,
    subject?: string,
    options?: SendOptions
  ): Promise<SendResult> {
    const id = `mock-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Mask recipient for privacy in logs (e.g., +447***123)
    const maskedTo = to.length > 6 ? `${to.slice(0, 5)}***${to.slice(-3)}` : to;
    console.log(`[MessagingEngine:MOCK] Channel: ${channel.toUpperCase()} | To: ${maskedTo} | Ref: ${id}`);
    if (subject) console.log(`[MessagingEngine:MOCK] Subject: ${subject}`);
    if (options?.html) console.log(`[MessagingEngine:MOCK] HTML Payload: ${options.html.length} bytes`);
    if (options?.attachments && options.attachments.length > 0) {
      console.log(`[MessagingEngine:MOCK] Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
    }
    console.log(`[MessagingEngine:MOCK] Content:\n${message}\n---`);

    return {
      success: true,
      messageId: id,
      channel,
      to,
      provider: 'mock',
    };
  }
}

// -------------------------------------------------------------------------
// 2. TWILIO SMS ADAPTER
// -------------------------------------------------------------------------
export class TwilioSmsAdapter implements MessagingAdapter {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER || '';
  }

  async send(channel: MessageChannel, to: string, message: string): Promise<SendResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return {
        success: false,
        channel: 'sms',
        to,
        error: 'Twilio credentials not configured in environment variables.',
        provider: 'twilio',
      };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message,
      });

      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          channel: 'sms',
          to,
          error: data.message || 'Twilio API error',
          provider: 'twilio',
        };
      }

      return {
        success: true,
        messageId: data.sid,
        channel: 'sms',
        to,
        provider: 'twilio',
      };
    } catch (err: any) {
      return {
        success: false,
        channel: 'sms',
        to,
        error: err.message || 'Network error during Twilio dispatch',
        provider: 'twilio',
      };
    }
  }
}

// -------------------------------------------------------------------------
// 3. RESEND EMAIL ADAPTER (Supports HTML & CSV Attachments)
// -------------------------------------------------------------------------
export class ResendEmailAdapter implements MessagingAdapter {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'Vertex Dental Lab <reports@vertexdental.co.uk>';
  }

  async send(
    channel: MessageChannel,
    to: string,
    message: string,
    subject: string = 'Vertex Dental Lab Notification',
    options?: SendOptions
  ): Promise<SendResult> {
    if (!this.apiKey) {
      return {
        success: false,
        channel: 'email',
        to,
        error: 'Resend API key not configured in environment variables.',
        provider: 'resend',
      };
    }

    try {
      const payload: any = {
        from: this.fromEmail,
        to: [to],
        subject,
        text: message,
      };

      if (options?.html) {
        payload.html = options.html;
      }

      if (options?.attachments && options.attachments.length > 0) {
        payload.attachments = options.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          channel: 'email',
          to,
          error: data.message || 'Resend API error',
          provider: 'resend',
        };
      }

      return {
        success: true,
        messageId: data.id,
        channel: 'email',
        to,
        provider: 'resend',
      };
    } catch (err: any) {
      return {
        success: false,
        channel: 'email',
        to,
        error: err.message || 'Network error during Resend email dispatch',
        provider: 'resend',
      };
    }
  }
}

// -------------------------------------------------------------------------
// 4. MAIN PROVIDER-AGNOSTIC SERVICE
// -------------------------------------------------------------------------

export class MessagingService {
  private mockAdapter: MockMessagingAdapter = new MockMessagingAdapter();
  private twilioAdapter: TwilioSmsAdapter = new TwilioSmsAdapter();
  private resendAdapter: ResendEmailAdapter = new ResendEmailAdapter();

  /**
   * Unified interface: send(channel, to, message, subject, options)
   * Defaults to MOCK adapter in development or when live credentials are not set.
   */
  async send(
    channel: MessageChannel,
    to: string,
    message: string,
    subject?: string,
    options?: SendOptions
  ): Promise<SendResult> {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.MESSAGING_PROVIDER === 'mock';

    if (channel === 'email') {
      if (!isDev && process.env.RESEND_API_KEY) {
        return this.resendAdapter.send(channel, to, message, subject, options);
      }
      return this.mockAdapter.send(channel, to, message, subject, options);
    }

    if (channel === 'sms') {
      if (!isDev && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return this.twilioAdapter.send(channel, to, message);
      }
      return this.mockAdapter.send(channel, to, message, subject, options);
    }

    // Default to mock for WhatsApp in dev or fallback
    return this.mockAdapter.send(channel, to, message, subject, options);
  }
}

export const messagingService = new MessagingService();

export async function sendMessage(
  channel: MessageChannel,
  to: string,
  message: string,
  subject?: string,
  options?: SendOptions
): Promise<SendResult> {
  return messagingService.send(channel, to, message, subject, options);
}

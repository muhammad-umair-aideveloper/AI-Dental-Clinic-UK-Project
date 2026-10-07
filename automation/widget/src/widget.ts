/**
 * widget/src/widget.ts
 * Embeddable dental chat widget — vanilla TypeScript, no framework.
 * Mobile-first, keyboard accessible, screen-reader friendly.
 * Cloudflare Turnstile for spam protection.
 *
 * Usage:
 *   <script
 *     src="https://automation.vertexdental.co.uk/widget.js"
 *     data-site-key="TURNSTILE_SITE_KEY"
 *     data-api="https://automation.vertexdental.co.uk"
 *     defer
 *   ></script>
 */

interface WidgetConfig {
  apiBase:     string;
  siteKey:     string;
  clinicName:  string;
  primaryColor: string;
}

interface Message {
  role:         'user' | 'assistant';
  content:      string;
  quickReplies?: string[];
  showConsent?: boolean;
}

const SESSION_ID = crypto.randomUUID();

// ─── CSS ─────────────────────────────────────────────────────────────────────

const WIDGET_CSS = `
:root {
  --dw-primary: var(--dental-primary, #0284C7);
  --dw-bg:      #ffffff;
  --dw-surface: #F8FAFC;
  --dw-border:  #E2E8F0;
  --dw-text:    #0F172A;
  --dw-muted:   #64748B;
  --dw-danger:  #DC2626;
  --dw-radius:  16px;
  --dw-shadow:  0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
}

#dw-launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--dw-primary);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(2,132,199,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  color: white;
}
#dw-launcher:hover { transform: scale(1.05); box-shadow: 0 6px 28px rgba(2,132,199,0.5); }
#dw-launcher:focus-visible { outline: 3px solid var(--dw-primary); outline-offset: 3px; }

#dw-badge {
  position: absolute;
  top: 0; right: 0;
  width: 14px; height: 14px;
  background: #22C55E;
  border-radius: 50%;
  border: 2px solid white;
  display: none;
}
#dw-badge.visible { display: block; }

#dw-container {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: min(400px, calc(100vw - 32px));
  height: min(600px, calc(100vh - 120px));
  background: var(--dw-bg);
  border-radius: var(--dw-radius);
  box-shadow: var(--dw-shadow);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  overflow: hidden;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
  border: 1px solid var(--dw-border);
}
#dw-container.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: all;
}

#dw-header {
  background: linear-gradient(135deg, var(--dw-primary) 0%, #0369A1 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
#dw-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
#dw-header-text h2 { color: white; font-size: 15px; font-weight: 600; margin: 0; line-height: 1.3; font-family: inherit; }
#dw-header-text p  { color: rgba(255,255,255,0.8); font-size: 12px; margin: 0; font-family: inherit; }
#dw-close {
  margin-left: auto;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  width: 32px; height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  transition: background 0.15s;
  flex-shrink: 0;
}
#dw-close:hover { background: rgba(255,255,255,0.25); }
#dw-close:focus-visible { outline: 2px solid white; }

#dw-emergency-banner {
  background: #FEF2F2;
  border-left: 4px solid var(--dw-danger);
  padding: 10px 16px;
  font-size: 13px;
  color: var(--dw-danger);
  font-weight: 600;
  display: none;
  font-family: inherit;
}
#dw-emergency-banner.visible { display: block; }

#dw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}
#dw-messages::-webkit-scrollbar { width: 4px; }
#dw-messages::-webkit-scrollbar-track { background: transparent; }
#dw-messages::-webkit-scrollbar-thumb { background: var(--dw-border); border-radius: 2px; }

.dw-msg {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.55;
  font-family: inherit;
  word-break: break-word;
  animation: dwFadeIn 0.2s ease;
}
@keyframes dwFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.dw-msg-assistant {
  background: var(--dw-surface);
  border: 1px solid var(--dw-border);
  color: var(--dw-text);
  border-bottom-left-radius: 4px;
  align-self: flex-start;
}
.dw-msg-user {
  background: var(--dw-primary);
  color: white;
  border-bottom-right-radius: 4px;
  align-self: flex-end;
}
.dw-msg-emergency {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #991B1B;
  align-self: stretch;
  max-width: 100%;
}

.dw-typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
  background: var(--dw-surface);
  border: 1px solid var(--dw-border);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
  width: 56px;
}
.dw-typing span {
  width: 6px; height: 6px;
  background: var(--dw-muted);
  border-radius: 50%;
  animation: dwBounce 1.2s infinite;
}
.dw-typing span:nth-child(2) { animation-delay: 0.15s; }
.dw-typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes dwBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
}

.dw-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 8px;
}
.dw-qr-btn {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--dw-primary);
  background: white;
  color: var(--dw-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  font-weight: 500;
}
.dw-qr-btn:hover { background: var(--dw-primary); color: white; }
.dw-qr-btn:focus-visible { outline: 2px solid var(--dw-primary); outline-offset: 2px; }

.dw-consent {
  padding: 12px 16px;
  background: #F0F9FF;
  border-top: 1px solid var(--dw-border);
  font-size: 12px;
  color: var(--dw-muted);
  font-family: inherit;
}
.dw-consent label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  line-height: 1.5;
}
.dw-consent input[type="checkbox"] { margin-top: 2px; accent-color: var(--dw-primary); }
.dw-consent a { color: var(--dw-primary); }

#dw-input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--dw-border);
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
}
#dw-input {
  flex: 1;
  border: 1.5px solid var(--dw-border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  min-height: 42px;
  max-height: 120px;
  color: var(--dw-text);
  background: white;
  transition: border-color 0.15s;
  line-height: 1.4;
}
#dw-input:focus { outline: none; border-color: var(--dw-primary); }
#dw-input::placeholder { color: var(--dw-muted); }

#dw-send {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: var(--dw-primary);
  border: none;
  color: white;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
}
#dw-send:hover { background: #0369A1; }
#dw-send:active { transform: scale(0.95); }
#dw-send:focus-visible { outline: 2px solid var(--dw-primary); outline-offset: 2px; }
#dw-send:disabled { opacity: 0.5; cursor: not-allowed; }

#dw-turnstile-container { display: none; }
`;

// ─── Widget Class ─────────────────────────────────────────────────────────────

class DentalWidget {
  private config: WidgetConfig;
  private isOpen        = false;
  private isLoading     = false;
  private messages: Message[] = [];
  private turnstileToken: string | null = null;
  private consentGiven  = false;
  private showConsent   = false;

  // DOM
  private container!:  HTMLDivElement;
  private launcher!:   HTMLButtonElement;
  private messagesEl!: HTMLDivElement;
  private inputEl!:    HTMLTextAreaElement;
  private sendBtn!:    HTMLButtonElement;
  private emergencyBanner!: HTMLDivElement;

  constructor(config: WidgetConfig) {
    this.config = config;
  }

  init(): void {
    this.injectStyles();
    this.buildDOM();
    this.attachEvents();
    this.loadTurnstile();

    // Auto-open greeting after 2s on first visit
    if (!sessionStorage.getItem('dw_greeted')) {
      setTimeout(() => this.open(), 2000);
      sessionStorage.setItem('dw_greeted', '1');
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    document.head.appendChild(style);

    // Google Fonts
    const font = document.createElement('link');
    font.rel  = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(font);

    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
  }

  private buildDOM(): void {
    // Launcher button
    this.launcher = document.createElement('button');
    this.launcher.id = 'dw-launcher';
    this.launcher.setAttribute('aria-label', 'Open dental chat assistant');
    this.launcher.setAttribute('aria-haspopup', 'dialog');
    this.launcher.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span id="dw-badge" aria-hidden="true"></span>`;

    // Chat container
    this.container = document.createElement('div');
    this.container.id   = 'dw-container';
    this.container.role = 'dialog';
    this.container.setAttribute('aria-label', `${this.config.clinicName} chat assistant`);
    this.container.setAttribute('aria-modal', 'true');

    this.container.innerHTML = `
      <div id="dw-header">
        <div id="dw-avatar" aria-hidden="true">🦷</div>
        <div id="dw-header-text">
          <h2>${this.config.clinicName}</h2>
          <p>Dental Assistant • Usually replies instantly</p>
        </div>
        <button id="dw-close" aria-label="Close chat">✕</button>
      </div>
      <div id="dw-emergency-banner" role="alert" aria-live="assertive">
        🚨 Emergency detected — see message below for immediate help
      </div>
      <div id="dw-messages" role="log" aria-live="polite" aria-label="Chat messages"></div>
      <div class="dw-quick-replies" id="dw-quick-replies"></div>
      <div class="dw-consent" id="dw-consent" style="display:none">
        <label>
          <input type="checkbox" id="dw-consent-check" aria-describedby="dw-consent-text"/>
          <span id="dw-consent-text">I agree to be contacted about my dental care. <a href="${this.config.apiBase.replace('/api', '')}/privacy" target="_blank" rel="noopener">View Privacy Notice</a>.</span>
        </label>
      </div>
      <div id="dw-input-area">
        <textarea
          id="dw-input"
          placeholder="Type your message..."
          rows="1"
          aria-label="Chat message"
          aria-describedby="dw-send-hint"
          maxlength="2000"
        ></textarea>
        <button id="dw-send" aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div id="dw-turnstile-container"></div>
      <span id="dw-send-hint" class="sr-only">Press Enter or click Send to submit</span>`;

    document.body.appendChild(this.launcher);
    document.body.appendChild(this.container);

    this.messagesEl      = document.getElementById('dw-messages')      as HTMLDivElement;
    this.inputEl         = document.getElementById('dw-input')         as HTMLTextAreaElement;
    this.sendBtn         = document.getElementById('dw-send')          as HTMLButtonElement;
    this.emergencyBanner = document.getElementById('dw-emergency-banner') as HTMLDivElement;
  }

  private attachEvents(): void {
    this.launcher.addEventListener('click', () => this.toggle());
    document.getElementById('dw-close')!.addEventListener('click', () => this.close());

    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.sendMessage();
      }
    });

    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 120)}px`;
    });

    this.sendBtn.addEventListener('click', () => void this.sendMessage());

    // Escape key closes widget
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Trap focus inside widget when open
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = this.container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, input, a[href]',
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  private loadTurnstile(): void {
    const script    = document.createElement('script');
    script.src      = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async    = true;
    script.defer    = true;
    script.onload   = () => {
      (window as unknown as { turnstile: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } }).turnstile.render(
        document.getElementById('dw-turnstile-container')!,
        {
          sitekey: this.config.siteKey,
          size:    'invisible',
          callback: (token: string) => {
            this.turnstileToken = token;
          },
        },
      );
    };
    document.head.appendChild(script);
  }

  private toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  private open(): void {
    this.isOpen = true;
    this.container.classList.add('open');
    this.launcher.setAttribute('aria-expanded', 'true');
    (document.getElementById('dw-badge') as HTMLElement).classList.remove('visible');

    // Send greeting on first open
    if (this.messages.length === 0) {
      void this.sendInitialGreeting();
    }

    setTimeout(() => this.inputEl.focus(), 300);
  }

  private close(): void {
    this.isOpen = false;
    this.container.classList.remove('open');
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.focus();
  }

  private async sendInitialGreeting(): Promise<void> {
    this.setLoading(true);
    try {
      const res = await this.apiCall(' '); // empty trigger
      this.addMessage({ role: 'assistant', content: res.reply, quickReplies: res.quickReplies });
    } catch {
      this.addMessage({ role: 'assistant', content: `Hi! I'm the ${this.config.clinicName} assistant. How can I help you today?` });
    } finally {
      this.setLoading(false);
    }
  }

  private async sendMessage(): Promise<void> {
    const text = this.inputEl.value.trim();
    if (!text || this.isLoading) return;

    // Consent check for personal data steps
    if (this.showConsent && !this.consentGiven) {
      const check = document.getElementById('dw-consent-check') as HTMLInputElement | null;
      if (!check?.checked) {
        alert('Please tick the privacy consent checkbox before continuing.');
        return;
      }
      this.consentGiven = true;
    }

    this.addMessage({ role: 'user', content: text });
    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.clearQuickReplies();

    this.setLoading(true);

    try {
      const res = await this.apiCall(text);

      if (res.isEmergency) {
        this.emergencyBanner.classList.add('visible');
      }

      this.addMessage({
        role:         'assistant',
        content:      res.reply,
        quickReplies: res.quickReplies,
        showConsent:  res.showConsentCheckbox,
      });

      if (res.showConsentCheckbox) {
        this.showConsentBox();
      }
    } catch (err) {
      this.addMessage({
        role:    'assistant',
        content: 'Sorry, something went wrong. Please try again or call us directly.',
      });
    } finally {
      this.setLoading(false);
    }
  }

  private async apiCall(message: string): Promise<{
    reply: string;
    isEmergency: boolean;
    isDone: boolean;
    quickReplies?: string[];
    showConsentCheckbox?: boolean;
  }> {
    const token = this.turnstileToken ?? 'widget-no-token';
    const sourcePage = window.location.pathname;

    const response = await fetch(`${this.config.apiBase}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        sessionId:     SESSION_ID,
        message,
        turnstileToken: token,
        sourcePage,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return response.json() as Promise<{
      reply: string;
      isEmergency: boolean;
      isDone: boolean;
      quickReplies?: string[];
      showConsentCheckbox?: boolean;
    }>;
  }

  private addMessage(msg: Message): void {
    // Remove typing indicator if present
    document.querySelector('.dw-typing')?.remove();

    const el = document.createElement('div');
    el.className = `dw-msg dw-msg-${msg.role}${msg.role === 'assistant' && msg.content.includes('999') ? ' dw-msg-emergency' : ''}`;
    el.textContent = msg.content;

    this.messagesEl.appendChild(el);
    this.messages.push(msg);

    if (msg.quickReplies?.length) {
      this.renderQuickReplies(msg.quickReplies);
    }

    this.scrollToBottom();
  }

  private renderQuickReplies(replies: string[]): void {
    this.clearQuickReplies();
    const container = document.getElementById('dw-quick-replies')!;
    for (const reply of replies) {
      const btn = document.createElement('button');
      btn.className   = 'dw-qr-btn';
      btn.textContent = reply;
      btn.addEventListener('click', () => {
        this.inputEl.value = reply;
        void this.sendMessage();
      });
      container.appendChild(btn);
    }
  }

  private clearQuickReplies(): void {
    const container = document.getElementById('dw-quick-replies')!;
    container.innerHTML = '';
  }

  private showConsentBox(): void {
    this.showConsent = true;
    const box = document.getElementById('dw-consent')!;
    box.style.display = 'block';
  }

  private setLoading(loading: boolean): void {
    this.isLoading     = loading;
    this.sendBtn.disabled = loading;

    if (loading) {
      const typing = document.createElement('div');
      typing.className  = 'dw-typing';
      typing.setAttribute('aria-label', 'Assistant is typing');
      typing.innerHTML  = '<span></span><span></span><span></span>';
      this.messagesEl.appendChild(typing);
      this.scrollToBottom();
    } else {
      document.querySelector('.dw-typing')?.remove();
    }
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }
}

// ─── Initialise ───────────────────────────────────────────────────────────────

function init(): void {
  const script = document.currentScript as HTMLScriptElement | null
    ?? document.querySelector<HTMLScriptElement>('script[data-api]');

  const apiBase     = script?.dataset['api']     ?? 'https://automation.vertexdental.co.uk';
  const siteKey     = script?.dataset['siteKey'] ?? '';
  const clinicName  = script?.dataset['clinic']  ?? 'Vertex Dental Lab';
  const primaryColor = script?.dataset['color']  ?? '#0284C7';

  const widget = new DentalWidget({ apiBase, siteKey, clinicName, primaryColor });
  widget.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export class ChatWidget {
  constructor(options = {}) {
    this.options = {
      endpoint: options.endpoint || window.BM_CHAT_ENDPOINT || 'https://qndilnabfwbhnwvvptgs.supabase.co/functions/v1/chat-gpt5',
      maxHistory: options.maxHistory || 10,
      timeoutMs: options.timeoutMs || 25000,
      storagePrefix: options.storagePrefix || 'bm_chat'
    };

    this.state = {
      isOpen: false,
      isLoading: false,
      sessionId: null,
      visitorId: null,
      messages: []
    };

    this.storage = {
      sessionId: `${this.options.storagePrefix}_session_id`,
      visitorId: `${this.options.storagePrefix}_visitor_id`,
      messages: `${this.options.storagePrefix}_messages`,
      open: `${this.options.storagePrefix}_open`
    };

    this.init();
  }

  init() {
    this.buildUi();
    this.bindEvents();
    this.restoreState();

    if (!this.state.messages.length) {
      this.addMessage('assistant', 'Hey, I can help you find the right growth play, service, or case study. What are you trying to improve right now?');
    }

    this.renderMessages();
    this.updateUi();
  }

  buildUi() {
    this.root = document.createElement('div');
    this.root.className = 'chat-widget';
    this.root.dataset.state = 'closed';

    this.root.innerHTML = `
      <button class="chat-widget__toggle" type="button" aria-expanded="false">
        <span class="chat-widget__toggle-icon" aria-hidden="true"></span>
        <span class="chat-widget__toggle-label">Chat</span>
      </button>
      <div class="chat-widget__panel" role="dialog" aria-label="Bulldozer chat" aria-hidden="true">
        <div class="chat-widget__header">
          <div>
            <div class="chat-widget__title">Bulldozer Chat</div>
            <div class="chat-widget__subtitle">Short answers, clear next steps.</div>
          </div>
          <button class="chat-widget__close" type="button" aria-label="Close chat">X</button>
        </div>
        <div class="chat-widget__messages" aria-live="polite"></div>
        <form class="chat-widget__composer">
          <textarea class="chat-widget__input" rows="1" placeholder="Ask about positioning, acquisition, or onboarding" aria-label="Chat message"></textarea>
          <button class="chat-widget__send" type="submit">Send</button>
        </form>
        <div class="chat-widget__footer">Powered by site context. Ask anything about services, pricing, or process.</div>
      </div>
    `;

    document.body.appendChild(this.root);

    this.toggleButton = this.root.querySelector('.chat-widget__toggle');
    this.panel = this.root.querySelector('.chat-widget__panel');
    this.closeButton = this.root.querySelector('.chat-widget__close');
    this.messagesEl = this.root.querySelector('.chat-widget__messages');
    this.form = this.root.querySelector('.chat-widget__composer');
    this.input = this.root.querySelector('.chat-widget__input');
    this.sendButton = this.root.querySelector('.chat-widget__send');
  }

  bindEvents() {
    this.toggleButton.addEventListener('click', () => this.toggleOpen());
    this.closeButton.addEventListener('click', () => this.setOpen(false));

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit();
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });

    this.input.addEventListener('input', () => this.resizeInput());

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.state.isOpen) {
        this.setOpen(false);
      }
    });
  }

  restoreState() {
    this.state.sessionId = this.safeStorageGet(this.storage.sessionId);
    this.state.visitorId = this.safeStorageGet(this.storage.visitorId);

    if (!this.state.visitorId) {
      this.state.visitorId = this.generateId();
      this.safeStorageSet(this.storage.visitorId, this.state.visitorId);
    }

    const storedMessages = this.safeStorageGet(this.storage.messages);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          this.state.messages = parsed;
        }
      } catch (error) {
        this.state.messages = [];
      }
    }

    const storedOpen = this.safeStorageGet(this.storage.open);
    if (storedOpen === 'true') {
      this.state.isOpen = true;
    }
  }

  updateUi() {
    const isOpen = this.state.isOpen;
    this.root.dataset.state = isOpen ? 'open' : 'closed';
    this.toggleButton.setAttribute('aria-expanded', String(isOpen));
    this.panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
      this.input.focus();
    }
  }

  setOpen(isOpen) {
    this.state.isOpen = isOpen;
    this.safeStorageSet(this.storage.open, String(isOpen));
    this.updateUi();
  }

  toggleOpen() {
    this.setOpen(!this.state.isOpen);
  }

  resizeInput() {
    this.input.style.height = 'auto';
    const nextHeight = Math.min(this.input.scrollHeight, 120);
    this.input.style.height = `${nextHeight}px`;
  }

  addMessage(role, content, options = {}) {
    const message = {
      role,
      content,
      createdAt: new Date().toISOString(),
      sources: options.sources || []
    };
    this.state.messages.push(message);
    this.safeStorageSet(this.storage.messages, JSON.stringify(this.state.messages));
    this.appendMessage(message);
    return message;
  }

  renderMessages() {
    this.messagesEl.innerHTML = '';
    this.state.messages.forEach((message) => this.appendMessage(message));
  }

  appendMessage(message) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-widget__message chat-widget__message--${message.role}`;

    const text = document.createElement('div');
    text.className = 'chat-widget__message-text';
    text.textContent = message.content;
    wrapper.appendChild(text);

    if (message.sources && message.sources.length) {
      const sources = document.createElement('div');
      sources.className = 'chat-widget__sources';
      sources.textContent = 'Sources: ';

      message.sources.slice(0, 2).forEach((source, index) => {
        const link = document.createElement('a');
        link.href = source.url || '#';
        link.textContent = source.title || source.source || `Source ${index + 1}`;
        link.target = '_blank';
        link.rel = 'noopener';
        sources.appendChild(link);
        if (index < Math.min(message.sources.length, 2) - 1) {
          sources.appendChild(document.createTextNode(' | '));
        }
      });

      wrapper.appendChild(sources);
    }

    this.messagesEl.appendChild(wrapper);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  addTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-widget__message chat-widget__message--assistant chat-widget__message--typing';
    wrapper.innerHTML = `
      <div class="chat-widget__typing">
        <span class="chat-widget__typing-dot"></span>
        <span class="chat-widget__typing-dot"></span>
        <span class="chat-widget__typing-dot"></span>
      </div>
    `;
    this.messagesEl.appendChild(wrapper);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    return wrapper;
  }

  async handleSubmit() {
    const content = this.input.value.trim();
    if (!content || this.state.isLoading) {
      return;
    }

    this.input.value = '';
    this.resizeInput();
    this.addMessage('user', content);

    const typingEl = this.addTypingIndicator();
    this.setLoading(true);

    try {
      const payload = this.buildPayload();
      const response = await this.requestChat(payload);
      this.state.sessionId = response.sessionId || this.state.sessionId;
      if (this.state.sessionId) {
        this.safeStorageSet(this.storage.sessionId, this.state.sessionId);
      }

      this.addMessage('assistant', response.reply, { sources: response.sources || [] });
    } catch (error) {
      this.addMessage('assistant', 'Sorry, I hit a snag. Try again or book a quick call and we will help.');
    } finally {
      this.setLoading(false);
      typingEl.remove();
    }
  }

  buildPayload() {
    const metaDescription = document.querySelector('meta[name="description"]');
    const pageData = {
      url: window.location.href,
      title: document.title,
      description: metaDescription ? metaDescription.getAttribute('content') : ''
    };

    const trimmedMessages = this.state.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-this.options.maxHistory)
      .map((message) => ({ role: message.role, content: message.content }));

    return {
      sessionId: this.state.sessionId,
      visitorId: this.state.visitorId,
      messages: trimmedMessages,
      page: pageData,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || ''
    };
  }

  async requestChat(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Chat request failed');
      }
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  setLoading(isLoading) {
    this.state.isLoading = isLoading;
    this.sendButton.disabled = isLoading;
    this.input.disabled = isLoading;
  }

  generateId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `bm_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }

  safeStorageGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  safeStorageSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage errors (private mode or blocked storage).
    }
  }
}

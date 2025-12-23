export class StripeManager {
  constructor() {
    this.form = document.getElementById('checkout-form');
    if (!this.form) return;

    this.paymentElement = document.getElementById('payment-element');
    this.messageEl = document.getElementById('payment-message');
    this.successEl = document.getElementById('checkout-success');
    this.submitBtn = this.form.querySelector('button[type="submit"]');
    this.summaryPlan = document.getElementById('checkout-plan');
    this.summaryAmount = document.getElementById('checkout-amount');

    const envStripeKey = import.meta.env && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY : '';
    const datasetStripeKey = this.form.dataset.stripeKey || '';
    this.publishableKey = !datasetStripeKey || datasetStripeKey.includes('replace_me') ? envStripeKey : datasetStripeKey;

    const envIntentEndpoint = import.meta.env && import.meta.env.VITE_STRIPE_INTENT_ENDPOINT ? import.meta.env.VITE_STRIPE_INTENT_ENDPOINT : '';
    this.intentEndpoint = this.form.dataset.intentEndpoint || envIntentEndpoint || '';
    this.planLabel = this.form.dataset.planLabel || 'One-time payment';
    this.planKey = this.form.dataset.planKey || '';
    this.amount = Number.parseInt(this.form.dataset.amount || '0', 10);
    this.currency = (this.form.dataset.currency || 'usd').toLowerCase();

    this.supabaseKey = import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZGlsbmFiZndiaG53dnZwdGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjUzNDIsImV4cCI6MjA4MTcwMTM0Mn0.nuQ8WoEw3ZFp0j4XuheCziqL4leXAk6gyI6LmpPALuM';

    this.planMap = {
      foundation: { label: 'Foundation', amount: 120000, currency: 'eur' },
      traction: { label: 'Traction Engine', amount: 280000, currency: 'eur' },
      launch: { label: 'Bulldozer Launch System', amount: 550000, currency: 'eur' }
    };

    this.init();
  }

  init() {
    if (!window.Stripe) {
      this.showMessage('Stripe.js failed to load. Please refresh and try again.');
      return;
    }

    if (!this.paymentElement) {
      this.showMessage('Payment element is missing from the page.');
      return;
    }

    if (!this.publishableKey || this.publishableKey.includes('replace_me')) {
      this.showMessage('Stripe publishable key is missing. Update data-stripe-key on the form.');
      return;
    }

    this.applyQueryOverrides();
    this.updateSummary();

    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      this.showMessage('Payment amount is not configured.');
      return;
    }

    this.stripe = window.Stripe(this.publishableKey);
    this.mountElements();

    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit();
    });
  }

  applyQueryOverrides() {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    const amountParam = Number.parseInt(params.get('amount') || '', 10);
    const currencyParam = params.get('currency');

    if (planParam && this.planMap[planParam]) {
      const plan = this.planMap[planParam];
      this.planKey = planParam;
      this.planLabel = plan.label;
      this.amount = plan.amount;
      this.currency = plan.currency;
    }

    if (Number.isFinite(amountParam)) {
      this.amount = amountParam;
    }

    if (currencyParam) {
      this.currency = currencyParam.toLowerCase();
    }
  }

  updateSummary() {
    if (this.summaryPlan) this.summaryPlan.textContent = this.planLabel;
    if (this.summaryAmount) {
      this.summaryAmount.textContent = this.formatAmount(this.amount, this.currency);
    }
  }

  async mountElements() {
    this.setLoading(true);

    try {
      const intent = await this.createPaymentIntent();
      const appearance = {
        theme: 'flat',
        variables: {
          colorPrimary: '#F59E0B',
          colorText: '#111827',
          colorBackground: '#FFFFFF',
          colorDanger: '#EF4444',
          fontFamily: 'Inter, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px'
        }
      };

      this.elements = this.stripe.elements({ clientSecret: intent.clientSecret, appearance });
      const paymentElement = this.elements.create('payment');
      paymentElement.mount(this.paymentElement);

      await this.checkStatus();
      this.setLoading(false);
    } catch (error) {
      this.showMessage(error.message || 'Unable to initialize payment.');
      this.setLoading(false);
    }
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements) return;

    this.setLoading(true);
    this.showMessage('');

    const returnUrl = this.getReturnUrl();
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required'
    });

    if (result.error) {
      this.showMessage(result.error.message || 'Payment failed. Try again.');
      this.setLoading(false);
      return;
    }

    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      this.showSuccess();
      this.setLoading(false);
      return;
    }

    this.setLoading(false);
  }

  async checkStatus() {
    const params = new URLSearchParams(window.location.search);
    const clientSecret = params.get('payment_intent_client_secret');
    if (!clientSecret || !this.stripe) return;

    const { paymentIntent } = await this.stripe.retrievePaymentIntent(clientSecret);
    if (!paymentIntent) return;

    if (paymentIntent.status === 'succeeded') {
      this.showSuccess();
    } else if (paymentIntent.status === 'processing') {
      this.showMessage('Payment processing. We will update you shortly.');
    } else if (paymentIntent.status === 'requires_payment_method') {
      this.showMessage('Payment failed. Please try another method.');
    }
  }

  async createPaymentIntent() {
    if (!this.intentEndpoint) {
      throw new Error('Payment endpoint is not configured.');
    }

    const response = await fetch(this.intentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.supabaseKey,
        Authorization: `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        plan: this.planKey,
        amount: this.amount,
        currency: this.currency,
        description: this.planLabel
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error || 'Unable to create payment intent.';
      throw new Error(message);
    }

    return data;
  }

  showMessage(message) {
    if (this.messageEl) {
      this.messageEl.textContent = message;
    }
  }

  showSuccess() {
    if (this.form) this.form.style.display = 'none';
    if (this.successEl) this.successEl.hidden = false;
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.disabled = isLoading;
    this.submitBtn.textContent = isLoading ? 'Processing...' : 'Pay now';
  }

  getReturnUrl() {
    if (this.form.dataset.returnUrl) {
      return this.form.dataset.returnUrl;
    }
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const plan = params.get('plan');
    const amount = params.get('amount');
    const currency = params.get('currency');
    url.search = '';
    if (plan) url.searchParams.set('plan', plan);
    if (amount) url.searchParams.set('amount', amount);
    if (currency) url.searchParams.set('currency', currency);
    return url.toString();
  }

  formatAmount(amount, currency) {
    const normalized = Number.isFinite(amount) ? amount / 100 : 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
      }).format(normalized);
    } catch (error) {
      return `${normalized.toFixed(2)} ${currency.toUpperCase()}`;
    }
  }
}

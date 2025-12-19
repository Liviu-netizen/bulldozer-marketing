
export class SupabaseManager {
  constructor() {
    // We use the global 'supabase' object provided by the CDN script
    // Variables are hardcoded here for the static site since we can't process .env at runtime without a bundler like Vite/Webpack properly configured for process.env replacement in browser
    // But since these are PUBLIC keys, it is safe to expose them.
    const supabaseUrl = 'https://qndilnabfwbhnwvvptgs.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZGlsbmFiZndiaG53dnZwdGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjUzNDIsImV4cCI6MjA4MTcwMTM0Mn0.nuQ8WoEw3ZFp0j4XuheCziqL4leXAk6gyI6LmpPALuM';
    
    if (window.supabase) {
      this.client = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase initialized');
    } else {
      console.error('Supabase library not loaded');
    }

    this.init();
  }

  init() {
    this.bindBookingForm();
    this.bindScorecardForm();
  }

  bindBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBookingSubmit(form);
    });
  }

  bindScorecardForm() {
    const form = document.querySelector('.scorecard-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleScorecardSubmit(form);
    });
  }

  async handleBookingSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    submitBtn.textContent = 'Booking...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        company_url: formData.get('url'),
        preferred_date: formData.get('date'), // Note: Ensure DB column is timestamp
        notes: formData.get('notes')
      };

      console.log('Submitting booking:', data);

      const { error } = await this.client
        .from('bookings')
        .insert([data]);

      if (error) throw error;

      this.showSuccess(form, 'Booking Request');

    } catch (error) {
      console.error('Supabase Error:', error);
      alert('Failed to submit booking. Please try again.');
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  }

  async handleScorecardSubmit(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const data = {
        name: formData.get('name') || document.getElementById('name').value, // Fallback if IDs clash
        email: formData.get('email') || document.getElementById('email').value,
        company_url: formData.get('url') || document.getElementById('url').value,
        arr_range: document.getElementById('arr').value,
        saas_motion: document.getElementById('motion').value,
        bottleneck: document.getElementById('bottleneck').value
      };

      // Basic validation for select fields
      if (data.arr_range.includes('Select') || data.saas_motion.includes('Select') || data.bottleneck.includes('Select')) {
         alert('Please select all dropdown options.');
         throw new Error('Validation failed');
      }

      console.log('Submitting scorecard:', data);

      const { error } = await this.client
        .from('scorecards')
        .insert([data]);

      if (error) throw error;

      this.showSuccess(form, 'Scorecard Request');

    } catch (error) {
      console.error('Supabase Error:', error);
      if (error.message !== 'Validation failed') {
        alert('Failed to submit scorecard. Please try again.');
      }
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  }

  showSuccess(form, type) {
    const parent = form.parentElement;
    const successMsg = document.createElement('div');
    successMsg.className = 'form-success-message';
    
    if (type === 'Booking Request') {
      successMsg.innerHTML = `
        <div class="success-icon">✅</div>
        <h3>Request Received!</h3>
        <p>Your booking request has been securely stored. We'll be in touch shortly.</p>
      `;
    } else {
      successMsg.innerHTML = `
        <div class="success-icon">✅</div>
        <h3>Scorecard Requested!</h3>
        <p>Your data has been received. We'll analyze your SaaS and send your custom scorecard within 48 hours.</p>
      `;
    }

    form.style.display = 'none';
    parent.appendChild(successMsg);
  }
}

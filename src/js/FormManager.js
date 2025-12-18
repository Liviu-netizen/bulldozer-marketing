export class FormManager {
  constructor() {
    // REPLACE THESE WITH YOUR ACTUAL EMAILJS KEYS
    // Sign up at https://www.emailjs.com/
    this.publicKey = 'TVqnNUDOdoFQhYEZf'; 
    this.serviceId = 'service_5cc65dx';
    this.templateId = 'template_j7kz95p';

    this.init();
  }

  init() {
    // Wait for EmailJS to load if not available immediately
    if (window.emailjs) {
      this.initEmailJS();
    } else {
      console.warn('EmailJS not loaded yet, waiting...');
      const checkInterval = setInterval(() => {
        if (window.emailjs) {
          clearInterval(checkInterval);
          this.initEmailJS();
        }
      }, 500);
      
      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    this.bindBookingForm();
    this.bindScorecardForm();
  }

  initEmailJS() {
    try {
      emailjs.init(this.publicKey);
      console.log('FormManager initialized and EmailJS ready');
    } catch (e) {
      console.error('Failed to initialize EmailJS:', e);
    }
  }

  bindBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, 'Booking Request');
    });
  }

  bindScorecardForm() {
    const form = document.querySelector('.scorecard-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, 'Scorecard Request');
    });
  }

  async handleSubmit(form, type) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      // Gather form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Add type to data
      data.form_type = type;

      console.log('Attempting to send email with data:', data);
      console.log('Service ID:', this.serviceId);
      console.log('Template ID:', this.templateId);
      console.log('Public Key:', this.publicKey);

      // Send email explicitly using window.emailjs to ensure global scope access
      const response = await window.emailjs.send(this.serviceId, this.templateId, data);
      console.log('EmailJS Success:', response);

      // Show success
      this.showSuccess(form, type);

    } catch (error) {
      console.error('EmailJS Error:', error);
      
      let errorMessage = 'Failed to send request.';
      if (error.text) {
        errorMessage += ` Details: ${error.text}`;
      } else if (error.message) {
        errorMessage += ` Details: ${error.message}`;
      }
      
      alert(errorMessage + '\n\nPlease check your EmailJS Service ID and Template ID.');
      
      // Reset button
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
        <p>Thanks for booking a growth call. We'll be in touch shortly to confirm the time.</p>
      `;
    } else {
      successMsg.innerHTML = `
        <div class="success-icon">✅</div>
        <h3>Scorecard Requested!</h3>
        <p>We'll analyze your SaaS and send your custom scorecard within 48 hours.</p>
      `;
    }

    // Replace form with success message
    form.style.display = 'none';
    parent.appendChild(successMsg);
  }
}

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
    // Initialize EmailJS
    if (window.emailjs) {
      emailjs.init(this.publicKey);
    } else {
      console.error('EmailJS script not loaded');
      return;
    }

    this.bindBookingForm();
    this.bindScorecardForm();
    console.log('FormManager initialized');
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

      // Send email
      // Note: You need to create a template in EmailJS that uses these variable names
      // e.g. {{name}}, {{email}}, {{url}}, {{form_type}}, etc.
      await emailjs.send(this.serviceId, this.templateId, data);

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

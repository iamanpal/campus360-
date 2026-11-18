/* ==========================================================================
   CAMPUS 360 - CONTACT PAGE JAVASCRIPT (PHASE 2 BACKEND CONNECTED)
   Form Submission API Integration (POST /api/contact)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const alertSuccess = document.getElementById('alertSuccess');
  const alertError = document.getElementById('alertError');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset alert states
      if (alertSuccess) alertSuccess.style.display = 'none';
      if (alertError) alertError.style.display = 'none';

      // Read form inputs specified in SRS
      const name = document.getElementById('contactName')?.value.trim();
      const email = document.getElementById('contactEmail')?.value.trim();
      const phone = document.getElementById('contactPhone')?.value.trim();
      const subject = document.getElementById('contactSubject')?.value.trim();
      const message = document.getElementById('contactMessage')?.value.trim();

      // Client-side validation
      if (!name || !email || !subject || !message) {
        if (alertError) {
          alertError.textContent = 'Please fill out all required fields (Name, Email, Subject, and Message).';
          alertError.style.display = 'block';
        }
        return;
      }

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (alertError) {
          alertError.textContent = 'Please provide a valid email address.';
          alertError.style.display = 'block';
        }
        return;
      }

      try {
        // Submit payload to backend REST API
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, phone, subject, message })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (alertSuccess) {
            alertSuccess.innerHTML = `<strong>Success!</strong> ${result.message}`;
            alertSuccess.style.display = 'block';
          }
          contactForm.reset();
        } else {
          if (alertError) {
            alertError.textContent = result.message || 'Error submitting message. Please try again.';
            alertError.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('Network/Server error when submitting contact form:', error);
        if (alertError) {
          alertError.textContent = 'Server connection issue. Please check your network or try again later.';
          alertError.style.display = 'block';
        }
      }
    });
  }
});

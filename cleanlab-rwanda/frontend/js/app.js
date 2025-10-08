// ---- 4. ENHANCED BOOKING FORM WITH SECURITY CODE ----
const bookingForm = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');

if (bookingForm && submitBtn) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Set loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Creating Booking...';

    const formData = {
      name: bookingForm.name.value.trim(),
      contact: bookingForm.contact.value.trim(),
      service_type: bookingForm.service_type.value,
      date_time: bookingForm.date_time.value,
      address: bookingForm.address.value.trim(),
      notes: bookingForm.notes.value.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Server responded with error');
      }

      if (data.success) {
        // Enhanced success message with security code emphasis
        const successMessage = `
          ✅ BOOKING CONFIRMED!
          
          Thank you, ${formData.name}!
          
          🔒 YOUR SECURITY CODE: ${data.bookingCode}
          
          Please save this code to:
          • Track your booking status
          • Update booking details
          • Cancel if needed
          
          You can manage your booking at: Find My Booking page
        `;
        alert(successMessage);
        bookingForm.reset();
        
        // Optional: Auto-redirect to find booking page
        setTimeout(() => {
          window.location.href = 'find-booking.html';
        }, 3000);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ ' + error.message);
    } finally {
      // Reset button state
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.innerText = originalText;
    }
  });
}

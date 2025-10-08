const API_BASE_URL = 'http://localhost:3000/api';

// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');

if (mobileMenuBtn && mainNav) {
  mobileMenuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
  });
}

// DOM Elements
const findBookingForm = document.getElementById('findBookingForm');
const findBtn = document.getElementById('findBtn');
const bookingDetails = document.getElementById('bookingDetails');
const detailsContent = document.getElementById('detailsContent');
const updateBookingForm = document.getElementById('updateBookingForm');
const editBtn = document.getElementById('editBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const cancelBtn = document.getElementById('cancelBtn');
const printBtn = document.getElementById('printBtn');
const noBookingFound = document.getElementById('noBookingFound');

let currentBooking = null;

// Find Booking Form
if (findBookingForm) {
  findBookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingCode = document.getElementById('booking_code').value.trim().toUpperCase();
    
    if (!bookingCode) {
      alert('Please enter your security code');
      return;
    }

    await findBookingByCode(bookingCode);
  });
}

async function findBookingByCode(bookingCode) {
  // Set loading state
  findBtn.classList.add('btn-loading');
  findBtn.disabled = true;
  const originalText = findBtn.innerText;
  findBtn.innerText = 'Searching...';

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingCode}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to find booking');
    }

    if (data.success) {
      currentBooking = data.data;
      displayBookingDetails(currentBooking);
      hideNoBookingFound();
    } else {
      throw new Error(data.message || 'Booking not found');
    }
  } catch (error) {
    console.error('Error:', error);
    showNoBookingFound();
    hideBookingDetails();
  } finally {
    findBtn.classList.remove('btn-loading');
    findBtn.disabled = false;
    findBtn.innerText = originalText;
  }
}

function displayBookingDetails(booking) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const bookingDate = new Date(booking.preferred_datetime).toLocaleDateString('en-US', options);
  const createdDate = new Date(booking.created_at).toLocaleDateString('en-US', options);

  detailsContent.innerHTML = `
    <div style="display: grid; gap: 12px; font-size: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
        <div><strong>Security Code:</strong></div>
        <div style="color: var(--primary); font-weight: bold; font-size: 1.2rem; font-family: monospace; background: #e3f2fd; padding: 5px 10px; border-radius: 4px;">${booking.booking_code}</div>
      </div>
      <div><strong>Customer Name:</strong> ${booking.name}</div>
      <div><strong>Contact:</strong> ${booking.contact}</div>
      <div><strong>Service Type:</strong> ${booking.service_type}</div>
      <div><strong>Preferred Date & Time:</strong> ${bookingDate}</div>
      <div><strong>Address:</strong> ${booking.address}</div>
      <div><strong>Status:</strong> <span style="color: ${getStatusColor(booking.status)}; font-weight: bold;">${booking.status.toUpperCase()}</span></div>
      <div><strong>Booking Created:</strong> ${createdDate}</div>
      ${booking.notes ? `<div><strong>Notes:</strong> ${booking.notes}</div>` : ''}
    </div>
  `;

  // Populate edit form
  document.getElementById('edit_service_type').value = booking.service_type;
  document.getElementById('edit_date_time').value = formatDateTimeForInput(booking.preferred_datetime);
  document.getElementById('edit_address').value = booking.address;
  document.getElementById('edit_notes').value = booking.notes || '';

  // Show/hide action buttons based on status
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
  } else {
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
  }

  bookingDetails.style.display = 'block';
  updateBookingForm.style.display = 'none';
}

function hideBookingDetails() {
  bookingDetails.style.display = 'none';
  updateBookingForm.style.display = 'none';
}

function showNoBookingFound() {
  noBookingFound.style.display = 'block';
}

function hideNoBookingFound() {
  noBookingFound.style.display = 'none';
}

function getStatusColor(status) {
  const colors = {
    'pending': '#ff9800',
    'confirmed': '#4caf50',
    'in-progress': '#2196f3',
    'completed': '#607d8b',
    'cancelled': '#f44336'
  };
  return colors[status] || '#666';
}

function formatDateTimeForInput(datetimeString) {
  const date = new Date(datetimeString);
  return date.toISOString().slice(0, 16);
}

// Edit Booking Functionality
if (editBtn) {
  editBtn.addEventListener('click', () => {
    bookingDetails.style.display = 'none';
    updateBookingForm.style.display = 'block';
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
    bookingDetails.style.display = 'block';
    updateBookingForm.style.display = 'none';
  });
}

// Update Booking Form
if (updateBookingForm) {
  updateBookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updateBtn = document.getElementById('updateBtn');

    const formData = {
      service_type: document.getElementById('edit_service_type').value,
      date_time: document.getElementById('edit_date_time').value,
      address: document.getElementById('edit_address').value.trim(),
      notes: document.getElementById('edit_notes').value.trim()
    };

    // Set loading state
    updateBtn.classList.add('btn-loading');
    updateBtn.disabled = true;
    const originalText = updateBtn.innerText;
    updateBtn.innerText = 'Updating...';

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${currentBooking.booking_code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update booking');
      }

      if (data.success) {
        alert('✅ ' + data.message);
        // Refresh the booking details
        await findBookingByCode(currentBooking.booking_code);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ ' + error.message);
    } finally {
      updateBtn.classList.remove('btn-loading');
      updateBtn.disabled = false;
      updateBtn.innerText = originalText;
    }
  });
}

// Cancel Booking Functionality
if (cancelBtn) {
  cancelBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    cancelBtn.classList.add('btn-loading');
    cancelBtn.disabled = true;
    const originalText = cancelBtn.innerText;
    cancelBtn.innerText = 'Cancelling...';

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${currentBooking.booking_code}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel booking');
      }

      if (data.success) {
        alert('✅ ' + data.message);
        // Refresh the booking details
        await findBookingByCode(currentBooking.booking_code);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ ' + error.message);
    } finally {
      cancelBtn.classList.remove('btn-loading');
      cancelBtn.disabled = false;
      cancelBtn.innerText = originalText;
    }
  });
}

// Print Booking Details
if (printBtn) {
  printBtn.addEventListener('click', () => {
    const printContent = `
      <html>
        <head>
          <title>Booking Details - ${currentBooking.booking_code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin: 20px 0; }
            .detail-item { margin: 10px 0; }
            .security-code { font-size: 1.5em; font-weight: bold; color: #004aad; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Clean LAB Rwanda</h1>
            <h2>Booking Confirmation</h2>
          </div>
          <div class="details">
            <div class="detail-item"><strong>Security Code:</strong> <span class="security-code">${currentBooking.booking_code}</span></div>
            <div class="detail-item"><strong>Customer Name:</strong> ${currentBooking.name}</div>
            <div class="detail-item"><strong>Service Type:</strong> ${currentBooking.service_type}</div>
            <div class="detail-item"><strong>Date & Time:</strong> ${new Date(currentBooking.preferred_datetime).toLocaleString()}</div>
            <div class="detail-item"><strong>Address:</strong> ${currentBooking.address}</div>
            <div class="detail-item"><strong>Status:</strong> ${currentBooking.status}</div>
            <div class="detail-item"><strong>Contact:</strong> ${currentBooking.contact}</div>
            ${currentBooking.notes ? `<div class="detail-item"><strong>Notes:</strong> ${currentBooking.notes}</div>` : ''}
          </div>
          <div style="margin-top: 40px; font-size: 0.9em; color: #666;">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  });
}

// Auto-focus on booking code input
document.addEventListener('DOMContentLoaded', () => {
  const bookingCodeInput = document.getElementById('booking_code');
  if (bookingCodeInput) {
    bookingCodeInput.focus();
  }
});

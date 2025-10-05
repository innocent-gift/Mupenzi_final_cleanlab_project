const API_BASE_URL = 'http://localhost:3000/api';

class BookingManager {
    constructor() {
        this.services = [];
        this.init();
    }

    async init() {
        await this.loadServices();
        this.setupBookingForm();
        this.setMinDate();
        this.checkAuthentication();
    }

    async loadServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/services`);
            const result = await response.json();

            if (result.success) {
                this.services = result.data;
                this.populateServiceSelect();
            } else {
                this.showBookingMessage('Failed to load services', 'error');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.showBookingMessage('Network error loading services', 'error');
        }
    }

    populateServiceSelect() {
        const serviceSelect = document.getElementById('serviceSelect');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Select a service</option>';
            
            this.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = `${service.name} - RWF ${service.base_price}`;
                serviceSelect.appendChild(option);
            });
        }
    }

    setupBookingForm() {
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => this.handleBooking(e));
        }
    }

    async handleBooking(e) {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) {
            this.showBookingMessage('Please login to book a service', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        const formData = new FormData(e.target);
        const bookingData = {
            serviceId: parseInt(formData.get('serviceId')),
            scheduledDate: formData.get('scheduledDate'),
            scheduledTime: formData.get('scheduledTime'),
            address: formData.get('address'),
            specialInstructions: formData.get('specialInstructions')
        };

        // Validate form
        if (!this.validateBookingForm(bookingData)) {
            return;
        }

        try {
            this.showBookingMessage('Processing your booking...', 'info');
            
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (result.success) {
                this.showBookingMessage(
                    `Booking confirmed! Your booking code is: <strong>${result.data.bookingCode}</strong>. 
                    We will contact you shortly. Total: RWF ${result.data.totalAmount}`,
                    'success'
                );
                e.target.reset();
            } else {
                this.showBookingMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Booking error:', error);
            this.showBookingMessage('Network error. Please try again.', 'error');
        }
    }

    validateBookingForm(data) {
        if (!data.serviceId || !data.scheduledDate || !data.scheduledTime || !data.address) {
            this.showBookingMessage('Please fill in all required fields', 'error');
            return false;
        }

        const selectedDate = new Date(data.scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.showBookingMessage('Please select a future date', 'error');
            return false;
        }

        return true;
    }

    setMinDate() {
        const dateInput = document.getElementById('scheduledDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showBookingMessage('Please login to book services', 'info');
        }
    }

    showBookingMessage(message, type) {
        const resultDiv = document.getElementById('bookingResult');
        if (resultDiv) {
            resultDiv.innerHTML = message;
            resultDiv.className = `result-message ${type}`;
            resultDiv.style.display = 'block';
            
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize booking manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BookingManager();
});

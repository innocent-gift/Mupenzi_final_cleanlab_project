const API_BASE_URL = 'http://localhost:3000/api';

class ServicesManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadServices();
    }

    async loadServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/services`);
            const result = await response.json();

            if (result.success) {
                this.displayServices(result.data);
            } else {
                this.showError('Failed to load services');
            }
        } catch (error) {
            console.error('Error loading services:', error);
            this.showError('Network error loading services');
        }
    }

    displayServices(services) {
        const servicesList = document.getElementById('servicesList');
        if (!servicesList) return;

        servicesList.innerHTML = '';

        // Group services by category
        const categories = {};
        services.forEach(service => {
            if (!categories[service.category]) {
                categories[service.category] = [];
            }
            categories[service.category].push(service);
        });

        // Display services by category
        for (const [category, categoryServices] of Object.entries(categories)) {
            const categorySection = document.createElement('div');
            categorySection.className = 'service-category';
            
            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = this.formatCategoryName(category);
            categoryTitle.style.color = '#2c5aa0';
            categoryTitle.style.marginBottom = '1rem';
            categoryTitle.style.borderBottom = '2px solid #2c5aa0';
            categoryTitle.style.paddingBottom = '0.5rem';
            
            categorySection.appendChild(categoryTitle);

            categoryServices.forEach(service => {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-price">RWF ${service.base_price}</div>
                    <a href="booking.html" class="btn btn-primary">Book Now</a>
                `;
                categorySection.appendChild(serviceItem);
            });

            servicesList.appendChild(categorySection);
        }
    }

    formatCategoryName(category) {
        const names = {
            'laundry': 'Laundry & Dry Cleaning',
            'home_cleaning': 'Home Cleaning Services',
            'garden_cleaning': 'Garden Cleaning & Maintenance',
            'institutional': 'Institutional Services'
        };
        return names[category] || category;
    }

    showError(message) {
        const servicesList = document.getElementById('servicesList');
        if (servicesList) {
            servicesList.innerHTML = `
                <div class="result-message error">
                    ${message}
                </div>
            `;
        }
    }
}

// Initialize services manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ServicesManager();
});

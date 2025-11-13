// Tabs functionality
const tabsModule = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    },

    switchTab(tabId) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Activate selected button
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }

        // Refresh the content if needed
        this.refreshTabContent(tabId);
    },

    refreshTabContent(tabId) {
        switch(tabId) {
            case 'contractors-tab':
                if (typeof adminModule !== 'undefined') {
                    adminModule.renderDashboard();
                }
                break;
            case 'categories-tab':
                if (typeof adminCategoriesModule !== 'undefined') {
                    adminCategoriesModule.renderCategories();
                }
                break;
            case 'reviews-tab':
                if (typeof adminReviewsModule !== 'undefined') {
                    adminReviewsModule.renderReviews();
                }
                break;
        }
    },

    getActiveTab() {
        const activeTab = document.querySelector('.tab-content.active');
        return activeTab ? activeTab.id : null;
    }
};
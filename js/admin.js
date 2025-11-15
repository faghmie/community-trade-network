// Modern Admin Dashboard with Authentication
const adminModule = {
    authManager: null,
    sessionInterval: null,
    modulesInitialized: false,

    init() {
        this.initializeAuthentication();
    },

    async initializeAuthentication() {
        try {
            // Import auth manager
            const authModule = await import('./modules/auth.js');
            this.authManager = authModule.default;
            
            // Check authentication status
            if (this.authManager.isLoggedIn()) {
                await this.showAdminContent();
                this.startSessionMonitoring();
            } else {
                this.showLoginForm();
                this.bindAuthEvents();
            }
        } catch (error) {
            console.error('Error loading authentication module:', error);
            this.showLoginForm();
            this.bindAuthEvents();
        }
    },

    showLoginForm() {
        const loginSection = document.getElementById('loginSection');
        const adminContent = document.getElementById('adminContent');
        if (loginSection) loginSection.style.display = 'flex';
        if (adminContent) adminContent.style.display = 'none';
    },

    async showAdminContent() {
        const loginSection = document.getElementById('loginSection');
        const adminContent = document.getElementById('adminContent');
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        
        this.updateUserInfo();
        
        // Initialize admin modules after authentication
        if (!this.modulesInitialized) {
            await this.initializeAdminModules();
            this.modulesInitialized = true;
        }
        
        this.bindEvents();
        this.renderDashboard();
    },

    async initializeAdminModules() {
        // Initialize all admin modules
        dataModule.init();
        categoriesModule.init();
        adminContractorsModule.init();
        adminCategoriesModule.init();
        adminReviewsModule.init();
        tabsModule.init();
        
        console.log('✅ All admin modules initialized successfully');
    },

    updateUserInfo() {
        const user = this.authManager.getCurrentUser();
        if (user) {
            const usernameDisplay = document.getElementById('usernameDisplay');
            const userAvatar = document.getElementById('userAvatar');
            
            if (usernameDisplay) {
                usernameDisplay.textContent = user.username;
            }
            if (userAvatar) {
                userAvatar.textContent = user.username.charAt(0).toUpperCase();
            }
            this.updateSessionInfo();
        }
    },

    updateSessionInfo() {
        const expiry = this.authManager.getSessionExpiry();
        if (expiry) {
            const now = new Date().getTime();
            const timeLeft = expiry - now;
            
            if (timeLeft <= 0) {
                this.handleSessionExpired();
                return;
            }
            
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            const sessionInfo = document.getElementById('sessionInfo');
            if (sessionInfo) {
                if (hoursLeft > 0) {
                    sessionInfo.textContent = `Session: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
                } else if (minutesLeft > 0) {
                    sessionInfo.textContent = `Session: ${minutesLeft}m ${secondsLeft}s`;
                } else {
                    sessionInfo.textContent = `Session: ${secondsLeft}s`;
                }
            }
            
            // Show warning if session expiring soon (less than 5 minutes)
            const sessionWarning = document.getElementById('sessionWarning');
            if (sessionWarning) {
                if (timeLeft < 5 * 60 * 1000) { // 5 minutes in milliseconds
                    sessionWarning.style.display = 'block';
                    // Add pulsing animation for last minute
                    if (timeLeft < 60 * 1000) {
                        sessionWarning.style.animation = 'pulse 1s infinite';
                    }
                } else {
                    sessionWarning.style.display = 'none';
                }
            }
        }
    },

    startSessionMonitoring() {
        // Update session info every second for real-time countdown
        this.sessionInterval = setInterval(() => {
            this.updateSessionInfo();
        }, 1000); // Update every second instead of every minute
    },

    handleSessionExpired() {
        clearInterval(this.sessionInterval);
        this.showLoginForm();
        this.showMessage('Session expired. Please login again.', 'error');
    },

    bindAuthEvents() {
        const loginForm = document.getElementById('loginForm');
        const logoutButton = document.getElementById('logoutButton');
        const passwordField = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (passwordField) {
            passwordField.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.handleLogin();
                }
            });
        }
    },

    async handleLogin() {
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const loginButton = document.getElementById('loginButton');
        const loginButtonText = document.getElementById('loginButtonText');
        const loginSpinner = document.getElementById('loginSpinner');

        if (!username || !password || !loginButton || !loginButtonText || !loginSpinner) {
            console.error('Login elements not found');
            return;
        }

        // Show loading state
        loginButton.disabled = true;
        loginButtonText.textContent = 'Logging in...';
        loginSpinner.style.display = 'inline-block';

        try {
            const result = await this.authManager.login(username.value, password.value);
            
            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(async () => {
                    await this.showAdminContent();
                    this.startSessionMonitoring();
                }, 1000);
            } else {
                this.showMessage(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        } finally {
            // Reset loading state
            loginButton.disabled = false;
            loginButtonText.textContent = 'Login';
            loginSpinner.style.display = 'none';
        }
    },

    handleLogout() {
        this.authManager.logout();
        clearInterval(this.sessionInterval);
        this.modulesInitialized = false;
        this.showLoginForm();
        this.showMessage('You have been logged out.', 'info');
        
        // Clear form fields
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        if (username) username.value = '';
        if (password) password.value = '';
    },

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('loginMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `auth-message ${type}`;
            messageElement.style.display = 'block';
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
        }
    },

    bindEvents() {
        console.log('Binding admin events...');
        
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Add Contractor Button
        const addContractorBtn = document.getElementById('addContractorBtn');
        if (addContractorBtn) {
            addContractorBtn.addEventListener('click', () => {
                adminContractorsModule.showContractorForm();
            });
        }

        // Add Category Button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                adminCategoriesModule.showAddCategoryForm();
            });
        }

        // Global search functionality for contractors tab
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                adminContractorsModule.filterContractors(e.target.value);
            });
        }

        // Category search
        const categorySearch = document.getElementById('categorySearch');
        if (categorySearch) {
            categorySearch.addEventListener('input', (e) => {
                adminCategoriesModule.filterCategories(e.target.value);
            });
        }

        // Review search and filters
        const reviewSearch = document.getElementById('reviewSearch');
        if (reviewSearch) {
            reviewSearch.addEventListener('input', () => {
                adminReviewsModule.filterReviews();
            });
        }

        const reviewContractorFilter = document.getElementById('reviewContractorFilter');
        if (reviewContractorFilter) {
            reviewContractorFilter.addEventListener('change', () => {
                adminReviewsModule.filterReviews();
            });
        }

        const reviewStatusFilter = document.getElementById('reviewStatusFilter');
        if (reviewStatusFilter) {
            reviewStatusFilter.addEventListener('change', () => {
                adminReviewsModule.filterReviews();
            });
        }

        console.log('Admin events bound successfully');
    },

    renderDashboard() {
        this.renderStats();
        
        // Render all modules
        adminContractorsModule.renderContractorsTable();
        adminCategoriesModule.renderCategories();
        adminReviewsModule.renderReviews();
    },

    renderStats() {
        const contractors = dataModule.getContractors();
        const totalReviews = contractors.reduce((total, contractor) => 
            total + contractor.reviews.length, 0
        );
        const averageRating = contractors.length > 0 ? 
            contractors.reduce((total, contractor) => total + parseFloat(contractor.rating), 0) / contractors.length : 0;

        const totalCategories = categoriesModule.getCategories().length;
        const reviewStats = dataModule.getReviewStats();

        // Update stats elements
        this.updateElementText('totalContractors', contractors.length);
        this.updateElementText('totalReviews', totalReviews);
        this.updateElementText('averageRating', averageRating.toFixed(1));
        this.updateElementText('totalCategories', totalCategories);
        this.updateElementText('pendingReviews', reviewStats.pendingReviews);
    },

    updateElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },

    // Global method to refresh dashboard stats
    refreshDashboard() {
        this.renderStats();
    },

    // Global method wrappers for HTML onclick handlers
    showContractorForm(contractor = null) {
        adminContractorsModule.showContractorForm(contractor);
    },

    viewContractor(id) {
        adminContractorsModule.viewContractor(id);
    },

    editContractor(id) {
        adminContractorsModule.editContractor(id);
    },

    deleteContractor(id) {
        adminContractorsModule.deleteContractor(id);
    },

    showCategoryForm(category = null) {
        adminCategoriesModule.showAddCategoryForm(category);
    },

    editCategory(categoryName) {
        adminCategoriesModule.editCategory(categoryName);
    },

    deleteCategory(categoryName) {
        adminCategoriesModule.deleteCategory(categoryName);
    },

    approveReview(contractorId, reviewId) {
        adminReviewsModule.approveReview(contractorId, reviewId);
    },

    rejectReview(contractorId, reviewId) {
        adminReviewsModule.rejectReview(contractorId, reviewId);
    },

    deleteReview(contractorId, reviewId) {
        adminReviewsModule.deleteReview(contractorId, reviewId);
    },

    viewReview(contractorId, reviewId) {
        adminReviewsModule.viewReview(contractorId, reviewId);
    },

    filterContractors(searchTerm) {
        adminContractorsModule.filterContractors(searchTerm);
    },

    filterCategories(searchTerm) {
        adminCategoriesModule.filterCategories(searchTerm);
    },

    filterReviews() {
        adminReviewsModule.filterReviews();
    }
};

// Initialize admin when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin page loaded - initializing authentication...');
    adminModule.init();
});
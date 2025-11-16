/**
 * Tabs Module for Admin Dashboard
 * Handles tab switching functionality
 */
class TabsModule {
    constructor() {
        this.currentTab = 'contractors-tab';
        this.tabButtons = [];
        this.tabContents = [];
        this.tabChangeCallbacks = new Map();
    }

    init() {
        this.initializeTabs();
        this.bindEvents();
        console.log('📑 Tabs module initialized');
    }

    initializeTabs() {
        // Get all tab buttons and contents
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Set initial active tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
            this.currentTab = activeTab.id;
        }
    }

    bindEvents() {
        // Add click event listeners to tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        console.log('🔄 Switching to tab:', tabId);

        // Remove active class from all buttons and contents
        this.tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        this.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to current tab button and content
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);

        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
            this.currentTab = tabId;

            // Execute tab change callbacks
            this.executeTabChangeCallbacks(tabId);

            console.log('✅ Tab switched to:', tabId);
        } else {
            console.error('❌ Tab elements not found:', tabId);
        }
    }

    // Register callback for tab changes
    onTabChange(tabId, callback) {
        if (!this.tabChangeCallbacks.has(tabId)) {
            this.tabChangeCallbacks.set(tabId, []);
        }
        this.tabChangeCallbacks.get(tabId).push(callback);
    }

    // Execute callbacks for specific tab
    executeTabChangeCallbacks(tabId) {
        const callbacks = this.tabChangeCallbacks.get(tabId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(tabId);
                } catch (error) {
                    console.error('Error in tab change callback:', error);
                }
            });
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }

    // Public method to programmatically switch tabs
    showTab(tabId) {
        this.switchTab(tabId);
    }

    // Check if specific tab is active
    isTabActive(tabId) {
        return this.currentTab === tabId;
    }
}

export default TabsModule;
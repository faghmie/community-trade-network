// js/app/main.js - Enhanced with integrated navigation history
import { showNotification } from '../modules/notifications.js';
import { FilterManager } from './filterManager.js';
import { MapView } from './views/mapView.js';
import { CategoriesView } from './views/CategoriesView.js';
import { ContractorListView } from './views/contractorListView.js';
import { ContractorEditView } from './views/contractorEditView.js';
import { ContractorView } from './views/contractorView.js';
import { RecommendationEditView } from './views/recommendationEditView.js';
import { FeedbackView } from './views/feedbackView.js';

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.views = {};
        this.currentView = 'categories';
        this.filterManager = null;
        this.filteredContractors = [];

        // SIMPLE navigation history - no globals needed
        this.navigationStack = [];
        this.maxStackSize = 10;

        // Flags to choose between modal and view
        this.useEditView = true;
        this.useRecommendationView = true;
    }

    async init() {
        try {
            await this.dataModule.init();
            await this.createManagers();
            this.setupViews();
            this.setupEventListeners();

            // Initialize navigation with home view
            this.navigationStack.push({ view: 'categories', context: {} });
            this.showView('categories');
            this.updateFavoritesBadge();

            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }

    async createManagers() {
        // Core managers
        this.filterManager = new FilterManager(this.dataModule);
        await this.filterManager.init();
    }

    setupViews() {
        this.views = {
            categories: new CategoriesView(this.dataModule),
            contractors: new ContractorListView(this.dataModule),
            map: new MapView(this.dataModule),
            contractor: new ContractorView(
                this.dataModule,
                this.dataModule.getContractorManager()
            ),
            feedback: new FeedbackView(this.dataModule)
        };

        // Add contractor edit view if enabled
        if (this.useEditView) {
            this.views.contractorEdit = new ContractorEditView(
                this.dataModule,
                this.dataModule.getContractorManager(),
                this.dataModule.getCategoriesModule(),
                this.dataModule.getLocationsData()
            );
        }

        // Add recommendation edit view if enabled
        if (this.useRecommendationView) {
            this.views.recommendationEdit = new RecommendationEditView(
                this.dataModule,
                this.dataModule.getRecommendationDataManager(),
                this.dataModule.getContractorManager()
            );
        }

        Object.values(this.views).forEach(view => view.render());
    }

    setupEventListeners() {
        // Unified event handler for common patterns
        const eventHandlers = {
            'categorySelected': (event) => this.handleCategorySelected(event.detail),
            'filtersChanged': (event) => {
                this.filteredContractors = event.detail.results;
                this.refreshCurrentView();
            },
            'toggleFavorite': (event) => this.handleToggleFavorite(event.detail.contractorId),
            'navigationViewChange': (event) => this.handleNavigation(event.detail),
            'contractorCreated': (event) => this.handleContractorCreated(event.detail),
            'showRecommendationForm': (event) => this.handleShowRecommendationForm(event.detail)
        };

        Object.entries(eventHandlers).forEach(([event, handler]) => {
            document.addEventListener(event, handler);
        });

        // Handle bottom navigation action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                e.preventDefault();
                this.handleAction(button.getAttribute('data-action'));
            }
        });

        // Handle back button from UI
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="back"]') ||
                e.target.closest('[data-action="back"]')) {
                e.preventDefault();
                this.goBack();
            }
        });

        // Setup browser back button handling
        this.setupBackButtonHandling();
    }

    /**
     * Setup browser back button handling
     */
    setupBackButtonHandling() {
        window.addEventListener('popstate', (event) => {
            event.preventDefault();
            this.goBack();
        });

        // Optional: Add physical back button support for mobile
        if (typeof document.addEventListener !== 'undefined') {
            document.addEventListener('backbutton', () => {
                this.goBack();
            }, false);
        }
    }

    /**
     * Enhanced showView with navigation history
     */
    showView(viewName, context = {}, isBackNavigation = false) {
        // Hide all views first
        Object.values(this.views).forEach(view => view.hide());

        // Hide filter panel for all views except search
        this.hideFilterPanel();

        // Update navigation stack (unless it's a back navigation or same view)
        if (!isBackNavigation && viewName !== this.currentView) {
            this.navigationStack.push({
                view: viewName,
                context: context,
                timestamp: Date.now()
            });

            // Limit stack size
            if (this.navigationStack.length > this.maxStackSize) {
                this.navigationStack.shift();
            }
        }

        // Show the target view
        if (this.views[viewName]) {
            this.views[viewName].show();
            this.currentView = viewName;
            this.refreshCurrentView();
        }

        console.log(`📚 Navigation: ${this.navigationStack.map(item => item.view).join(' → ')}`);

        // Dispatch view change event
        document.dispatchEvent(new CustomEvent('viewChanged', {
            detail: {
                view: viewName,
                previousView: this.currentView,
                context: context,
                isBackNavigation: isBackNavigation
            }
        }));
    }

    /**
     * Simple back navigation
     */
    goBack() {
        if (this.navigationStack.length <= 1) {
            // Already at home - go to categories
            this.showView('categories');
            return;
        }

        // Remove current view from stack
        this.navigationStack.pop();

        // Navigate to previous view
        const previous = this.navigationStack[this.navigationStack.length - 1];
        if (previous) {
            this.showView(previous.view, previous.context, true);
        }
    }

    /**
     * Handle action buttons from bottom navigation
     */
    handleAction(action) {
        switch (action) {
            case 'show-feedback':
                this.showView('feedback');
                break;
            case 'add-supplier':
                this.handleAddSupplier();
                break;
            case 'back':
                this.goBack();
                break;
            case 'search-keypress':
                // Handled by FilterManager
                break;
            case 'hide-filters':
            case 'clear-filters':
            case 'apply-filters':
            case 'filter':
            case 'sort':
                // Handled by FilterManager
                break;
            default:
                console.log('Unhandled action:', action);
        }
    }

    /**
     * Enhanced navigation handler
     */
    handleNavigation(detail) {
        const { view, context, isBackNavigation = false } = detail;

        if (isBackNavigation || view === 'back') {
            this.goBack();
            return;
        }

        console.log('🔍 Main App: Navigation event received:', { view, context });

        const navigationActions = {
            home: () => {
                console.log('🔍 Main App: Showing categories view');
                this.showView('categories');
                this.filterManager.clearFilters();
            },
            favorites: () => {
                console.log('🔍 Main App: Showing favorites view');
                this.showView('contractors');
                this.filterManager.applyFavoritesFilter();
            },
            map: () => {
                console.log('🔍 Main App: Showing map view');
                this.showView('map');
            },
            search: () => {
                console.log('🔍 Main App: Handling search view');
                // Show filter panel for search view
                this.showFilterPanel();
            },
            contractorEdit: () => {
                console.log('🔍 Main App: Showing contractor edit view with context:', context);
                // Show contractor edit view with context
                this.showContractorEditView(null, context);
            },
            recommendationEdit: () => {
                console.log('🔍 Main App: Showing recommendation edit view with context:', context);
                // Show recommendation edit view with context
                if (context?.contractorId) {
                    this.showRecommendationEditView(context.contractorId);
                }
            },
            contractor: () => {
                console.log('🔍 Main App: Showing contractor view with context:', context);
                // Show contractor view with context
                if (context?.contractorId) {
                    this.showContractorView(context.contractorId);
                }
            },
            feedback: () => {
                console.log('🔍 Main App: Showing feedback view');
                this.showView('feedback');
            }
        };

        if (navigationActions[view]) {
            navigationActions[view]();
        } else {
            console.warn('⚠️ Main App: Unknown navigation view:', view);
        }
    }

    /**
     * Handle Add Supplier action
     */
    handleAddSupplier() {
        const context = {
            name: this.filterManager?.currentFilters?.search || '',
            location: this.filterManager?.currentFilters?.location || '',
            category: this.filterManager?.currentFilters?.category || ''
        };

        if (this.useEditView) {
            this.showContractorEditView(null, context);
        } else {
            console.warn('Contractor edit modal not available - using view instead');
            this.showContractorEditView(null, context);
        }
    }

    /**
     * Handle recommendation form display
     */
    handleShowRecommendationForm(detail) {
        const { contractorId } = detail;

        if (this.useRecommendationView) {
            this.showRecommendationEditView(contractorId);
        } else {
            console.warn('Recommendation modal not available - using view instead');
            this.showRecommendationEditView(contractorId);
        }
    }

    /**
     * Show contractor edit view
     */
    showContractorEditView(contractor = null, context = null) {
        if (this.views.contractorEdit) {
            this.showView('contractorEdit', context);
            this.views.contractorEdit.show(contractor, context);
        }
    }

    /**
     * Show contractor view
     */
    showContractorView(contractorId = null) {
        if (this.views.contractor) {
            this.showView('contractor', { contractorId });
            this.views.contractor.show(contractorId);
        }
    }

    /**
     * Show recommendation edit view
     */
    showRecommendationEditView(contractorId = null) {
        if (this.views.recommendationEdit) {
            const contractor = contractorId ? this.dataModule.getContractor(contractorId) : null;
            this.showView('recommendationEdit', { contractorId });
            this.views.recommendationEdit.show(contractorId, contractor);
        }
    }

    /**
     * Hide filter panel for all non-search views
     */
    hideFilterPanel() {
        const filtersSheet = document.getElementById('filtersSheet');
        if (filtersSheet && !filtersSheet.classList.contains('hidden')) {
            filtersSheet.classList.add('hidden');
            console.log('🔍 Main App: Hiding filter bottom sheet');
        }

        const emptyStateContainer = document.getElementById('emptyStateContainer');
        if (emptyStateContainer && !emptyStateContainer.classList.contains('hidden')) {
            emptyStateContainer.classList.add('hidden');
            console.log('🔍 Main App: Hiding empty state container');
        }
    }

    /**
     * Show filter panel (only for search view)
     */
    showFilterPanel() {
        const filtersSheet = document.getElementById('filtersSheet');
        if (filtersSheet) {
            filtersSheet.classList.remove('hidden');
            console.log('🔍 Main App: Showing filter bottom sheet');
        }
    }

    refreshCurrentView() {
        const viewActions = {
            categories: () => this.views.categories.renderCategories(),
            contractors: () => this.views.contractors.renderContractors(this.filteredContractors),
            map: () => this.views.map.updateContractors(this.filteredContractors),
            contractorEdit: () => { }, // View handles its own rendering
            recommendationEdit: () => { }, // Recommendation view handles its own rendering
            feedback: () => { } // Feedback view handles its own rendering
        };

        viewActions[this.currentView]?.();
    }

    // Event handlers
    handleCategorySelected(detail) {
        this.showView('contractors', { categoryType: detail.type });
        document.dispatchEvent(new CustomEvent('filterByCategoryType', { detail }));
    }

    async handleToggleFavorite(contractorId) {
        try {
            const success = await this.dataModule.toggleFavorite(contractorId);

            if (success) {
                const contractor = this.dataModule.getContractor(contractorId);
                const isFavorite = this.dataModule.isFavorite(contractorId);
                const action = isFavorite ? 'added to' : 'removed from';

                showNotification(`${contractor?.name || 'Contractor'} ${action} favorites!`, 'success');
                this.updateFavoritesBadge();

                if (this.currentView === 'contractors') {
                    this.views.contractors.refreshFavorites();
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('Error updating favorites', 'error');
        }
    }

    updateFavoritesBadge() {
        const favoritesCount = this.dataModule.getFavoritesCount();
        const favoritesNavItem = document.querySelector('[data-view="favorites"]');
        let badge = favoritesNavItem?.querySelector('.bottom-nav-badge');

        if (favoritesCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'bottom-nav-badge favorites-badge';
                favoritesNavItem.appendChild(badge);
            }
            badge.textContent = favoritesCount;
            badge.classList.remove('hidden');
        } else if (badge) {
            badge.classList.add('hidden');
        }
    }

    handleContractorCreated(contractorData) {
        const { contractor, wasCreated, skipNavigation } = contractorData;

        if (wasCreated && contractor) {
            showNotification(`Successfully added ${contractor.name} to the directory!`, 'success');
            this.filterManager.clearFilters();

            // Only navigate to contractors view if we're not in the recommendation flow
            if (!skipNavigation) {
                this.showView('contractors');

                setTimeout(() => {
                    const contractorCard = document.querySelector(`[data-contractor-id="${contractor.id}"]`);
                    if (contractorCard) {
                        contractorCard.classList.add('new-contractor-highlight');
                        contractorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => contractorCard.classList.remove('new-contractor-highlight'), 3000);
                    }
                }, 500);
            }
        }
    }

    // Global handlers
    setupGlobalHandlers() {
        window.app = this;
    }

    // Filter methods as direct passthroughs
    searchContractors = () => this.filterManager.applyCurrentFilters();
    filterContractors = () => this.filterManager.applyCurrentFilters();
    clearFilters = () => this.filterManager.clearFilters();
    showFavoritesOnly = () => this.filterManager.applyFavoritesFilter();
}

// Make available globally
window.ContractorReviewApp = ContractorReviewApp;
// js/app/main.js - Refactored for simplicity and maintainability
import { showNotification } from '../modules/notifications.js';
import { MapView } from './views/mapView.js';
import { CategoriesView } from './views/CategoriesView.js';
import { ContractorListView } from './views/contractorListView.js';
import { ContractorEditView } from './views/contractorEditView.js';
import { ContractorView } from './views/contractorView.js';
import { RecommendationEditView } from './views/recommendationEditView.js';
import { FeedbackView } from './views/feedbackView.js';
import { SearchView } from './views/searchView.js';
import { ProfileView } from './views/profileView.js';

export class ContractorReviewApp {
    constructor(dataModule) {
        this.dataModule = dataModule;
        this.views = {};
        this.currentView = 'categories';
        this.navigationStack = [];
        this.maxStackSize = 10;
        this.filteredContractors = null;
    }

    async init() {
        try {
            await this.dataModule.init();
            await this.createViews();
            this.setupEventListeners();
            
            this.navigationStack.push({ view: 'categories', context: {} });
            this.showView('categories');
            this.updateFavoritesBadge();

            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('App initialization failed:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }

    async createViews() {
        const { dataModule } = this;
        
        this.views = {
            categories: new CategoriesView(dataModule),
            contractors: new ContractorListView(dataModule),
            map: new MapView(dataModule),
            contractor: new ContractorView(dataModule, dataModule.getContractorManager()),
            feedback: new FeedbackView(dataModule),
            search: new SearchView(dataModule),
            profile: new ProfileView(dataModule),
            contractorEdit: new ContractorEditView(
                dataModule,
                dataModule.getContractorManager(),
                dataModule.getCategoriesModule(),
                dataModule.getLocationsData()
            ),
            recommendationEdit: new RecommendationEditView(
                dataModule,
                dataModule.getRecommendationDataManager(),
                dataModule.getContractorManager()
            )
        };

        // Initialize all views
        Object.values(this.views).forEach(view => view.render?.());
        this.hideAllViews();
    }

    // View Management
    hideAllViews(exceptView = null) {
        Object.entries(this.views).forEach(([name, view]) => {
            if (view?.hide && name !== exceptView) {
                view.hide();
            }
        });
    }

    showView(viewName, context = {}, isBackNavigation = false) {
        console.log(`🔍 Showing view '${viewName}'`, { context, isBackNavigation });

        this.hideAllViews(viewName);

        if (!isBackNavigation && viewName !== this.currentView) {
            this.pushToNavigationStack(viewName, context);
        }

        const view = this.views[viewName];
        if (view) {
            view.show();
            this.currentView = viewName;
            this.refreshViewData(viewName);
        }

        this.updateBottomNavigationForView(viewName);
    }

    pushToNavigationStack(viewName, context) {
        this.navigationStack.push({ 
            view: viewName, 
            context, 
            timestamp: Date.now() 
        });
        
        if (this.navigationStack.length > this.maxStackSize) {
            this.navigationStack.shift();
        }
    }

    refreshViewData(viewName) {
        const refreshActions = {
            categories: () => this.views.categories.refresh?.() || this.views.categories.render?.(),
            contractors: () => this.views.contractors.renderContractors?.(this.filteredContractors),
            map: () => this.views.map.updateContractors?.(this.filteredContractors),
            search: () => !this.views.search?.isApplyingFilters && this.views.search.refresh?.()
        };

        refreshActions[viewName]?.();
    }

    // Navigation
    goBack() {
        if (this.navigationStack.length <= 1) {
            this.showView('categories');
            return;
        }

        this.navigationStack.pop();
        const previous = this.navigationStack[this.navigationStack.length - 1];
        if (previous) {
            this.showView(previous.view, previous.context, true);
        }
    }

    // Event Handling
    setupEventListeners() {
        const events = {
            'categorySelected': (e) => this.onCategorySelected(e.detail),
            'filtersChanged': (e) => this.onFiltersChanged(e.detail),
            'toggleFavorite': (e) => this.onToggleFavorite(e.detail.contractorId),
            'navigationViewChange': (e) => this.onNavigationChange(e.detail),
            'contractorCreated': (e) => this.onContractorCreated(e.detail),
            'showRecommendationForm': (e) => this.onShowRecommendationForm(e.detail),
            'contractorsUpdated': () => this.onContractorsUpdated()
        };

        Object.entries(events).forEach(([event, handler]) => {
            document.addEventListener(event, handler);
        });

        this.setupBottomNavigation();
        this.setupBackButton();
    }

    setupBottomNavigation() {
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) this.handleBottomNavClick(view);
            });
        });
    }

    setupBackButton() {
        window.addEventListener('popstate', (e) => {
            e.preventDefault();
            this.goBack();
        });
    }

    handleBottomNavClick(view) {
        const actions = {
            categories: () => this.showView('categories'),
            search: () => this.showView('search'),
            add: () => this.showContractorEditView(),
            map: () => this.showView('map'),
            profile: () => this.showView('profile')
        };

        actions[view]?.();
        this.updateBottomNavigationActiveState(view);
    }

    updateBottomNavigationActiveState(activeView) {
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            const itemView = item.getAttribute('data-view');
            item.classList.toggle('active', itemView === activeView);
        });
    }

    updateBottomNavigationForView(viewName) {
        const viewToNavMap = {
            categories: 'categories',
            search: 'search',
            contractors: 'categories',
            map: 'map',
            feedback: 'profile',
            profile: 'profile'
        };

        const navView = viewToNavMap[viewName];
        if (navView) this.updateBottomNavigationActiveState(navView);
    }

    // Event Handlers
    onCategorySelected(detail) {
        this.showView('contractors', { categoryType: detail.type });
        this.views.search?.handleCategoryTypeFilter?.(detail.type, detail.categoryNames);
    }

    onFiltersChanged(detail) {
        this.filteredContractors = detail.results;
        this.refreshViewData(this.currentView);
    }

    async onToggleFavorite(contractorId) {
        try {
            const success = await this.dataModule.toggleFavorite(contractorId);
            if (!success) return;

            const contractor = this.dataModule.getContractor(contractorId);
            const isFavorite = this.dataModule.isFavorite(contractorId);
            const action = isFavorite ? 'added to' : 'removed from';

            showNotification(`${contractor?.name || 'Contractor'} ${action} favorites!`, 'success');
            this.updateFavoritesBadge();
            this.refreshFavoritesInViews();

        } catch (error) {
            console.error('Error toggling favorite:', error);
            showNotification('Error updating favorites', 'error');
        }
    }

    refreshFavoritesInViews() {
        const refreshActions = {
            contractors: () => this.views.contractors.refreshFavorites?.(),
            search: () => this.views.search.refresh?.(),
            profile: () => this.views.profile.loadFavorites?.()
        };

        refreshActions[this.currentView]?.();
    }

    onNavigationChange(detail) {
        const { view, context, isBackNavigation = false } = detail;

        if (isBackNavigation || view === 'back') {
            this.goBack();
            return;
        }

        const navigationMap = {
            home: () => this.showView('categories'),
            browse: () => this.showView('categories'),
            favorites: () => this.showFavoritesView(),
            map: () => this.showView('map'),
            search: () => this.showView('search'),
            contractors: () => this.showView('contractors', context),
            contractorEdit: () => this.showContractorEditView(null, context),
            recommendationEdit: () => context?.contractorId && this.showRecommendationEditView(context.contractorId),
            contractor: () => context?.contractorId && this.showContractorView(context.contractorId),
            feedback: () => this.showView('feedback'),
            profile: () => this.showView('profile')
        };

        navigationMap[view]?.() || console.warn('⚠️ Unknown navigation view:', view);
    }

    showFavoritesView() {
        this.showView('contractors');
        this.views.search?.applyFavoritesFilter?.();
    }

    onContractorCreated(detail) {
        const { contractor, wasCreated, skipNavigation } = detail;

        if (wasCreated && contractor) {
            showNotification(`Successfully added ${contractor.name} to the directory!`, 'success');
            document.dispatchEvent(new CustomEvent('contractorsUpdated'));

            if (!skipNavigation) {
                this.navigateToNewContractor(contractor);
            }
        }
    }

    navigateToNewContractor(contractor) {
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

    onShowRecommendationForm(detail) {
        const { contractorId } = detail;
        this.showRecommendationEditView(contractorId);
    }

    onContractorsUpdated() {
        console.log('🔄 Contractors data updated, refreshing current view');
        this.refreshViewData(this.currentView);
        
        if (this.currentView === 'profile') {
            this.views.profile?.loadFavorites?.();
        }
    }

    // Specific View Show Methods
    showContractorEditView(contractor = null, context = null) {
        if (this.views.contractorEdit) {
            this.showView('contractorEdit', context);
            this.views.contractorEdit.show(contractor, context);
        }
    }

    showContractorView(contractorId = null) {
        if (this.views.contractor) {
            this.showView('contractor', { contractorId });
            this.views.contractor.show(contractorId);
        }
    }

    showRecommendationEditView(contractorId = null) {
        if (this.views.recommendationEdit) {
            const contractor = contractorId ? this.dataModule.getContractor(contractorId) : null;
            this.showView('recommendationEdit', { contractorId });
            this.views.recommendationEdit.show(contractorId, contractor);
        }
    }

    // Favorites Management
    updateFavoritesBadge() {
        const favoritesCount = this.dataModule.getFavoritesCount();
        const profileNavItem = document.querySelector('[data-view="profile"]');
        let badge = profileNavItem?.querySelector('.bottom-nav-badge');

        if (favoritesCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'bottom-nav-badge favorites-badge';
                profileNavItem.appendChild(badge);
            }
            badge.textContent = favoritesCount;
            badge.classList.remove('hidden');
        } else if (badge) {
            badge.classList.add('hidden');
        }
    }
}
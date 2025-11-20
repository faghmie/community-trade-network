# 📁 Contractor Review App - Current Project Structure & API Documentation

## 🌐 ROOT FILES - ENTRY POINTS & CONFIGURATION

### **Application Entry Points**
- **`index.html`** - Main consumer PWA with Material Design, bottom navigation, PWA install banner, and contractor browsing interface
- **`admin.html`** - Admin portal for contractor management, review moderation, and category administration
- **`manifest.json`** - PWA manifest with app metadata, icons, and display settings
- **`sw.js`** - Service Worker for offline caching, resource management, and update handling

### **Utility & Setup Files**
- **`generate_password.html`** - SHA-256 password hash generator for admin authentication
- **`generate-icons.html`** - PWA icon asset generator and optimizer
- **`start_server.sh`** - Local development server startup script
- **`postgresql_supabase_setup.sql`** - Supabase database schema and table definitions

### **Documentation**
- **`deployment_decisions.md`** - Technical architecture and deployment strategy documentation
- **`rate-my-contractor-product-requirements.md`** - Original product specifications and feature requirements
- **`change_logs/`** - Development session history and implementation tracking

---

## 🎨 STYLING ARCHITECTURE (`css/`)

### **Base Styles (`css/base/`)**
- **`reset.css`** - CSS normalization and browser consistency reset
- **`variables.css`** - Material Design 3 token system (colors, spacing, typography, elevation)

### **Component Styles (`css/components/`)**
- **`auth.css`** - Authentication forms and login interface styling
- **`bottom-nav.css`** - Mobile-first bottom navigation bar with active states
- **`bottom-sheet.css`** - Modal bottom sheets for filters and actions
- **`buttons.css`** - Material Design button variants with states and interactions
- **`cards.css`** - Contractor card components with hover effects and layouts
- **`contractor-details.css`** - Contractor modal/details view with enhanced Material Design
- **`dashboard.css`** - Dashboard layouts and statistical component styling
- **`forms.css`** - Form controls, validation states, and input styling
- **`map.css`** - Leaflet map container and marker styling
- **`material.css`** - Core Material Design 3 component implementations
- **`modals.css`** - Modal dialog systems and overlay management
- **`notifications.css`** - Toast notifications with sync status and PWA install banner
- **`ratings.css`** - Star rating components with animations and interactive states
- **`review-modal.css`** - Review submission form with category-based ratings
- **`stats-cards.css`** - Statistics cards and mobile chip components
- **`tables.css`** - Data table styling for admin interfaces
- **`tabs.css`** - Tab navigation components and panel management
- **`utilities.css`** - Utility-first CSS classes and helper functions

### **Main Stylesheets**
- **`main.css`** - Primary application stylesheet with component imports
- **`admin.css`** - Admin-specific styling and interface overrides
- **`layout.css`** - Responsive grid systems and layout utilities

---

## 🖼️ PWA ASSETS (`icons/`)
- Complete PWA icon set (72x72 to 512x512) with Material Design styling
- Fallback SVG icons using data URIs for offline reliability

---

## ⚙️ CORE JAVASCRIPT ARCHITECTURE (`js/`)

### **📱 APPLICATION LAYER (`js/app/`)**

#### **Core Application Managers**
- **`main.js`** - Application composition root, module initialization, and dependency injection
- **`uiManager.js`** - Central UI orchestration, rendering coordination, and event delegation
- **`filterManager.js`** - Filter state management, UI rendering, and bottom navigation integration
- **`lazyLoader.js`** - Infinite scrolling implementation and performance optimization
- **`favoritesManager.js`** - Favorites UI state management and interaction handling
- **`statsManager.js`** - Contractor count display and statistics UI updates

#### **Modal System (`js/app/modals/`)**
- **`modalManager.js`** - Modal system orchestration and lifecycle management
- **`contractorModalManager.js`** - Material Design contractor details modal with enhanced layout
- **`reviewModalManager.js`** - Review submission modal with category ratings and validation
- **`baseModalManager.js`** - Legacy modal functionality and base implementations

### **🔧 CORE MODULES (`js/modules/`)**

#### **Data Layer**
- **`data.js`** - Central data orchestrator coordinating all data operations
- **`storage.js`** - Dual persistence layer (localStorage + Supabase) with sync management
- **`contractorManager.js`** - Contractor CRUD operations and business logic
- **`reviewManager.js`** - Review management, statistics calculation, and approval workflows
- **`categories.js`** - Category management with validation and contractor updates
- **`favoritesDataManager.js`** - Favorites data operations and local persistence
- **`statsDataManager.js`** - Statistical calculations and data aggregation

#### **UI Components**
- **`cardManager.js`** - Contractor card rendering, templates, and dynamic updates
- **`mapManager.js`** - Leaflet map integration, marker management, and geolocation
- **`tabs.js`** - Tab navigation functionality and content switching

#### **Authentication & Utilities**
- **`auth.js`** - SHA-256 authentication system for admin access
- **`supabase.js`** - Supabase client configuration, real-time sync, and API operations
- **`notifications.js`** - Enhanced notification system with sync status and PWA integration
- **`validation.js`** - Form validation utilities and input sanitization
- **`utilities.js`** - Helper functions, DOM utilities, and common operations
- **`uuid.js`** - RFC4122 v4 UUID generation for Supabase compatibility

#### **Admin Modules**
- **`admin-auth.js`** - Admin authentication, session management, and access control
- **`admin-contractors.js`** - Contractor management interface with CRUD operations
- **`admin-categories.js`** - Category administration and maintenance interface
- **`admin-reviews.js`** - Review moderation system with approval workflows

#### **PWA & Service Worker**
- **`pwa-install-manager.js`** - PWA installation prompts, banner management, and user engagement
- **`service-worker-manager.js`** - Service worker registration, update detection, and cache management

### **💾 DATA LAYER (`js/data/`)**
- **`defaultData.js`** - Data aggregator for initial application state and sample data
- **`defaultCategories.js`** - Default contractor service categories and metadata
- **`defaultContractors.js`** - Sample contractor data with complete profiles
- **`defaultReviews.js`** - Sample review data with ratings and categories
- **`defaultLocations.js`** - South African provinces, cities, and geographic data

### **🔌 CONFIGURATION**
- **`config/supabase-credentials.js`** - Supabase connection configuration and environment settings

### **🎯 ENTRY POINTS**
- **`js/script.js`** - Main application entry point and initialization sequence
- **`js/admin.js`** - Admin panel controller and module initialization

---

## 📋 EXPOSED METHODS & APIs

### **DataModule (`js/modules/data.js`)**
```javascript
// Core Lifecycle
init(), ensureInitialized()

// Contractor Operations
getContractors(), getContractor(id), searchContractors(...args), getAllLocations()
addContractor(data), updateContractor(id, updates), deleteContractor(id)

// Review Operations  
getAllReviews(), getReviewsForContractor(contractorId), calculateAverageRating(reviews)
searchReviews(...args), addReview(contractorId, data), updateReviewStatus(...args), deleteReview(...args)

// Category Operations
getCategories(), addCategory(name), updateCategory(oldName, newName), deleteCategory(name)
updateContractorCategory(oldCategory, newCategory)

// Favorites Operations
isFavorite(contractorId), getFavorites(), getFavoritesCount(), toggleFavorite(contractorId)
getFavoriteContractors(), searchContractorsWithFavorites(...args), getContractorsByFavoriteStatus()

// Stats Operations
getStats(), getReviewStats()

// Sync Operations
triggerManualSync(), triggerDataPull()

// Utility Methods
formatDate(date), getLocationsData(), debugCategoryLoading()

// Manager Access
getStorage(), getContractorManager(), getReviewManager(), getCategoriesModule()
getFavoritesDataManager(), getStatsManager()
```

### **Storage Module (`js/modules/storage.js`)**
```javascript
// Core Operations
init(supabase), save(key, data, options), load(key, options), remove(key, options), clear(), exists(key)

// Supabase Integration  
isSupabaseAvailable(), syncFromSupabase(key), syncToSupabase(key, data), forceRefreshAll()

// Data Management
mergeReviewsWithLocalPending(remoteReviews), getStats()
```

### **ContractorManager (`js/modules/contractorManager.js`)**
```javascript
// Core Operations
init(storage), save(), getAll(), getById(id), create(contractorData), update(id, updates), delete(id)

// Search & Filter
search(searchTerm, categoryFilter, ratingFilter, locationFilter), getAllLocations()

// Review Cleanup
setReviewManager(reviewManager), cleanupContractorReviews(contractorId)
forceRefreshReviewManager(), waitForSupabaseSync()

// Data Management
generateMapData(location), refresh()
```

### **ReviewManager (`js/modules/reviewManager.js`)**
```javascript
// Core Operations
init(contractorManager, storage), save(), getAllReviews(), getReviewsByContractor(contractorId)
getApprovedReviewsByContractor(contractorId), getPendingReviewsByContractor(contractorId)

// CRUD Operations
addReview(contractorId, reviewData), updateReviewStatus(reviewId, status), deleteReview(reviewId)

// Search & Filter
searchReviews(searchTerm, statusFilter, contractorFilter)

// Stats & Calculations
updateContractorStats(contractorId), updateAllContractorStats(), calculateOverallRating(reviews)
getCategoryAverage(contractorId, category), getPendingReviewsCount()

// Refresh Operations
refresh(), forceRefresh(), debug()
```

### **CategoriesModule (`js/modules/categories.js`)**
```javascript
// Category Operations
init(storage, dataModule), getCategories(), getCategoryByName(name), addCategory(name)
updateCategory(oldName, newName), deleteCategory(name), refresh()

// Validation & Utilities
categoryExists(name), getCategoryCount(), getCategoriesForDropdown()
validateCategoryName(name), getCategoryStats()
```

### **FavoritesDataManager (`js/modules/favoritesDataManager.js`)**
```javascript
// Pure Data Operations
init(storage), toggleFavorite(contractorId), isFavorite(contractorId)
getFavorites(), getFavoritesCount(), refresh()
```

### **StatsDataManager (`js/modules/statsDataManager.js`)**
```javascript
// Data Calculations
init(contractorManager, reviewManager), getStats(), getReviewStats()
```

### **PWAInstallManager (`js/modules/pwa-install-manager.js`)**
```javascript
// Installation Management
init(), showInstallUI(), hideInstallUI(), showInstallPrompt(), installApp()
dismissInstallBanner(), checkIfInstalled(), triggerInstallUI()

// Status & Utilities
canInstall(), getInstallStatus(), resetDismissal(), debugShowBanner()
```

### **ServiceWorkerManager (`js/modules/service-worker-manager.js`)**
```javascript
// Service Worker Management
registerServiceWorker(), checkForUpdates(), unregisterServiceWorker()
// Update Handling
handleUpdateFound(), showUpdateNotification(), skipWaiting()
// Network Status
handleOnline(), handleOffline(), getNetworkStatus()
```

### **UI Manager (`js/app/uiManager.js`)**
```javascript
// Initialization
init(filterManager), setupManagers(), initializeFavoritesSection()

// UI Rendering
renderContractors(contractorsToRender, targetGrid)

// Event Handling
setupCategories(), setupActionHandlers(), setupEventListeners(), handleActionButton(action, button)

// Control
setLazyLoading(enabled), destroy()
```

### **Filter Manager (`js/app/filterManager.js`)**
```javascript
// Filter Operations
applyFilters(filters), applySorting(), clearFilters(), resetToDefault(), applyCurrentFilters()

// UI Management
showFilterPanel(), hideFilterPanel(), toggleFilterPanel(), refreshAllFilters()
refreshCategoryFilter(), refreshLocationFilter()

// Filter State
getActiveFilterCount(), getFilterState(), getCurrentView(), setCurrentView(view)

// Event Management
onFiltersChange(callback), onViewChange(callback), handleAction(action), handleCategoriesUpdated()

// Data Operations
populateLocationFilter(contractors), populateCategoryFilter(contractors)
refreshFilterOptions(contractors), getUniqueLocations(contractors)

// Bottom Navigation
handleBottomNavigation(view, item), updateBottomNavigationActiveState(activeView)
showHomeView(), showFavoritesView(), showSearchView(), showMapView(), showAdminView()
```

### **Contractor Modal Manager (`js/app/modals/contractorModalManager.js`)**
```javascript
// Modal Operations
open(contractorId), close(), destroy(), showModal(), isOpen

// Content Generation
createContractorDetailsHTML(contractor), createMaterialReviewItem(review)
createMaterialRatingItem(label, rating, icon), createContactListItem(icon, label, value, href, external)
createMaterialNoReviewsState()

// Data Processing
getCategoryAverages(contractorId), updateDialogHeader(contractor)
createEnhancedSubtitleHTML(category, rating, reviewCount)

// Event Management
onReviewRequest(callback), onClose(callback), bindModalEvents(), handleKeydown(e)
```

### **Review Modal Manager (`js/app/modals/reviewModalManager.js`)**
```javascript
// Modal Operations
open(contractorId, contractor), close(), destroy(), showModal(), isOpen
openReviewModal(), closeReviewModal()

// Form Management
handleReviewSubmit(), validateForm(), resetForm(), validateReview(reviewData)

// Rating Management
setMaterialRating(rating, type), getRatingText(rating), calculateAndSetOverallRating()
handleMaterialStarClick(star, ratingType), handleStarKeydown(e, star, ratingType)

// Event Management
bindMaterialEvents(), initializeMaterialStarRatings(), initializeFormValidation(), handleKeydown(e)

// Utility Methods
isModalOpen(), getCurrentContractorId(), showFormError(message), showFormSuccess(message)
```

### **Admin Contractors Module (`js/modules/admin-contractors.js`)**
```javascript
// Core Operations
init(), bindEvents(), renderContractorsTable(), showContractorForm(contractor)
handleContractorSubmit(), viewContractor(id), editContractor(id), deleteContractor(id)

// UI Management
renderContractorsTable(filteredContractors), filterContractors(searchTerm)
updateAreaDropdown(province, selectedArea), findProvinceForArea(area)

// Modal Management
closeModal(modalId), createContractorDetailsModal(), fallbackViewContractor(id)
```

### **Admin Reviews Module (`js/modules/admin-reviews.js`)**
```javascript
// Core Operations
init(), bindEvents(), renderReviews(), renderContractorFilter(), renderReviewsList()
renderReviewStats(), filterReviews()

// Review Management
approveReview(reviewId), rejectReview(reviewId), deleteReview(reviewId), viewReview(contractorId, reviewId)

// UI Utilities
getStatusClass(status), getStatusLabel(status), generateStarIcons(rating)
closeModal(modalId), triggerStatsUpdate(), refresh()
```

### **Notifications Module (`js/modules/notifications.js`)**
```javascript
// Core Notifications
showNotification(options, type), dismissNotification(notification), clearAllNotifications()

// Quick Methods
showSuccess(message), showError(message), showWarning(message), showInfo(message)

// Sync Notifications
showSyncNotification(message, status, progress, syncId), showOfflineNotification()
dismissOfflineNotification(), showSyncCompleteNotification(stats), showNetworkStatusNotification(isOnline)

// Management
getNotificationStats()
```

### **Supabase Client (`js/modules/supabase.js`)**
```javascript
// Core Operations
init(credentials), isInitialized(), getAllContractors(), getAllReviews(), getAllCategories()

// CRUD Operations
saveContractor(contractor), saveReview(review), saveCategory(category)

// Status & Sync
getStatus(), hasPendingSync, syncAllData()
```

---

## 🔄 DATA FLOW ARCHITECTURE

### **Storage Strategy**
- **Local-first with Supabase sync** for shared data (contractors, reviews, categories)
- **Local-only** for user-specific data (favorites, PWA installation state)
- **Smart merge** preserving local pending reviews during Supabase sync
- **Force refresh** capabilities for manual synchronization

### **Manager Hierarchy**
```
Main App (script.js/admin.js)
    ↓
DataModule (data.js) - Data Orchestration
    ├── Storage (storage.js) - Persistence Layer
    ├── ContractorManager - Contractor Operations
    ├── ReviewManager - Review Operations  
    ├── CategoriesModule - Category Operations
    ├── FavoritesDataManager - Favorites Operations
    ├── StatsDataManager - Statistics Calculations
    ├── PWAInstallManager - Installation Management
    └── ServiceWorkerManager - Update & Cache Management
        ↓
UIManager (UI Orchestration)
    ├── FilterManager (Filter UI & Logic)
    ├── StatsManager (Contractor Count UI)
    ├── FavoritesManager (Favorites UI)
    ├── ModalManager (Modal Coordination)
    └── CardManager (Card Rendering)
```

### **Distribution Strategy**
- **Supabase as source of truth** for shared contractor and review data
- **Local pending reviews preserved** during sync operations
- **Automatic cleanup** of orphaned reviews for deleted contractors
- **Event-driven updates** for real-time UI refresh and state consistency

This architecture provides a robust foundation for a production-ready contractor review PWA with offline capabilities, real-time sync, and comprehensive administrative controls.
# 📁 Contractor Review App - Current Project Structure

## 🌐 ROOT FILES - ENTRY POINTS & CONFIGURATION

### **Application Entry Points**
- **`index.html`** - Main consumer application with Material Design & PWA, featuring bottom navigation for mobile
- **`admin.html`** - Admin portal for contractor and review management  
- **`manifest.json`** - PWA configuration (icons, theme, display settings)
- **`sw.js`** - Service Worker for offline functionality and caching

### **Utility & Setup Files**
- **`generate_password.html`** - Utility for creating SHA-256 password hashes
- **`generate-icons.html`** - Icon generator for PWA assets
- **`start_server.sh`** - Bash script to start local development server
- **`postgresql_supabase_setup.sql`** - Database schema for Supabase backend

### **Documentation**
- **`deployment_decisions.md`** - Architecture and deployment choices
- **`rate-my-contractor-product-requirements.md`** - Original project requirements
- **`change_logs/`** - Detailed development session records

---

## 🎨 STYLING ARCHITECTURE (`css/`)

### **Base Styles (`css/base/`)**
- **`reset.css`** - CSS reset and normalization
- **`variables.css`** - Material Design color system, spacing, typography, and design tokens

### **Component Styles (`css/components/`)**
- **`auth.css`** - Authentication form styling
- **`bottom-nav.css`** - Mobile bottom navigation styles
- **`bottom-sheet.css`** - Modal bottom sheet for filters
- **`buttons.css`** - Button variants and interactive states
- **`cards.css`** - Contractor card and material card styles
- **`contractor-details.css`** - Contractor modal/details view styling
- **`dashboard.css`** - Dashboard layout and components
- **`forms.css`** - Form elements and validation styling
- **`map.css`** - Leaflet map integration styles
- **`material.css`** - Material Design component implementations
- **`modals.css`** - Modal dialog and overlay styles
- **`notifications.css`** - Enhanced notification system with sync status support
- **`ratings.css`** - Star rating components and animations
- **`stats-cards.css`** - Statistics card components with mobile chips
- **`tables.css`** - Data table styling
- **`tabs.css`** - Tab navigation components
- **`utilities.css`** - Pure utility classes and helpers

### **Main Stylesheets**
- **`main.css`** - Primary application styles and imports
- **`admin.css`** - Admin-specific styling
- **`layout.css`** - Responsive grid and layout systems

---

## 🖼️ PWA ASSETS (`icons/`)
- Complete PWA icon set (72x72 to 512x512) for all device sizes
- Professional design with blue theme and star icon

---

## ⚙️ CORE JAVASCRIPT ARCHITECTURE (`js/`)

### **📱 APPLICATION LAYER (`js/app/`)**

#### **Core Application Managers**
- **`main.js`** - Application composition root and dependency injection
- **`uiManager.js`** - UI orchestration and rendering coordination
- **`filterManager.js`** - Comprehensive filter management including UI rendering and panel visibility
- **`lazyLoader.js`** - Infinite scrolling and performance optimization
- **`favoritesManager.js`** - Favorites UI state and interactions
- **`statsManager.js`** - Contractor count display management

#### **Modal System (`js/app/modals/`)**
- **`modalManager.js`** - Modal orchestration and coordination
- **`contractorModalManager.js`** - Independent contractor details modal (creates UI dynamically)
- **`reviewModalManager.js`** - Independent review form modal (creates UI dynamically)
- **`baseModalManager.js`** - Legacy base modal functionality

### **🔧 CORE MODULES (`js/modules/`)**

#### **Data Layer**
- **`data.js`** - Main data orchestrator (pure data operations, no UI)
- **`storage.js`** - Dual persistence layer (localStorage + Supabase sync)
- **`contractorManager.js`** - Contractor CRUD operations and data management
- **`reviewManager.js`** - Review management, calculations, and statistics
- **`categories.js`** - Category management operations (pure data class)
- **`favoritesDataManager.js`** - Pure favorites data operations
- **`statsDataManager.js`** - Statistics data calculations

#### **UI Components**
- **`cardManager.js`** - Contractor card rendering and templates
- **`mapManager.js`** - Leaflet map integration and management
- **`tabs.js`** - Tab navigation functionality

#### **Authentication & Utilities**
- **`auth.js`** - SHA-256 authentication system
- **`supabase.js`** - Supabase client & real-time sync management
- **`notifications.js`** - Enhanced notification system with sync status support
- **`validation.js`** - Form validation utilities
- **`utilities.js`** - Helper functions and utilities
- **`uuid.js`** - RFC4122 v4 compliant UUID generation for Supabase

#### **Admin Modules**
- **`admin-auth.js`** - Authentication and session management
- **`admin-contractors.js`** - Contractor management interface
- **`admin-categories.js`** - Category management interface
- **`admin-reviews.js`** - Review moderation system

### **💾 DATA LAYER (`js/data/`)**
- **`defaultData.js`** - Data aggregator and initialization
- **`defaultCategories.js`** - Contractor service categories (ES6 module)
- **`defaultContractors.js`** - Sample contractor data (ES6 module)
- **`defaultReviews.js`** - Sample review data (ES6 module)
- **`defaultLocations.js`** - South African provinces and cities (ES6 module)

### **🔌 CONFIGURATION**
- **`config/supabase-credentials.js`** - Supabase connection settings

### **🎯 ENTRY POINTS**
- **`js/script.js`** - Main app entry point and initialization
- **`js/admin.js`** - Admin panel main controller

---

## 📋 EXPOSED METHODS & APIs

### **Core Data Module (`js/modules/data.js`)**
```javascript
// Contractor Operations
getContractors(), getContractor(id), addContractor(data), updateContractor(id, updates), deleteContractor(id)

// Review Operations  
getAllReviews(), getReviewsForContractor(contractorId), addReview(contractorId, data), updateReviewStatus(reviewId, status), deleteReview(reviewId)

// Category Operations
getCategories(), addCategory(name), updateCategory(oldName, newName), deleteCategory(name)

// Favorites & Search
getStats(), getReviewStats(), getFavorites(), toggleFavorite(contractorId), searchContractors(), getAllLocations(), getFavoriteContractors()

// Debug & Sync
debugCategoryLoading(), triggerManualSync(), triggerDataPull()

// Manager Access
getStorage(), getContractorManager(), getReviewManager(), getCategoriesModule(), getFavoritesDataManager(), getStatsManager()
```

### **Storage Module (`js/modules/storage.js`)**
```javascript
// Basic Operations
save(key, data, options), load(key, options), remove(key, options), clear(), exists(key)

// Supabase Integration  
isSupabaseAvailable(), syncFromSupabase(key), syncToSupabase(key, data), forceRefreshAll()

// Data Management
getStats(), mergeData(key, localData, remoteData)
```

### **Categories Module (`js/modules/categories.js`)**
```javascript
// Category Operations
getCategories(), getCategoryByName(name), addCategory(name), updateCategory(oldName, newName), deleteCategory(name)

// Validation & Utilities
categoryExists(name), getCategoryCount(), getCategoriesForDropdown(), validateCategoryName(name), getCategoryStats()
```

### **Favorites Data Manager (`js/modules/favoritesDataManager.js`)**
```javascript
// Pure Data Operations
toggleFavorite(contractorId), isFavorite(contractorId), getFavorites(), getFavoritesCount(), refresh()
```

### **Favorites Manager (`js/app/favoritesManager.js`)**
```javascript
// UI Operations
toggleFavorite(contractorId), showFavoritesSection(), showFavoritesOnly(), showHighRated()

// Data Access
getFavoriteContractors(), getFavoritesCount(), getFavorites(), isFavorite(contractorId)

// Event Management
onFavoritesFilterApplied(callback), onFilterActionRequested(callback)
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
showFilterPanel(), hideFilterPanel(), toggleFilterPanel(), refreshAllFilters(), refreshCategoryFilter(), refreshLocationFilter()

// Filter State
getActiveFilterCount(), getFilterState(), getCurrentView(), setCurrentView(view)

// Event Management
onFiltersChange(callback), onViewChange(callback), handleAction(action), handleCategoriesUpdated()

// Data Operations
populateLocationFilter(contractors), populateCategoryFilter(contractors), refreshFilterOptions(contractors), getUniqueLocations(contractors)

// Bottom Navigation
handleBottomNavigation(view, item), updateBottomNavigationActiveState(activeView), showHomeView(), showFavoritesView(), showSearchView(), showMapView(), showAdminView()
```

### **Stats Manager (`js/app/statsManager.js`)**
```javascript
// Stats Operations
renderStats(filteredContractors), updateStats(filteredContractors), refresh()

// UI Updates
updateContractorCountUI(stats)
```

### **Stats Data Manager (`js/modules/statsDataManager.js`)**
```javascript
// Data Calculations
getStats(), getReviewStats()
```

### **Notifications Module (`js/modules/notifications.js`)**
```javascript
// Core Notifications
showNotification(options, type), dismissNotification(notification), clearAllNotifications()

// Quick Methods
showSuccess(message), showError(message), showWarning(message), showInfo(message)

// Sync Notifications
showSyncNotification(message, status, progress, syncId), showOfflineNotification(), dismissOfflineNotification(), showSyncCompleteNotification(stats), showNetworkStatusNotification(isOnline)

// Management
getNotificationStats()
```

### **Utilities Module (`js/modules/utilities.js`)**
```javascript
// Performance
debounce(func, wait, immediate), throttle(func, limit)

// DOM & UI
copyToClipboard(text), isInViewport(element), smoothScrollTo(element, offset), toggleElement(element, show)

// Formatting
formatCurrency(amount), formatDate(date, options), sanitizeHtml(unsafe)

// URL Management
getQueryParams(), setQueryParams(params, replace)
```

### **UUID Module (`js/modules/uuid.js`)**
```javascript
// Generation
generateUUID(), generateUUIDs(count), generateId(), generateNamespaceUUID(namespace, name)

// Validation & Utilities
isValidUUID(uuid), ensureUUID(id, forceUUID), parseUUID(uuid), uuidsEqual(uuid1, uuid2)
```

### **Contractor Manager (`js/modules/contractorManager.js`)**
```javascript
// CRUD Operations
getAll(), getById(id), create(data), update(id, updates), delete(id)

// Search & Filter
search(searchTerm, categoryFilter, ratingFilter, locationFilter), getAllLocations()

// Data Management
refresh(), save(), getContractorsByCategory(category)
```

### **Review Manager (`js/modules/reviewManager.js`)**
```javascript
// CRUD Operations
getAllReviews(), getReviewsByContractor(contractorId), addReview(contractorId, data), updateReviewStatus(reviewId, status), deleteReview(reviewId)

// Calculations
calculateOverallRating(reviews), getApprovedReviewsByContractor(contractorId), calculateCategoryRatings(reviews)

// Search & Filter
searchReviews(searchTerm, contractorId, status), refresh()
```

### **Modal Managers (`js/app/modals/`)**
```javascript
// Contractor Modal Manager
showContractorModal(contractorId), hideContractorModal(), updateContractorData(contractorId)

// Review Modal Manager  
showReviewModal(contractorId, reviewData), hideReviewModal(), submitReview(formData)

// Base Modal Manager
showModal(content, options), hideModal(), setContent(content)
```

### **Main Application (`js/app/main.js`)**
```javascript
// Core Lifecycle
init(), createManagers(), setupManagers(), setupGlobalHandlers(), renderDashboard()

// View Management
handleViewChange(), showMapView(), showListView(), refreshMap()

// Data Operations
handleReviewSubmit(reviewData), toggleFavorite(contractorId), exportData()

// Filter Management
searchContractors(), filterContractors(), sortContractors(), clearFilters(), showFavoritesOnly(), showHighRated()

// Utility Methods
getAppStatus(), closeModal(modalId), handleSearchKeyPress(event)
```

### **Admin Controllers**
- **`js/admin.js`** - Global admin methods for HTML onclick handlers, debug utilities
- **`js/modules/admin-categories.js`** - Category management UI rendering and operations
- **`js/modules/admin-contractors.js`** - Contractor management interface methods
- **`js/modules/admin-reviews.js`** - Review moderation system methods

---

## 🔄 ARCHITECTURE PATTERNS

### **Data Flow**
1. **Data Layer** (`data.js`, managers) - Pure data operations
2. **UI Layer** (`uiManager.js`, components) - Presentation and rendering
3. **User Interactions** → **Event Handlers** → **Data Updates** → **UI Updates**

### **Manager Hierarchy**
```
Main App (main.js/admin.js)
    ↓
DataModule (data.js) - Data Orchestration
    ├── Storage (storage.js) - Persistence
    ├── ContractorManager - Contractor Operations
    ├── ReviewManager - Review Operations
    └── CategoriesModule - Category Operations
        ↓
UIManager (UI Orchestration)
    ├── FilterManager (Filter UI & Logic)
    ├── StatsManager (Contractor Count UI)
    ├── FavoritesManager (Favorites UI)
    ├── ModalManager (Modal Coordination)
    └── CardManager (Card Rendering)
```

### **Data Persistence Strategy**
- **Local-first with background sync** to Supabase
- **Optimistic updates** for fast UI response
- **Offline-friendly** operation
- **Smart merge strategy** for conflict resolution

### **Mobile-First Responsive Design**
- **Material Design bottom navigation** for mobile
- **Optimized hero section** for mobile
- **Touch-friendly** interactions
- **Progressive enhancement** from mobile to desktop
- **Hidden filter panel** that appears on search button press

This structure provides a clean separation of concerns with well-defined APIs for each module, making the codebase maintainable and extensible.
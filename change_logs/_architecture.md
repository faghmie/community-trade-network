# Community Trade Network - Current Project Structure & Architecture

## 📁 **PROJECT STRUCTURE OVERVIEW**

### **🌐 ROOT LEVEL FILES**

**Application Entry Points:**
- **`index.html`** - Main consumer PWA with view container and bottom navigation
- **`admin.html`** - Administrative portal for content management with tabbed interface
- **`manifest.json`** - PWA configuration for mobile app installation
- **`sw.js`** - Service Worker for offline caching and asset management

**Development Tools:**
- **`generate_password.html`** - Admin authentication setup utility
- **`generate-icons.html`** - PWA icon asset generation tool

### **🎨 STYLING SYSTEM (`css/`)**

**Design Foundation:**
- **`css/base/reset.css`** - CSS normalization across browsers
- **`css/base/variables.css`** - Material Design 3 design tokens and CSS custom properties

**Component Library (`css/components/`):**
- **Material Components**: `material.css`, `buttons.css`, `cards.css`
- **Layout Components**: `modals.css`, `bottom-nav.css`, `tabs.css`, `bottom-sheet.css`
- **Feature Components**: `ratings.css`, `map.css`, `forms.css`, `feedback.css`, `auth.css`, `profile.css`
- **Data Display**: `tables.css`, `contractor-details.css`, `dashboard.css`, `categories.css`
- **UI Components**: `confirmation-modal.css`, `notifications.css`, `stats-cards.css`, `utilities.css`
- **Search Interface**: `search.css` - Search view with filter form and results management

**Application Styles:**
- **`main.css`** - Primary consumer PWA styles and CSS imports orchestration
- **`admin.css`** - Admin-specific layouts and components
- **`layout.css`** - Responsive grid systems and layout utilities

### **⚙️ JAVASCRIPT ARCHITECTURE (`js/`)**

#### **👨‍💼 ADMIN PORTAL (`js/admin/`)**

**Core Coordination:**
- **`admin-app.js`** - Main orchestrator that initializes all admin modules and handles authentication flow
- **`admin-dashboard.js`** - Dashboard management with stats calculation and tab navigation
- **`admin-auth.js`** - Authentication flow with session management and login UI

**Shared Infrastructure:**
- **`shared/base-modal.js`** - Base modal class providing common modal functionality for all admin modals

**Feature-Based Module Organization:**

**Categories Feature Module (`js/admin/categories/`):**
- **`admin-categories.js`** - Main orchestrator for category management
- **`categories-table-manager.js`** - Dedicated table rendering, sorting, and row interactions
- **`categories-modal.js`** - Self-contained modal for category form management with auto-complete

**Contractors Feature Module (`js/admin/contractors/`):**
- **`admin-contractors.js`** - Main orchestrator for contractor management
- **`contractors-table-manager.js`** - Dedicated table rendering, sorting, and row interactions
- **`contractor-modal.js`** - Self-contained modal for contractor CRUD operations with full data type support

**Recommendations Feature Module (`js/admin/recommendations/`):**
- **`admin-recommendations.js`** - Main orchestrator for recommendation management
- **`recommendations-table-manager.js`** - Dedicated table rendering, filtering, and moderation actions
- **`recommendation-modal.js`** - Self-contained modal for viewing recommendation details and moderation

**Feedback Feature Module (`js/admin/feedback/`):**
- **`admin-feedback.js`** - Main orchestrator for feedback management
- **`feedback-table-manager.js`** - Dedicated table rendering, filtering, and status updates
- **`feedback-modal.js`** - Self-contained modal for viewing feedback details and status management

#### **📱 CONSUMER PWA (`js/app/`)**

**Application Core:**
- **`main.js`** - Composition root that orchestrates all consumer components and manages view state
- **`statsManager.js`** - Application statistics and metrics calculation
- **`lazyLoader.js`** - Dynamic resource loading for performance optimization

**View System (`js/app/views/`):**
- **`BaseView.js`** - Foundation class providing show/hide/render lifecycle for all views
- **`CategoriesView.js`** - Category display and selection interface with hierarchical navigation
- **`ContractorListView.js`** - Contractor card list with favorites management and filtering
- **`MapView.js`** - Geographic interface with Leaflet integration and contractor clustering
- **`ContractorView.js`** - Detailed contractor information display with recommendations
- **`RecommendationEditView.js`** - Community recommendation submission form with validation
- **`FeedbackView.js`** - User feedback collection interface
- **`ContractorEditView.js`** - Contractor profile editing interface with geocoding
- **`SearchView.js`** - Advanced search and filtering interface with two-step process (filters → results)
- **`ProfileView.js`** - User profile management combining favorites and feedback functionality

**View Utilities:**
- **`utils/viewHelpers.js`** - Common view rendering utilities and templates

#### **🔧 CORE MODULES (`js/modules/`)**

**Data Management Layer:**
- **`data.js`** - Central data orchestrator coordinating all storage operations
- **`storage.js`** - Dual persistence strategy (local-first with Supabase sync)
- **`contractorManager.js`** - Contractor CRUD operations and search functionality
- **`categories.js`** - Category administration and hierarchical management
- **`recommendationDataManager.js`** - Community recommendation management with trust metrics
- **`feedbackDataManager.js`** - User feedback data operations
- **`favoritesDataManager.js`** - User favorites management
- **`statsDataManager.js`** - Application statistics and analytics

**Infrastructure Services:**
- **`supabase.js`** - Cloud integration with PostgreSQL backend
- **`validation.js`** - Form validation and input sanitization
- **`utilities.js`** - Essential utilities (debounce, formatting, sanitization)
- **`confirmationModal.js`** - Material Design confirmation dialogs
- **`notifications.js`** - User feedback and status toasts
- **`geocodingService.js`** - Location and address geocoding functionality
- **`areaAutocomplete.js`** - Geographic area suggestion system

**UI Services:**
- **`tabs.js`** - Tab navigation component
- **`loadingScreen.js`** - Application loading states
- **`service-worker-manager.js`** - PWA service worker management
- **`backButtonManager.js`** - Mobile navigation handling
- **`pwa-install-manager.js`** - Progressive Web App installation prompts

#### **💾 DATA LAYER (`js/data/`)**

**Default Data Structure:**
- **`defaultData.js`** - Data aggregation and initialization
- **`defaultCategories.js`** - Service category definitions with hierarchical structure
- **`defaultContractors.js`** - Sample contractor profiles with comprehensive attributes
- **`defaultLocations.js`** - South African geographic data
- **`defaultReviews.js`** - Sample recommendation data

**Type System (`js/data/types/`):**
- **`index.js`** - Central type exports and aggregations
- **`categoryTypes.js`** - Category data structures and hierarchies
- **`contractorTypes.js`** - Contractor profile definitions with full attribute support
- **`recommendationTypes.js`** - Community recommendation schemas
- **`feedbackTypes.js`** - User feedback data structures
- **`locationTypes.js`** - Geographic location definitions
- **`uuidTypes.js`** - Universal unique identifier specifications

#### **🔐 CONFIGURATION (`js/config/`)**
- **`supabase-credentials.js`** - Cloud service configuration and API keys

#### **📜 ENTRY POINTS**
- **`script.js`** - Consumer PWA bootstrap and dependency initialization
- **`admin.js`** - Admin portal entry point

### **📚 DOCUMENTATION & SCRIPTS**

**Documentation (`docs/`):**
- **`PRODUCT_REQUIREMENT_DOCUMENT.md`** - Product specifications and requirements
- **`ADMIN_GUIDE.md`** - Administrator operation manual
- **`deployment_decisions.md`** - Infrastructure and deployment choices
- **`COMMUNITY_GUIDELINES.md`** - User community standards
- **`TRACKING_STRATEGY_DECISION.md`** - Analytics and monitoring approach

**Database Scripts (`scripts/`):**
- **`postgresql_supabase_setup.sql`** - Complete database schema for PostgreSQL
- **`default_categories.sql`** - Initial data population scripts
- **`start_server.sh`** - Development server startup script

**Icons & Assets (`icons/`):**
- PWA icon set in multiple resolutions for mobile app installation

**Change Logs (`change_logs/`):**
- Development history and architectural decisions
- Weekly progress tracking and feature implementation

---

## 🏗️ **ARCHITECTURE DECISIONS & PATTERNS**

### **1. View-Based Architecture (Consumer PWA)**

**BaseView Pattern:**
- All main screens extend `BaseView` for consistent lifecycle management
- Each view manages its own DOM structure, event binding, and state
- Clean separation between view orchestration (main.js) and view implementation

**View Lifecycle:**
- `render()` - Initial DOM creation and setup
- `show()` - View activation and display logic
- `hide()` - View deactivation and cleanup
- `refresh()` - Data refresh and UI updates

**Navigation Flow:**
```
Bottom Navigation → main.js → View.show() → View.render() → User Interaction
```

### **2. Feature-Based Module Organization (Admin Portal)**

**Self-Contained Feature Modules:**
- Each major feature (categories, contractors, recommendations, feedback) has dedicated directory
- Feature orchestrator manages table, modal, and data coordination
- Clear separation of concerns with single responsibility per component

**Admin Module Pattern:**
```
admin-feature.js (Orchestrator)
    ↓
feature-table-manager.js (Table UI & Interactions)
    ↓
feature-modal.js (Form UI & Details)
    ↓
data.js (Data Operations via Data Managers)
```

### **3. Data Flow & State Management**

**Centralized Data Orchestration:**
- `data.js` serves as single entry point for all data operations
- Domain-specific managers handle business logic (contractorManager, categories, etc.)
- Storage abstraction layer provides local-first with cloud sync strategy

**Data Flow Pattern:**
```
User Action → View → Data Manager → Storage → Cloud Sync → UI Update
```

**Event-Driven Communication:**
- Custom DOM events for cross-component notifications
- Direct method calls for parent-child relationships
- Promise-based APIs for async operations

### **4. Component Composition**

**Reusable UI Components:**
- Material Design inspired component system
- CSS custom properties for consistent theming
- Mobile-first responsive design approach

**Modal System:**
- BaseModal provides common functionality for all admin modals
- Self-contained modal components manage their own state
- Clean callback interfaces for parent communication

### **5. PWA Optimization Strategy**

**Offline-First Architecture:**
- Service Worker caches core app shell and critical assets
- Local storage persists user data and preferences
- Graceful degradation when offline with queued operations

**Performance Focus:**
- Minimal initial JavaScript payload
- Lazy loading of non-critical resources
- Efficient data caching strategies

### **6. Type-Driven Development**

**JSDoc Type System:**
- Comprehensive type definitions for all data structures
- Clear interfaces between modules with proper documentation
- Better development experience with IDE support

---

## 🔄 **MODULE INTEGRATION PATTERNS**

### **Consumer PWA Bootstrap Flow:**

1. **`script.js`** loads dependencies and creates app instance
2. **`main.js`** initializes data module and creates all view managers
3. **Views** are created and rendered (initially hidden)
4. **Event listeners** are set up for cross-component communication
5. **Initial view** (Categories) is displayed

### **Admin Portal Bootstrap Flow:**

1. **`admin.html`** loads `admin-app.js`
2. **`admin-app.js`** initializes authentication and core data modules
3. **Feature modules** are initialized with dependency injection
4. **Dashboard** renders stats and manages tab navigation
5. **Authentication gate** controls admin content access

### **Data Layer Integration:**

**Storage Strategy:**
- **Local Storage** - Primary data persistence for instant UI response
- **Supabase PostgreSQL** - Cloud backup and multi-device synchronization
- **Conflict Resolution** - Last-write-wins with background sync

**Manager Specialization:**
- `contractorManager` - Contractor CRUD and search operations
- `categories` - Category hierarchy and management
- `recommendationDataManager` - Community recommendations with trust scoring
- `feedbackDataManager` - User feedback collection and analysis

### **View Communication Patterns:**

**Parent-Child Communication:**
- Direct method calls within view hierarchies
- Clear ownership and data flow

**Cross-View Communication:**
- Custom DOM events (`categorySelected`, `navigationViewChange`)
- Loose coupling between unrelated components

**Data Update Propagation:**
- `contractorsUpdated` events trigger view refreshes
- Consistent state management across the application

---

## 🎯 **KEY ARCHITECTURAL BENEFITS**

### **Maintainability:**
- Clear separation of concerns with feature-based organization
- Consistent patterns across consumer and admin interfaces
- Modular architecture allows independent development and testing

### **Scalability:**
- View-based architecture supports easy addition of new screens
- Feature modules can be developed and deployed independently
- Data layer abstraction supports multiple storage backends

### **User Experience:**
- Offline-first design ensures app availability
- Responsive Material Design components
- Progressive enhancement with PWA capabilities

### **Development Experience:**
- Consistent patterns reduce cognitive load
- Type definitions improve code quality and IDE support
- Comprehensive documentation and change tracking

This architecture provides a solid foundation for both the consumer-facing PWA and administrative portal, with clear separation of concerns, consistent patterns, and scalable organization that supports ongoing development and maintenance.

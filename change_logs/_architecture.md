# Community Trade Network - Current Project Architecture & Structure

## 🏗️ **Architecture Overview**

### **Core Architectural Patterns**

**1. Layered Architecture with Clean Separation**
```
Presentation Layer (Views & UI Components)
    ↓
Application Layer (Managers & Controllers)
    ↓
Business Logic Layer (Data Orchestration)
    ↓
Infrastructure Layer (Storage & Services)
    ↓
Persistence Layer (LocalStorage + Supabase + Cache API)
```

**2. Event-Driven Communication Pattern**
- **Custom Events** for cross-component notifications
- **Loose coupling** between modules
- **Unidirectional data flow** from data layer to presentation
- **View-based architecture** for modular UI management

**3. Mobile-First PWA Strategy**
- Service Worker for offline capability
- Material Design 3 for consistent UX
- Bottom navigation for mobile optimization
- Responsive design with mobile breakpoints

---

## 📁 **PROJECT STRUCTURE & FILE DESCRIPTIONS**

### **🌐 ROOT LEVEL FILES**

**Entry Points:**
- **`index.html`** - Main consumer PWA interface with view container architecture
- **`admin.html`** - Administrative portal for content management and moderation
- **`manifest.json`** - PWA configuration for app installation and metadata
- **`sw.js`** - Service Worker for offline caching and update management

**Development & Setup:**
- **`generate_password.html`** - Admin authentication setup utility
- **`generate-icons.html`** - PWA icon asset generation tool
- **`start_server.sh`** - Local development server script

### **📚 DOCUMENTATION (`docs/`)**
- **`PRODUCT_REQUIREMENT_DOCUMENT.md`** - Comprehensive product specifications
- **`rate-my-contractor-product-requirements.md`** - Detailed feature requirements
- **`ADMIN_GUIDE.md`** - Administrator operation manual
- **`COMMUNITY_GUIDELINES.md`** - User community standards
- **`deployment_decisions.md`** - Infrastructure and deployment choices
- **`TRACKING_STRATEGY_DECISION.md`** - Analytics and monitoring approach

### **📝 CHANGE MANAGEMENT (`change_logs/`)**
- **Current logs** (root level) - Latest development sessions
- **`archive/week_2025_11_13/`** - Historical development sessions with detailed implementation notes

---

## 🎨 **STYLING ARCHITECTURE (`css/`)**

### **Design System Foundation**

**Base Layer (`css/base/`)**
- **`reset.css`** - CSS normalization across browsers
- **`variables.css`** - Design token system (Material Design 3 variables)

**Component Layer (`css/components/`)**
- **Material Design Components**: `material.css`, `buttons.css`, `cards.css`
- **Layout Components**: `modals.css`, `bottom-nav.css`, `tabs.css`, `bottom-sheet.css`
- **Feature Components**: `ratings.css`, `map.css`, `forms.css`, `feedback.css`
- **State Components**: `notifications.css`, `auth.css`, `stats-cards.css`
- **Data Display**: `tables.css`, `contractor-details.css`, `dashboard.css`
- **Utilities**: `utilities.css` for helper classes

**Application Layer**
- **`main.css`** - Primary stylesheet orchestrating all imports and global styles
- **`admin.css`** - Admin-specific overrides and layouts
- **`layout.css`** - Responsive grid systems and page layouts

---

## ⚙️ **JAVASCRIPT ARCHITECTURE (`js/`)**

### **📱 APPLICATION LAYER (`js/app/`)**

**Core Application Management:**
- **`main.js`** - Application composition root, orchestrates all managers and dependency injection
- **`uiManager.js`** - Central UI coordination and state management
- **`filterManager.js`** - Search and filter state management with "Add Supplier" flow
- **`favoritesManager.js`** - User favorites interface management
- **`statsManager.js`** - Analytics and statistics display
- **`lazyLoader.js`** - Performance optimization for lazy loading

**View System (`js/app/views/`)**
- **`contractorListView.js`** - Self-contained contractor list display module
- **`categoriesListView.js`** - Self-contained categories display module
- **`mapView.js`** - Geographic interface and location services integration

**Modal System (`js/app/modals/`)**
- **`baseModalManager.js`** - Abstract base class for modal patterns and common functionality
- **`contractorModalManager.js`** - Contractor details display modal with review integration
- **`contractorEditModalManager.js`** - Contractor creation and editing modal with location autocomplete
- **`reviewModalManager.js`** - Review submission interface with category ratings
- **`feedbackModalManager.js`** - User feedback submission modal (main app)
- **`adminFeedbackModalManager.js`** - Admin feedback viewing and management modal

### **🔧 CORE MODULES (`js/modules/`)**

#### **Data Management Layer**

**Data Orchestration:**
- **`data.js`** - Data orchestrator, single entry point for all data operations
- **`storage.js`** - Dual persistence strategy (Local-first with Supabase sync)

**Specialized Data Managers:**
- **`contractorManager.js`** - Contractor CRUD operations, search, and filtering
- **`reviewManager.js`** - Review management and statistics calculation
- **`categories.js`** - Category administration and hierarchical management
- **`favoritesDataManager.js`** - User favorites persistence and synchronization
- **`statsDataManager.js`** - Analytics and metrics calculation
- **`feedbackDataManager.js`** - User feedback data operations and status management

**Infrastructure Services:**
- **`supabase.js`** - Cloud integration and real-time sync with PostgreSQL backend
- **`geocodingService.js`** - Location to coordinates conversion with caching and rate limiting
- **`validation.js`** - Form validation and data sanitization
- **`utilities.js`** - Common functions and helpers
- **`uuid.js`** - ID generation for distributed systems using UUID v4
- **`loadingScreen.js`** - Application loading states and progress indicators
- **`areaAutocomplete.js`** - Smart location input with suggestions and geocoding
- **`backButtonManager.js`** - Browser back button handling for modal navigation

**UI Components:**
- **`cardManager.js`** - Contractor card rendering and management
- **`notifications.js`** - User feedback and status updates (toasts, alerts)
- **`tabs.js`** - Tab navigation system with state management

**PWA & Authentication:**
- **`service-worker-manager.js`** - Service Worker registration and update management
- **`pwa-install-manager.js`** - Progressive Web App installation prompts
- **`auth.js`** - User authentication and session management

#### **Admin Modules**
- **`admin-auth.js`** - Session management and SHA-256 access control for admin portal
- **`admin-contractors.js`** - Contractor administration interface with bulk operations
- **`admin-categories.js`** - Category management interface with hierarchical editing
- **`admin-reviews.js`** - Review moderation workflows and approval processes
- **`admin-feedback.js`** - User feedback management interface with status tracking

### **💾 DATA LAYER (`js/data/`)**

**Default Data Structure:**
- **`defaultData.js`** - Data aggregation and initialization orchestrator
- **`defaultCategories.js`** - Service category definitions and hierarchy
- **`defaultContractors.js`** - Sample contractor profiles with realistic data
- **`defaultReviews.js`** - Review data with ratings and category breakdowns
- **`defaultLocations.js`** - Geographic data for South Africa (provinces, cities, coordinates)

**Type System (`js/data/types/`)**
- **`categoryTypes.js`** - JSDoc types for category data structures
- **`contractorTypes.js`** - JSDoc types for contractor entities and operations
- **`reviewTypes.js`** - JSDoc types for review system with category ratings
- **`feedbackTypes.js`** - JSDoc types for user feedback and admin management
- **`locationTypes.js`** - JSDoc types for geographic data and coordinates
- **`uuidTypes.js`** - UUID type definitions for consistent ID handling
- **`index.js`** - Central type exports and cross-references

### **⚙️ CONFIGURATION (`js/config/`)**
- **`supabase-credentials.js`** - Environment-specific Supabase configuration and API endpoints

### **📜 ENTRY POINTS**
- **`script.js`** - Main application entry point, bootstraps consumer PWA
- **`admin.js`** - Admin portal entry point, initializes admin-specific modules

---

## 🗄️ **DATABASE & SCRIPTS (`scripts/`)**
- **`postgresql_supabase_setup.sql`** - Complete database schema definition for PostgreSQL
- **`default_categories.sql`** - Initial category data population scripts
- **`start_server.sh`** - Local development server setup script

---

## 🖼️ **ASSETS (`icons/`)**
- Multiple resolutions (72x72 to 512x512) for various devices
- Progressive Web App installation requirements
- Adaptive icons for different platform specifications

---

## 🔄 **ARCHITECTURE DECISIONS & PATTERNS**

### **1. Event-Driven Communication Pattern**

**Custom Events:**
- Used for cross-component notifications and state changes
- Modal open/close operations via events
- Data synchronization events between layers
- View switching and navigation events

**Benefits:**
- Loose coupling between modules
- Easy debugging and monitoring
- Scalable architecture for feature additions
- Clear separation of concerns

### **2. View-Based Architecture**

**Self-Contained Views:**
- Each view manages its own HTML structure
- Views can be shown/hidden independently
- Clear view lifecycle management
- Easy to add new views without breaking existing functionality

**View Coordination:**
- Main app orchestrates view visibility
- Events control view transitions
- Consistent user experience across views

### **3. Data Persistence Strategy**

**Local-First Architecture:**
- Primary data storage in browser's localStorage
- Fast UI response without network dependency
- Offline capability as core feature

**Cloud Synchronization:**
- Supabase PostgreSQL for centralized data storage
- Background synchronization when online
- Conflict resolution with last-write-wins strategy

**Caching Layer:**
- Service Worker for static asset caching
- In-memory caching for frequently accessed data
- Geocoding results caching for performance

### **4. Modular Design Principles**

**Single Responsibility:**
- Each manager handles specific domain logic
- Modal managers focus on UI interaction patterns
- Data managers handle persistence and business logic
- View managers handle display and user interaction

**Dependency Injection:**
- Main.js acts as composition root
- Explicit dependency passing through constructors
- Clear dependency graph for maintainability

**Separation of Concerns:**
- Presentation logic in view managers
- Business logic in data managers
- Infrastructure concerns in service modules
- Coordination logic in application managers

### **5. Type Safety Approach**

**JSDoc Type System:**
- Comprehensive type definitions without build step
- Full IDE IntelliSense and autocomplete
- Runtime type validation where needed
- Database schema alignment through types

**Consistent Data Structures:**
- UUID v4 for all entity identifiers
- Standardized coordinate structures
- Unified rating and review formats
- Consistent status enumerations

### **6. PWA Optimization Strategy**

**Offline-First:**
- Service Worker for core app shell caching
- Local storage for data persistence
- Graceful degradation when offline

**Performance:**
- Lazy loading for non-critical components
- Optimized images and icons
- Minimal initial JavaScript payload

**Mobile Experience:**
- Bottom navigation for thumb-friendly interaction
- Touch-optimized controls and gestures
- Responsive design with mobile breakpoints

---

## 🎯 **MODULE INTEGRATION PATTERNS**

### **Application Bootstrap Flow:**
1. **Entry Point** (`script.js`/`admin.js`) initializes core dependencies
2. **Main Manager** (`main.js`) composes all sub-managers and views
3. **Data Module** (`data.js`) initializes storage and sync layers
4. **View Managers** set up event listeners and render initial state
5. **Service Workers** register for offline capability

### **Data Flow Patterns:**
- **User Action** → **View Manager** → **Event** → **Application Manager** → **Data Manager** → **Storage** → **Sync** → **UI Update**
- **Background Sync** → **Storage** → **Data Manager** → **Event Notification** → **View Update**
- **View Interaction** → **Event** → **Filter Manager** → **Data Operation** → **View Refresh**

### **View Management Flow:**
1. **View Initialization** - Views render their HTML structure
2. **Event Registration** - Views listen for relevant events
3. **View Coordination** - Main app manages view visibility
4. **Data Binding** - Views receive data via events
5. **User Interaction** - Views dispatch events for actions

### **Error Handling Strategy:**
- **UI Level**: User-friendly notifications and fallback states
- **Data Level**: Retry mechanisms and conflict resolution
- **Network Level**: Offline queuing and synchronization
- **Application Level**: Graceful degradation and error boundaries

This architecture provides a robust foundation for the Community Trade Network app with clear separation of concerns, comprehensive type safety, and optimized mobile PWA experience. The event-driven communication pattern ensures loose coupling between modules, while the view-based architecture enables flexible UI management and easy feature additions.
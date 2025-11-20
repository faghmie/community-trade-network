// js/modules/pwa-install-manager.js - IMPROVED DISMISSAL VERSION
/**
 * PWA Installation Manager - Improved Dismissal Version
 * Handles PWA installation prompts and UI with better dismissal logic
 */
export class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.installBanner = null;
        this.installBtn = null;
        this.dismissBtn = null;
        this.isInstalled = false;
        this.dismissalDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        console.log('🔧 PWAInstallManager: Constructor called');
        this.init();
    }

    init() {
        console.log('🔧 PWAInstallManager: Initializing...');
        this.setupEventListeners();
        this.setupInstallPrompt();
        this.checkIfInstalled();
        this.logPWAStatus();
    }

    setupEventListeners() {
        console.log('🔧 PWAInstallManager: Setting up event listeners');
        
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔧 PWAInstallManager: DOM loaded, getting elements');
            
            this.installButton = document.getElementById('installNavItem');
            this.installBanner = document.getElementById('pwaInstallBanner');
            this.installBtn = document.getElementById('installPwaBtn');
            this.dismissBtn = document.getElementById('dismissInstallBtn');

            console.log('🔧 PWAInstallManager: Elements found:', {
                installButton: !!this.installButton,
                installBanner: !!this.installBanner,
                installBtn: !!this.installBtn,
                dismissBtn: !!this.dismissBtn
            });

            if (this.installButton) {
                this.installButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🔧 PWAInstallManager: Install button clicked');
                    this.showInstallPrompt();
                });
            }

            if (this.installBtn) {
                this.installBtn.addEventListener('click', () => {
                    console.log('🔧 PWAInstallManager: Banner install button clicked');
                    this.installApp();
                });
            }

            if (this.dismissBtn) {
                this.dismissBtn.addEventListener('click', () => {
                    console.log('🔧 PWAInstallManager: Dismiss button clicked');
                    this.dismissInstallBanner();
                });
            }

            // Check if we should show the banner after DOM is loaded
            setTimeout(() => {
                this.checkAndShowBanner();
            }, 1000);
        });
    }

    setupInstallPrompt() {
        console.log('🔧 PWAInstallManager: Setting up install prompt listeners');
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('🎯 PWAInstallManager: beforeinstallprompt event fired!', e);
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallUI();
            
            // Store that we have a prompt available
            localStorage.setItem('pwaPromptAvailable', 'true');
        });

        // Track when app is successfully installed
        window.addEventListener('appinstalled', (e) => {
            console.log('🎉 PWAInstallManager: appinstalled event fired!', e);
            this.isInstalled = true;
            this.hideInstallUI();
            this.showInstallSuccess();
            
            // Clear any dismissal flags since app is installed
            this.clearDismissal();
        });

        // Check for prompt availability on page load
        if (localStorage.getItem('pwaPromptAvailable') === 'true') {
            console.log('🔧 PWAInstallManager: Previous prompt was available, checking if we should show UI');
            this.checkAndShowBanner();
        }
    }

    checkIfInstalled() {
        console.log('🔧 PWAInstallManager: Checking if app is installed');
        
        // Method 1: Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 PWAInstallManager: App running in standalone mode (installed)');
            this.isInstalled = true;
            return;
        }
        
        // Method 2: Check if running as PWA
        if (window.navigator.standalone) {
            console.log('📱 PWAInstallManager: iOS standalone mode detected');
            this.isInstalled = true;
            return;
        }
        
        // Method 3: Check referrer for PWA launch
        if (document.referrer.includes('android-app://')) {
            console.log('📱 PWAInstallManager: Android PWA launch detected');
            this.isInstalled = true;
            return;
        }

        if (this.isInstalled) {
            this.hideInstallUI();
        }
    }

    checkAndShowBanner() {
        console.log('🔧 PWAInstallManager: Checking if we should show banner');
        
        if (this.isInstalled) {
            console.log('🔧 PWAInstallManager: Not showing banner - app is installed');
            return;
        }

        if (this.isBannerDismissed()) {
            console.log('🔧 PWAInstallManager: Not showing banner - user dismissed it');
            return;
        }

        if (this.deferredPrompt || localStorage.getItem('pwaPromptAvailable') === 'true') {
            console.log('🔧 PWAInstallManager: Conditions met, showing install UI');
            this.showInstallUI();
        } else {
            console.log('🔧 PWAInstallManager: Conditions not met for showing banner');
        }
    }

    isBannerDismissed() {
        const dismissalTime = localStorage.getItem('pwaInstallDismissed');
        if (!dismissalTime) {
            return false;
        }

        const dismissalDate = new Date(parseInt(dismissalTime));
        const now = new Date();
        const timeSinceDismissal = now - dismissalDate;

        // If more than 24 hours have passed, clear the dismissal
        if (timeSinceDismissal > this.dismissalDuration) {
            console.log('🔧 PWAInstallManager: Dismissal period expired, clearing dismissal');
            this.clearDismissal();
            return false;
        }

        console.log(`🔧 PWAInstallManager: Banner was dismissed ${Math.round(timeSinceDismissal / (60 * 60 * 1000))} hours ago`);
        return true;
    }

    dismissInstallBanner() {
        console.log('🔧 PWAInstallManager: Dismissing install banner');
        this.hideInstallBanner();
        
        // Store dismissal time instead of just a flag
        const dismissalTime = new Date().getTime();
        localStorage.setItem('pwaInstallDismissed', dismissalTime.toString());
        
        console.log('🔧 PWAInstallManager: Banner dismissed until tomorrow');
        
        // Show a subtle notification that user can access install later
        if (typeof window.showNotification === 'function') {
            window.showNotification({
                message: 'You can install the app anytime from the menu → Install App',
                type: 'info',
                duration: 3000
            });
        }
    }

    clearDismissal() {
        console.log('🔧 PWAInstallManager: Clearing dismissal flags');
        localStorage.removeItem('pwaInstallDismissed');
        sessionStorage.removeItem('pwaInstallDismissed');
    }

    logPWAStatus() {
        console.log('🔍 PWAInstallManager: PWA Status Check', {
            hasManifest: !!document.querySelector('link[rel="manifest"]'),
            hasServiceWorker: 'serviceWorker' in navigator,
            isHTTPS: window.location.protocol === 'https:',
            isLocalhost: window.location.hostname === 'localhost',
            displayMode: this.getDisplayMode(),
            isInstalled: this.isInstalled,
            hasPrompt: !!this.deferredPrompt,
            isDismissed: this.isBannerDismissed(),
            promptAvailable: localStorage.getItem('pwaPromptAvailable') === 'true'
        });
    }

    logPWARequirements() {
        console.log('🔍 PWAInstallManager: PWA Installation Requirements Check', {
            '✅ HTTPS or localhost': window.location.protocol === 'https:' || window.location.hostname === 'localhost',
            '✅ Web App Manifest': !!document.querySelector('link[rel="manifest"]'),
            '✅ Service Worker': 'serviceWorker' in navigator,
            '✅ Engagement (user interaction)': 'This requires user to interact with the site',
            '❓ beforeinstallprompt event': 'Not yet received - may need user engagement'
        });

        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            fetch(manifestLink.href)
                .then(response => response.json())
                .then(manifest => {
                    console.log('📄 PWAInstallManager: Manifest content', manifest);
                })
                .catch(error => {
                    console.error('❌ PWAInstallManager: Failed to fetch manifest', error);
                });
        }
    }

    getDisplayMode() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return 'standalone';
        }
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
            return 'fullscreen';
        }
        if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            return 'minimal-ui';
        }
        return 'browser';
    }

    showInstallUI() {
        console.log('🔧 PWAInstallManager: Showing install UI');
        
        // Don't show if already installed or dismissed
        if (this.isInstalled) {
            console.log('🔧 PWAInstallManager: Not showing UI - app already installed');
            return;
        }

        if (this.isBannerDismissed()) {
            console.log('🔧 PWAInstallManager: Not showing UI - user dismissed');
            return;
        }

        console.log('📱 PWAInstallManager: Showing PWA install UI');
        
        // Show install button in navigation
        if (this.installButton) {
            this.installButton.style.display = 'flex';
            console.log('🔧 PWAInstallManager: Install button shown');
        }

        // Show banner after a short delay (non-intrusive)
        setTimeout(() => {
            if (this.installBanner && !this.isInstalled && !this.isBannerDismissed()) {
                this.installBanner.classList.remove('hidden');
                console.log('🔧 PWAInstallManager: Install banner shown');
            }
        }, 1000);
    }

    hideInstallUI() {
        console.log('🔧 PWAInstallManager: Hiding install UI');
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
        this.hideInstallBanner();
    }

    showInstallBanner() {
        if (this.installBanner && !this.isInstalled && !this.isBannerDismissed()) {
            this.installBanner.classList.remove('hidden');
            console.log('🔧 PWAInstallManager: Install banner shown manually');
        }
    }

    hideInstallBanner() {
        if (this.installBanner) {
            this.installBanner.classList.add('hidden');
            console.log('🔧 PWAInstallManager: Install banner hidden');
        }
    }

    async showInstallPrompt() {
        console.log('🔧 PWAInstallManager: Showing install prompt');
        
        if (this.deferredPrompt) {
            console.log('📱 PWAInstallManager: Triggering browser install prompt');
            this.deferredPrompt.prompt();
            
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`📱 PWAInstallManager: User response: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('🎉 PWAInstallManager: User accepted installation');
                this.deferredPrompt = null;
                localStorage.removeItem('pwaPromptAvailable');
            } else {
                console.log('❌ PWAInstallManager: User declined installation');
                // Don't dismiss the banner completely, just hide it for now
                this.hideInstallBanner();
            }
        } else {
            console.log('⚠️ PWAInstallManager: No install prompt available');
            this.showManualInstallInstructions();
        }
    }

    async installApp() {
        console.log('🔧 PWAInstallManager: Installing app');
        await this.showInstallPrompt();
    }

    showInstallSuccess() {
        console.log('✅ PWAInstallManager: App installed successfully');
        
        // Show success notification
        if (typeof window.showNotification === 'function') {
            window.showNotification({
                message: 'App installed successfully! Access it from your home screen.',
                type: 'success',
                duration: 5000
            });
        }
    }

    showManualInstallInstructions() {
        console.log('🔧 PWAInstallManager: Showing manual install instructions');
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let message = 'To install this app:\n\n';
        
        if (isIOS) {
            message += '1. Tap the Share button (📤)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
        } else if (isAndroid) {
            message += '1. Tap the menu (⋮)\n2. Tap "Install App" or "Add to Home screen"\n3. Tap "Install" to confirm';
        } else {
            message += '1. Look for "Install" or "Add to Home Screen" in your browser menu\n2. Or use Chrome/Edge: Three dots menu → "Install Contractor Reviews"';
        }
        
        // Use alert for now, could be replaced with a custom modal
        alert(message);
    }

    // Method to manually trigger install UI (for testing)
    triggerInstallUI() {
        console.log('🔧 PWAInstallManager: Manually triggering install UI');
        this.showInstallUI();
    }

    // Method to reset dismissal (for testing or user request)
    resetDismissal() {
        console.log('🔧 PWAInstallManager: Resetting dismissal state');
        this.clearDismissal();
        this.showInstallUI();
    }

    // Method to check if PWA can be installed
    canInstall() {
        return this.deferredPrompt !== null;
    }

    // Method to get installation status
    getInstallStatus() {
        return {
            canInstall: this.canInstall(),
            isInstalled: this.isInstalled,
            hasPrompt: this.deferredPrompt !== null,
            displayMode: this.getDisplayMode(),
            isDismissed: this.isBannerDismissed(),
            dismissalTime: localStorage.getItem('pwaInstallDismissed')
        };
    }

    // Debug method to force show the banner
    debugShowBanner() {
        console.log('🐛 PWAInstallManager: DEBUG - Forcing banner show');
        this.clearDismissal();
        this.showInstallBanner();
        if (this.installButton) {
            this.installButton.style.display = 'flex';
        }
    }
}

// Export a singleton instance
export const pwaInstallManager = new PWAInstallManager();

// Export for global access in console for debugging
window.pwaInstallManager = pwaInstallManager;
console.log('🔧 PWAInstallManager: Global instance available as window.pwaInstallManager');

// Add a global method to reset the install prompt
window.resetPWAInstallPrompt = function() {
    pwaInstallManager.resetDismissal();
    console.log('🔄 PWAInstallManager: Install prompt reset via global function');
};
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
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInstallPrompt();
        this.checkIfInstalled();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.installButton = document.getElementById('installNavItem');
            this.installBanner = document.getElementById('pwaInstallBanner');
            this.installBtn = document.getElementById('installPwaBtn');
            this.dismissBtn = document.getElementById('dismissInstallBtn');

            if (this.installButton) {
                this.installButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showInstallPrompt();
                });
            }

            if (this.installBtn) {
                this.installBtn.addEventListener('click', () => {
                    this.installApp();
                });
            }

            if (this.dismissBtn) {
                this.dismissBtn.addEventListener('click', () => {
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
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallUI();
            
            // Store that we have a prompt available
            localStorage.setItem('pwaPromptAvailable', 'true');
        });

        // Track when app is successfully installed
        window.addEventListener('appinstalled', (e) => {
            this.isInstalled = true;
            this.hideInstallUI();
            this.showInstallSuccess();
            
            // Clear any dismissal flags since app is installed
            this.clearDismissal();
        });

        // Check for prompt availability on page load
        if (localStorage.getItem('pwaPromptAvailable') === 'true') {
            this.checkAndShowBanner();
        }
    }

    checkIfInstalled() {
        // Method 1: Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            return;
        }
        
        // Method 2: Check if running as PWA
        if (window.navigator.standalone) {
            this.isInstalled = true;
            return;
        }
        
        // Method 3: Check referrer for PWA launch
        if (document.referrer.includes('android-app://')) {
            this.isInstalled = true;
            return;
        }

        if (this.isInstalled) {
            this.hideInstallUI();
        }
    }

    checkAndShowBanner() {
        if (this.isInstalled) {
            return;
        }

        if (this.isBannerDismissed()) {
            return;
        }

        if (this.deferredPrompt || localStorage.getItem('pwaPromptAvailable') === 'true') {
            this.showInstallUI();
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
            this.clearDismissal();
            return false;
        }

        return true;
    }

    dismissInstallBanner() {
        this.hideInstallBanner();
        
        // Store dismissal time instead of just a flag
        const dismissalTime = new Date().getTime();
        localStorage.setItem('pwaInstallDismissed', dismissalTime.toString());
        
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
        localStorage.removeItem('pwaInstallDismissed');
        sessionStorage.removeItem('pwaInstallDismissed');
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
        // Don't show if already installed or dismissed
        if (this.isInstalled) {
            return;
        }

        if (this.isBannerDismissed()) {
            return;
        }
        
        // Show install button in navigation
        if (this.installButton) {
            this.installButton.style.display = 'flex';
        }

        // Show banner after a short delay (non-intrusive)
        setTimeout(() => {
            if (this.installBanner && !this.isInstalled && !this.isBannerDismissed()) {
                this.installBanner.classList.remove('hidden');
            }
        }, 1000);
    }

    hideInstallUI() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
        this.hideInstallBanner();
    }

    showInstallBanner() {
        if (this.installBanner && !this.isInstalled && !this.isBannerDismissed()) {
            this.installBanner.classList.remove('hidden');
        }
    }

    hideInstallBanner() {
        if (this.installBanner) {
            this.installBanner.classList.add('hidden');
        }
    }

    async showInstallPrompt() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.deferredPrompt = null;
                localStorage.removeItem('pwaPromptAvailable');
            } else {
                // Don't dismiss the banner completely, just hide it for now
                this.hideInstallBanner();
            }
        } else {
            this.showManualInstallInstructions();
        }
    }

    async installApp() {
        await this.showInstallPrompt();
    }

    showInstallSuccess() {
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
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let message = 'To install this app:\n\n';
        
        if (isIOS) {
            message += '1. Tap the Share button (📤)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
        } else if (isAndroid) {
            message += '1. Tap the menu (⋮)\n2. Tap "Install App" or "Add to Home screen"\n3. Tap "Install" to confirm';
        } else {
            message += '1. Look for "Install" or "Add to Home Screen" in your browser menu\n2. Or use Chrome/Edge: Three dots menu → "Install Service Provider Reviews"';
        }
        
        // Use alert for now, could be replaced with a custom modal
        alert(message);
    }

    // Method to manually trigger install UI (for testing)
    triggerInstallUI() {
        this.showInstallUI();
    }

    // Method to reset dismissal (for testing or user request)
    resetDismissal() {
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

// Add a global method to reset the install prompt
window.resetPWAInstallPrompt = function() {
    pwaInstallManager.resetDismissal();
};
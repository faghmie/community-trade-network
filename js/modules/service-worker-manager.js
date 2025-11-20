// js/modules/service-worker-manager.js
import { 
    showNotification, 
    showInfo,
    showSyncNotification,
    showNetworkStatusNotification 
} from './notifications.js';

export class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
        this.offlineNotification = null;
    }

    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('ℹ️ Service Workers not supported');
            return;
        }

        try {
            this.registration = await navigator.serviceWorker.ready;
            console.log('🎯 Service Worker ready:', this.registration.scope);
            
            this.setupMessageHandling();
            this.setupUpdateHandling();
            this.setupNetworkMonitoring();
            
        } catch (error) {
            console.error('❌ Service Worker initialization failed:', error);
        }
    }

    setupMessageHandling() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event.data);
        });
    }

    setupUpdateHandling() {
        if (this.registration) {
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                console.log('🔄 New Service Worker found, installing...');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('📦 New content available');
                        this.handleUpdateAvailable();
                    }
                });
            });
        }
    }

    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.handleNetworkStatusChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleNetworkStatusChange(false);
        });
    }

    handleServiceWorkerMessage(data) {
        console.log('📨 Service Worker message:', data);
        
        switch (data.type) {
            case 'APP_UPDATE_AVAILABLE':
                this.handleUpdateAvailable(data);
                break;
                
            case 'CACHE_UPDATED':
                this.handleCacheUpdated(data);
                break;
                
            case 'SYNC_STATUS':
                this.handleSyncStatus(data);
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleUpdateAvailable(data = {}) {
        this.updateAvailable = true;
        
        showNotification({
            message: data.message || 'A new version of the app is available!',
            title: 'Update Available',
            type: 'info',
            persistent: true,
            actionText: 'Refresh',
            onAction: () => this.refreshApp()
        });
        
        if (typeof window.showAppUpdateNotification === 'function') {
            window.showAppUpdateNotification();
        }
    }

    handleCacheUpdated(data) {
        console.log('🔄 Cache updated:', data.url);
        
        if (data.url && data.url.includes('/api/')) {
            showInfo('Data updated with latest changes');
        }
    }

    handleSyncStatus(data) {
        const { status, message, progress } = data;
        
        showSyncNotification(
            message || `Sync ${status}`,
            status,
            progress,
            `sw-sync-${Date.now()}`
        );
    }

    handleNetworkStatusChange(isOnline) {
        showNetworkStatusNotification(isOnline);
    }

    async refreshApp() {
        console.log('🔄 Refreshing application...');
        
        if (this.registration?.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        
        window.location.reload();
    }

    async checkForUpdates() {
        if (this.registration) {
            await this.registration.update();
        }
    }

    async getCacheInfo() {
        if (!this.registration) return null;
        
        try {
            const channel = new MessageChannel();
            
            return new Promise((resolve) => {
                channel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                navigator.serviceWorker.controller?.postMessage(
                    { type: 'GET_CACHE_INFO' },
                    [channel.port2]
                );
            });
        } catch (error) {
            console.error('Failed to get cache info:', error);
            return null;
        }
    }
}
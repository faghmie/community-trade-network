// js/app/lazyLoader.js
// ES6 Module for lazy loading functionality

export class LazyLoader {
    constructor(config = {}) {
        this.config = {
            enabled: true,
            batchSize: config.batchSize || 12,
            placeholderCount: config.placeholderCount || 8,
            loadingDelay: config.loadingDelay || 300,
            rootMargin: config.rootMargin || '100px',
            threshold: config.threshold || 0.1,
            ...config
        };
        
        this.currentIndex = 0;
        this.isLoading = false;
        this.allContractors = [];
        this.observer = null;
        this.elements = {};
        
        // Callbacks
        this.onBatchLoad = null;
        this.onLoadingStateChange = null;
    }

    async init(containerElement, cardManager) {
        this.containerElement = containerElement;
        this.cardManager = cardManager;
        this.cacheElements();
        this.setupDOMElements();
        this.setupIntersectionObserver();
    }

    cacheElements() {
        this.elements = {
            contractorsGrid: this.containerElement,
            lazyLoadingTrigger: document.getElementById('lazyLoadingTrigger'),
            loadingIndicator: document.getElementById('loadingIndicator')
        };
    }

    setupDOMElements() {
        // Create lazy loading trigger element if it doesn't exist
        if (!this.elements.lazyLoadingTrigger) {
            const trigger = document.createElement('div');
            trigger.id = 'lazyLoadingTrigger';
            trigger.className = 'lazy-loading-trigger hidden';
            document.body.appendChild(trigger);
            this.elements.lazyLoadingTrigger = trigger;
        }

        // Create loading indicator if it doesn't exist
        if (!this.elements.loadingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.className = 'loading-indicator hidden';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Loading more contractors...</p>
            `;
            this.elements.contractorsGrid.parentNode.appendChild(indicator);
            this.elements.loadingIndicator = indicator;
        }
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && 
                    !this.isLoading && 
                    this.currentIndex < this.allContractors.length) {
                    this.loadNextBatch();
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });

        // Observe the trigger element
        if (this.elements.lazyLoadingTrigger) {
            this.observer.observe(this.elements.lazyLoadingTrigger);
        }
    }

    loadNextBatch() {
        if (this.isLoading || !this.config.enabled) return;

        this.isLoading = true;
        this.setLoadingState(true);

        const startIndex = this.currentIndex;
        const endIndex = Math.min(
            startIndex + this.config.batchSize,
            this.allContractors.length
        );

        const batch = this.allContractors.slice(startIndex, endIndex);

        // Simulate loading delay for better UX
        setTimeout(() => {
            this.renderContractorBatch(batch);
            this.currentIndex = endIndex;
            this.isLoading = false;
            this.setLoadingState(false);

            // Update trigger visibility
            this.updateLazyLoadingTrigger();

            // Notify about batch load
            if (this.onBatchLoad) {
                this.onBatchLoad(batch, this.currentIndex, this.allContractors.length);
            }

            console.log(`LazyLoader: Loaded ${batch.length} contractors (${endIndex}/${this.allContractors.length})`);
        }, this.config.loadingDelay);
    }

    renderContractorBatch(contractors) {
        const fragment = document.createDocumentFragment();
        
        contractors.forEach(contractor => {
            const card = this.cardManager.createContractorCard(contractor);
            if (card) {
                fragment.appendChild(card);
            }
        });

        this.elements.contractorsGrid.appendChild(fragment);
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.showLoadingIndicator();
        } else {
            this.hideLoadingIndicator();
        }

        if (this.onLoadingStateChange) {
            this.onLoadingStateChange(isLoading);
        }
    }

    showLoadingIndicator() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.classList.remove('hidden');
        }
    }

    hideLoadingIndicator() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.classList.add('hidden');
        }
    }

    updateLazyLoadingTrigger() {
        const trigger = this.elements.lazyLoadingTrigger;
        if (!trigger) return;

        const hasMore = this.currentIndex < this.allContractors.length;
        
        if (hasMore) {
            trigger.classList.remove('hidden');
        } else {
            trigger.classList.add('hidden');
        }
    }

    createSkeletonPlaceholders(count) {
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < count; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'contractor-card skeleton-card';
            skeletonCard.innerHTML = `
                <div class="card-header skeleton">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text-container">
                        <div class="skeleton-text large"></div>
                        <div class="skeleton-text medium"></div>
                    </div>
                </div>
                <div class="card-body skeleton">
                    <div class="skeleton-text small"></div>
                    <div class="skeleton-text small"></div>
                    <div class="skeleton-text medium"></div>
                </div>
                <div class="card-footer skeleton">
                    <div class="skeleton-button"></div>
                    <div class="skeleton-button"></div>
                </div>
            `;
            fragment.appendChild(skeletonCard);
        }
        
        return fragment;
    }

    render(contractors, showSkeletons = true) {
        // Reset state
        this.reset();
        this.allContractors = contractors;

        // Clear the grid
        this.elements.contractorsGrid.innerHTML = '';

        if (this.config.enabled && contractors.length > this.config.batchSize) {
            // Show skeleton placeholders for initial load
            if (showSkeletons) {
                const initialPlaceholders = this.createSkeletonPlaceholders(Math.min(
                    this.config.placeholderCount,
                    contractors.length
                ));
                this.elements.contractorsGrid.appendChild(initialPlaceholders);
            }

            // Load first batch
            setTimeout(() => {
                this.loadNextBatch();
            }, 100);
        } else {
            // If lazy loading is disabled or few contractors, render all at once
            this.cardManager.renderContractorCards(contractors, this.elements.contractorsGrid);
        }
    }

    reset() {
        this.currentIndex = 0;
        this.allContractors = [];
        this.isLoading = false;
        this.hideLoadingIndicator();
        this.updateLazyLoadingTrigger();
    }

    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled) {
            this.reset();
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Event callbacks
    onBatchLoad(callback) {
        this.onBatchLoad = callback;
        return this;
    }

    onLoadingStateChange(callback) {
        this.onLoadingStateChange = callback;
        return this;
    }

    // Utility methods
    getProgress() {
        return {
            loaded: this.currentIndex,
            total: this.allContractors.length,
            percent: this.allContractors.length > 0 ? (this.currentIndex / this.allContractors.length) * 100 : 0
        };
    }

    hasMore() {
        return this.currentIndex < this.allContractors.length;
    }
}
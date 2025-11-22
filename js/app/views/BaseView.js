// js/app/views/BaseView.js - Simple base view class
export class BaseView {
    constructor(viewId) {
        this.viewId = viewId;
        this.container = null;
        this.isVisible = false;
    }

    /**
     * Simple show/hide methods
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Check if view is currently visible
     */
    isViewVisible() {
        return this.isVisible;
    }

    /**
     * Simple render method - to be overridden by subclasses
     */
    render() {
        // Override in subclasses
    }

    /**
     * Simple cleanup
     */
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
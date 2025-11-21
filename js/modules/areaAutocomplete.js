// js/modules/areaAutocomplete.js
export class AreaAutocomplete {
    constructor(geocodingService, locationData) {
        this.geocodingService = geocodingService;
        this.locationData = locationData;
        this.container = null;
        this.input = null;
        this.suggestionsList = null;
        self.isOpen = false;
        self.currentProvince = null;
        
        this.init = this.init.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleSuggestionClick = this.handleSuggestionClick.bind(this);
        this.hideSuggestions = this.hideSuggestions.bind(this);
    }

    init(containerId, inputId, province) {
        this.container = document.getElementById(containerId);
        this.input = document.getElementById(inputId);
        this.currentProvince = province;

        if (!this.container || !this.input) {
            console.error('AreaAutocomplete: Container or input not found');
            return;
        }

        // Create suggestions list
        this.suggestionsList = document.createElement('ul');
        this.suggestionsList.className = 'area-suggestions';
        this.suggestionsList.style.display = 'none';
        this.container.appendChild(this.suggestionsList);

        // Bind events
        this.input.addEventListener('input', this.handleInput);
        this.input.addEventListener('focus', () => {
            if (this.input.value.length >= 2) {
                this.handleInput();
            }
        });
        this.input.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 150);
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    async handleInput() {
        const value = this.input.value.trim();
        
        if (!this.currentProvince || value.length < 2) {
            this.hideSuggestions();
            return;
        }

        try {
            const suggestions = await this.geocodingService.getAreaSuggestions(
                this.currentProvince, 
                value,
                { limit: 8, debounceMs: 300 }
            );

            this.displaySuggestions(suggestions);
        } catch (error) {
            console.warn('AreaAutocomplete: Failed to get suggestions:', error);
            this.displaySuggestions(this.getFallbackSuggestions(value));
        }
    }

    displaySuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.suggestionsList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.className = 'area-suggestion';
            li.textContent = suggestion;
            li.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent input blur
                this.handleSuggestionClick(suggestion);
            });
            this.suggestionsList.appendChild(li);
        });

        this.suggestionsList.style.display = 'block';
        self.isOpen = true;
    }

    handleSuggestionClick(suggestion) {
        this.input.value = suggestion;
        this.hideSuggestions();
        
        // Trigger change event for geocoding
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    hideSuggestions() {
        if (this.suggestionsList) {
            this.suggestionsList.style.display = 'none';
            self.isOpen = false;
        }
    }

    getFallbackSuggestions(prefix) {
        if (!this.currentProvince || !this.locationData) return [];
        
        const provinceData = this.locationData.southAfricanProvinces[this.currentProvince];
        if (!provinceData) return [];

        const prefixLower = prefix.toLowerCase();
        return provinceData.cities
            .filter(city => city.toLowerCase().startsWith(prefixLower))
            .slice(0, 5);
    }

    setProvince(province) {
        this.currentProvince = province;
        this.geocodingService.clearAreaSuggestionsCache(province);
        this.input.value = '';
        this.hideSuggestions();
    }

    destroy() {
        if (this.input) {
            this.input.removeEventListener('input', this.handleInput);
        }
        if (this.suggestionsList) {
            this.suggestionsList.remove();
        }
    }
}
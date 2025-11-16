// js/data/defaultData.js
// Main aggregator file for all default data using ES6 modules

import { defaultCategories } from './defaultCategories.js';
import { defaultContractors } from './defaultContractors.js';
import { defaultReviews } from './defaultReviews.js';
import { southAfricanProvinces, southAfricanCityCoordinates } from './defaultLocations.js';

export const defaultData = {
    categories: defaultCategories,
    contractors: defaultContractors,
    reviews: defaultReviews,
    locations: {
        provinces: southAfricanProvinces,
        cityCoordinates: southAfricanCityCoordinates
    }
};

// Individual exports for modules that need specific data
export { defaultCategories, defaultContractors, defaultReviews, southAfricanProvinces, southAfricanCityCoordinates };
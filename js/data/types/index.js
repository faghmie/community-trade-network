// js/data/types/index.js
// Central export file for all type definitions

export { LocationTypes } from './locationTypes.js';
export { CategoryTypes } from './categoryTypes.js';
export { ContractorTypes } from './contractorTypes.js';
export { ReviewTypes } from './reviewTypes.js';
export { FeedbackTypes } from './feedbackTypes.js';
export { UuidTypes } from './uuidTypes.js';

// Re-export individual types for direct usage
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 * 
 * @typedef {import('./locationTypes.js').ProvinceData} ProvinceData
 * @typedef {import('./locationTypes.js').SouthAfricanProvinces} SouthAfricanProvinces
 * @typedef {import('./locationTypes.js').CityCoordinates} CityCoordinates
 * @typedef {import('./locationTypes.js').Location} Location
 * 
 * @typedef {import('./categoryTypes.js').Category} Category
 * @typedef {import('./categoryTypes.js').CategoryMap} CategoryMap
 * @typedef {import('./categoryTypes.js').CategoryHierarchy} CategoryHierarchy
 * 
 * @typedef {import('./contractorTypes.js').Coordinates} Coordinates
 * @typedef {import('./contractorTypes.js').Contractor} Contractor
 * @typedef {import('./contractorTypes.js').ContractorSummary} ContractorSummary
 * @typedef {import('./contractorTypes.js').ContractorMap} ContractorMap
 * @typedef {import('./contractorTypes.js').ContractorWithReviews} ContractorWithReviews
 * @typedef {import('./contractorTypes.js').ContractorFilters} ContractorFilters
 * @typedef {import('./contractorTypes.js').ContractorCreateData} ContractorCreateData
 * @typedef {import('./contractorTypes.js').ContractorUpdateData} ContractorUpdateData
 * @typedef {import('./contractorTypes.js').ContractorSearchResults} ContractorSearchResults
 * 
 * @typedef {import('./reviewTypes.js').CategoryRatings} CategoryRatings
 * @typedef {import('./reviewTypes.js').Review} Review
 * @typedef {import('./reviewTypes.js').ReviewSummary} ReviewSummary
 * @typedef {import('./reviewTypes.js').ContractorRatingStats} ContractorRatingStats
 * @typedef {import('./reviewTypes.js').ReviewMap} ReviewMap
 * 
 * @typedef {import('./feedbackTypes.js').FeedbackStatus} FeedbackStatus
 * @typedef {import('./feedbackTypes.js').PageContext} PageContext
 * @typedef {import('./feedbackTypes.js').FeatureContext} FeatureContext
 * @typedef {import('./feedbackTypes.js').UserFeedback} UserFeedback
 * @typedef {import('./feedbackTypes.js').FeedbackSummary} FeedbackSummary
 * @typedef {import('./feedbackTypes.js').FeedbackStats} FeedbackStats
 * @typedef {import('./feedbackTypes.js').FeedbackFilters} FeedbackFilters
 * @typedef {import('./feedbackTypes.js').FeedbackCreateData} FeedbackCreateData
 * @typedef {import('./feedbackTypes.js').FeedbackUpdateData} FeedbackUpdateData
 * @typedef {import('./feedbackTypes.js').FeedbackMap} FeedbackMap
 * @typedef {import('./feedbackTypes.js').FeedbackSearchResults} FeedbackSearchResults
 */

export const AppTypes = {};
// js/data/types/categoryTypes.js
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 */

/**
 * @typedef {Object} Category
 * @property {string} name - The display name of the category (e.g., "Jewelery")
 * @property {string} type - The main type or grouping (e.g., "Business Services")
 * @property {string} subtype - The specific subtype (e.g., "Cosmetics")
 * @property {string} description - Detailed description of what services this category includes
 * @property {UUID} [id] - Optional unique identifier for the category (UUID)
 * @property {string} [icon] - Optional icon or image reference for UI display
 * @property {string} [color] - Optional color for UI theming
 * @property {number} [sortOrder] - Optional sorting order
 * @property {boolean} [isActive] - Optional active status
 * @example
 * {
 *   name: "Jewelery",
 *   type: "Business Services", 
 *   subtype: "Cosmetics",
 *   description: "Build, repair, clean or polish jewelery",
 *   id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   isActive: true
 * }
 */

/**
 * @typedef {Object.<UUID, Category>} CategoryMap
 * Key: Category ID (UUID)
 * Value: Category object
 * @example
 * {
 *   "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
 *     name: "Jewelery",
 *     type: "Business Services",
 *     subtype: "Cosmetics",
 *     description: "Build, repair, clean or polish jewelery"
 *   }
 * }
 */

/**
 * @typedef {Object} CategoryHierarchy
 * @property {string} type - The main category type
 * @property {string[]} subtypes - Array of available subtypes for this type
 * @property {Category[]} categories - Array of categories belonging to this type
 * @example
 * {
 *   type: "Business Services",
 *   subtypes: ["Cosmetics", "Consulting", "Marketing"],
 *   categories: [/* array of Category objects *\/]
 * }
 */

// Export for JSDoc usage
export const CategoryTypes = {};
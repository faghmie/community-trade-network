// js/data/types/contractorTypes.js
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 * @typedef {import('./reviewTypes.js').ContractorRatingStats} ContractorRatingStats
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude coordinate
 * @property {number} lng - Longitude coordinate
 * @example
 * {
 *   lat: -33.9249,
 *   lng: 18.4241
 * }
 */

/**
 * @typedef {Object} Contractor
 * @property {string} name - Contractor's full name or business name
 * @property {string} [email] - Optional email address
 * @property {string} phone - Phone number (required for community contact)
 * @property {number} rating - Current average rating (0-5)
 * @property {string} [website] - Optional website URL
 * @property {string} category - Primary service category
 * @property {string} [location] - Optional general location description
 * @property {Coordinates} [coordinates] - Optional precise coordinates
 * @property {number} reviewCount - Total number of reviews
 * @property {string[]} serviceAreas - Array of areas where services are offered
 * @property {number} overallRating - Overall rating (may be same as rating)
 * @property {UUID} [id] - Optional unique identifier (UUID)
 * @property {string} description - Business/service description (required for community context)
 * @property {string[]} [services] - Optional array of specific services offered
 * @property {string} [yearsInBusiness] - Optional years of experience
 * @property {boolean} [isVerified] - Optional verification status
 * @property {string} [logo] - Optional logo image URL
 * @property {string[]} [images] - Optional array of business images
 * @property {Date|string} [dateAdded] - Optional date when contractor was added
 * @property {boolean} [isActive] - Optional active status
 * @property {ContractorRatingStats} [ratingStats] - Optional detailed rating statistics
 * @property {string[]} [projectTypes] - Optional array of project types offered
 * @property {string} [businessHours] - Optional business hours description
 * @property {string} [emergencyContact] - Optional emergency contact info
 * @example
 * {
 *   id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   name: "Shafiek Anthony",
 *   email: "",
 *   phone: "0733627226",
 *   rating: 4.2,
 *   website: "",
 *   category: "Garage Doors & Gates",
 *   location: "Bonteheuwel, Western Cape",
 *   coordinates: {
 *     lat: -33.9249,
 *     lng: 18.4241
 *   },
 *   reviewCount: 1,
 *   serviceAreas: [
 *     "Bonteheuwel",
 *     "Western Cape"
 *   ],
 *   overallRating: 4.2,
 *   description: "Professional garage door and gate installation, repair and maintenance services with 5+ years experience",
 *   services: ["Gate Repair", "Garage Door Installation", "Maintenance"],
 *   yearsInBusiness: "5+ years",
 *   isVerified: true,
 *   isActive: true
 * }
 */

/**
 * @typedef {Object} ContractorSummary
 * @property {UUID} id - Contractor ID (UUID)
 * @property {string} name - Contractor name
 * @property {number} rating - Average rating
 * @property {number} reviewCount - Number of reviews
 * @property {string} category - Service category
 * @property {string} [location] - Optional location description
 * @property {string} phone - Phone number
 * @property {boolean} [isVerified] - Verification status
 * @property {string} description - Service description for community context
 * @property {Coordinates} [coordinates] - Optional coordinates for mapping
 * @property {string[]} [serviceAreas] - Optional service areas
 * @example
 * {
 *   id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   name: "Shafiek Anthony",
 *   rating: 4.5,
 *   reviewCount: 12,
 *   category: "Garage Doors & Gates",
 *   location: "Bonteheuwel, Western Cape",
 *   phone: "0733627226",
 *   isVerified: true,
 *   description: "Professional garage door installation and repair services",
 *   coordinates: {
 *     lat: -33.9249,
 *     lng: 18.4241
 *   },
 *   serviceAreas: ["Bonteheuwel", "Western Cape"]
 * }
 */

/**
 * @typedef {Object} ContractorFilters
 * @property {string} [search] - Search term for name or description
 * @property {string} [category] - Filter by category
 * @property {string} [location] - Filter by location
 * @property {number} [minRating] - Minimum rating filter
 * @property {boolean} [verifiedOnly] - Show only verified contractors
 * @property {string[]} [serviceAreas] - Filter by service areas
 * @property {string} [sortBy] - Sort field (rating, reviewCount, name)
 * @property {string} [sortOrder] - Sort order (asc, desc)
 * @example
 * {
 *   search: "garage",
 *   category: "Garage Doors & Gates",
 *   location: "Western Cape",
 *   minRating: 4,
 *   verifiedOnly: true,
 *   sortBy: "rating",
 *   sortOrder: "desc"
 * }
 */

/**
 * @typedef {Object} ContractorCreateData
 * @property {string} name - Contractor name (required)
 * @property {string} [email] - Optional email
 * @property {string} phone - Phone number (required for community contact)
 * @property {string} category - Service category (required)
 * @property {string} [location] - Optional location
 * @property {Coordinates} [coordinates] - Optional coordinates
 * @property {string[]} [serviceAreas] - Optional service areas
 * @property {string} description - Service description (required for community context)
 * @property {string[]} [services] - Optional services list
 * @property {string} [yearsInBusiness] - Optional years in business
 * @property {string} [website] - Optional website
 * @example
 * {
 *   name: "Shafiek Anthony",
 *   phone: "0733627226",
 *   category: "Garage Doors & Gates",
 *   description: "Professional garage door installation and repair with 5+ years experience",
 *   // Optional fields:
 *   location: "Bonteheuwel, Western Cape",
 *   coordinates: {
 *     lat: -33.9249,
 *     lng: 18.4241
 *   },
 *   serviceAreas: ["Bonteheuwel", "Western Cape"],
 *   website: "https://example.com"
 * }
 */

/**
 * @typedef {Object} ContractorQuickAddData
 * @property {string} name - Contractor name (required)
 * @property {string} phone - Phone number (required)
 * @property {string} category - Service category (required)
 * @property {string} description - Service description (required)
 * @example
 * {
 *   name: "Shafiek Anthony",
 *   phone: "0733627226",
 *   category: "Garage Doors & Gates",
 *   description: "Professional garage door installation and repair services"
 * }
 */

/**
 * @typedef {Object} ContractorUpdateData
 * @property {string} [name] - Updated name
 * @property {string} [email] - Updated email
 * @property {string} [phone] - Updated phone
 * @property {string} [category] - Updated category
 * @property {string} [location] - Updated location
 * @property {Coordinates} [coordinates] - Updated coordinates
 * @property {string[]} [serviceAreas] - Updated service areas
 * @property {string} [description] - Updated description
 * @property {string[]} [services] - Updated services list
 * @property {string} [yearsInBusiness] - Updated years in business
 * @property {string} [website] - Updated website
 * @property {boolean} [isVerified] - Updated verification status
 * @property {boolean} [isActive] - Updated active status
 * @example
 * {
 *   phone: "0733627227",
 *   description: "Professional garage door services with emergency repair available",
 *   serviceAreas: ["Bonteheuwel", "Western Cape", "Cape Town"],
 *   isVerified: true
 * }
 */

/**
 * @typedef {Object.<UUID, Contractor>} ContractorMap
 * Key: Contractor ID (UUID)
 * Value: Full Contractor object
 * @example
 * {
 *   "f47ac10b-58cc-4372-a567-0e02b2c3d479": {
 *     name: "Shafiek Anthony",
 *     phone: "0733627226",
 *     category: "Garage Doors & Gates",
 *     description: "Professional garage door services",
 *     // ... full contractor data
 *   }
 * }
 */

/**
 * @typedef {Object} ContractorWithReviews
 * @property {Contractor} contractor - Contractor data
 * @property {import('./reviewTypes.js').Review[]} reviews - Array of reviews for this contractor
 * @example
 * {
 *   contractor: {
 *     id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *     name: "Shafiek Anthony",
 *     description: "Professional garage door services",
 *     // ... contractor data
 *   },
 *   reviews: [
 *     {
 *       id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *       contractor_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *       date: "2025-11-21T14:11:02.357Z",
 *       rating: 4,
 *       comment: "Great service, fixed my garage door quickly.",
 *       // ... review data
 *     }
 *   ]
 * }
 */

/**
 * @typedef {Object} ContractorSearchResults
 * @property {ContractorSummary[]} contractors - Array of contractor summaries
 * @property {number} totalCount - Total number of matching contractors
 * @property {number} page - Current page number
 * @property {number} pageSize - Number of results per page
 * @property {number} totalPages - Total number of pages
 * @property {ContractorFilters} appliedFilters - Filters that were applied
 * @example
 * {
 *   contractors: [
 *     {
 *       id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *       name: "Shafiek Anthony",
 *       rating: 4.5,
 *       reviewCount: 12,
 *       category: "Garage Doors & Gates",
 *       description: "Professional garage door installation and repair",
 *       location: "Bonteheuwel, Western Cape"
 *     }
 *   ],
 *   totalCount: 1,
 *   page: 1,
 *   pageSize: 20,
 *   totalPages: 1,
 *   appliedFilters: {
 *     category: "Garage Doors & Gates",
 *     location: "Western Cape"
 *   }
 * }
 */

// Export for JSDoc usage
export const ContractorTypes = {};
// js/data/types/recommendationTypes.js
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 */

/**
 * @typedef {Object} RecommendationMetrics
 * @property {number} quality - Rating for quality of work (1-5)
 * @property {number} timeliness - Rating for timeliness (1-5)
 * @property {number} communication - Rating for communication (1-5)
 * @property {number} value - Rating for value for money (1-5)
 * @example
 * {
 *   quality: 5,
 *   timeliness: 4,
 *   communication: 5,
 *   value: 4
 * }
 */

/**
 * @typedef {Object} CommunityRecommendation
 * @property {UUID} id - Unique recommendation identifier (UUID)
 * @property {UUID} contractor_id - ID of the service provider being recommended (UUID)
 * @property {string} submissionDate - Recommendation date in ISO format
 * @property {string} serviceUsed - Type of service used (e.g., "Garage Door Repair", "Plumbing Installation")
 * @property {string} serviceDate - Date when service was performed (YYYY-MM)
 * @property {string} endorsementNote - Personal recommendation note
 * @property {string} referrerName - Name of the neighbor making recommendation
 * @property {string} referrerPhone - Phone number of the referrer (for verification)
 * @property {string} referrerNeighborhood - Neighborhood where referrer lives
 * @property {'homeowner'|'renter'|'business'} referrerType - Type of relationship to property/business
 * @property {RecommendationMetrics} metrics - Detailed quality metrics
 * @property {boolean} wouldRecommendToNeighbors - Whether they'd recommend to neighbors
 * @property {boolean} [isAnonymous] - Optional anonymous recommendation
 * @property {string[]} [photos] - Optional array of photo URLs
 * @property {boolean} [isVerified] - Whether the recommendation is community-verified
 * @property {string} [moderationStatus] - Optional moderation status ("pending", "approved", "rejected")
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   contractor_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   submissionDate: "2025-11-21T14:11:02.357Z",
 *   serviceUsed: "Garage Door Repair",
 *   serviceDate: "2024-01",
 *   endorsementNote: "Shafiek provided excellent service and fixed my garage door quickly. Very professional!",
 *   referrerName: "Sarah Johnson",
 *   referrerPhone: "0831234567",
 *   referrerNeighborhood: "Bonteheuwel",
 *   referrerType: "homeowner",
 *   metrics: {
 *     quality: 5,
 *     timeliness: 4,
 *     communication: 5,
 *     value: 4
 *   },
 *   wouldRecommendToNeighbors: true,
 *   isVerified: true
 * }
 */

/**
 * @typedef {Object} RecommendationSummary
 * @property {UUID} id - Recommendation ID (UUID)
 * @property {string} referrerName - Neighbor's name
 * @property {string} endorsementNote - Shortened recommendation note
 * @property {string} submissionDate - Formatted date
 * @property {string} serviceUsed - Type of service
 * @property {boolean} wouldRecommendToNeighbors - Recommendation status
 * @property {string} referrerNeighborhood - Neighbor's location
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   referrerName: "Sarah Johnson",
 *   endorsementNote: "Shafiek provided excellent service...",
 *   submissionDate: "2 weeks ago",
 *   serviceUsed: "Garage Door Repair",
 *   wouldRecommendToNeighbors: true,
 *   referrerNeighborhood: "Bonteheuwel"
 * }
 */

/**
 * @typedef {Object} ProviderTrustMetrics
 * @property {number} trustScore - Overall trust score (0-100)
 * @property {number} recommendationRate - Percentage who would recommend to neighbors
 * @property {number} quality - Average quality metric
 * @property {number} timeliness - Average timeliness metric
 * @property {number} communication - Average communication metric
 * @property {number} value - Average value metric
 * @property {number} totalRecommendations - Total number of recommendations
 * @property {number} verifiedNeighborCount - Number of recommendations with contact details
 * @property {Object.<string, number>} serviceTypeDistribution - Counts by service type
 * @property {Object.<string, number>} neighborhoodDistribution - Counts by referrer neighborhood
 * @example
 * {
 *   trustScore: 92,
 *   recommendationRate: 95,
 *   quality: 4.7,
 *   timeliness: 4.8,
 *   communication: 4.5,
 *   value: 4.6,
 *   totalRecommendations: 15,
 *   verifiedNeighborCount: 12,
 *   serviceTypeDistribution: {
 *     "Garage Door Repair": 8,
 *     "Gate Installation": 4,
 *     "Emergency Services": 3
 *   },
 *   neighborhoodDistribution: {
 *     "Bonteheuwel": 10,
 *     "Langa": 3,
 *     "Athlone": 2
 *   }
 * }
 */

/**
 * @typedef {Object.<UUID, CommunityRecommendation>} RecommendationMap
 * Key: Recommendation ID (UUID)
 * Value: CommunityRecommendation object
 * @example
 * {
 *   "a1b2c3d4-1234-5678-9012-abcdef123456": {
 *     submissionDate: "2025-11-21T14:11:02.357Z",
 *     serviceUsed: "Garage Door Repair",
 *     endorsementNote: "Excellent service!",
 *     contractor_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *     // ... full recommendation data
 *   }
 * }
 */

// Export for JSDoc usage
export const RecommendationTypes = {};
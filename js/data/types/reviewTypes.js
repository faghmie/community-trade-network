// js/data/types/reviewTypes.js
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 */

/**
 * @typedef {Object} CategoryRatings
 * @property {number} value - Rating for value for money (1-5)
 * @property {number} quality - Rating for quality of work (1-5)
 * @property {number} timeliness - Rating for timeliness (1-5)
 * @property {number} communication - Rating for communication (1-5)
 * @example
 * {
 *   value: 5,
 *   quality: 3,
 *   timeliness: 5,
 *   communication: 4
 * }
 */

/**
 * @typedef {Object} Review
 * @property {UUID} id - Unique review identifier (UUID)
 * @property {UUID} contractor_id - ID of the contractor being reviewed (UUID)
 * @property {string} date - Review date in ISO format
 * @property {number} rating - Overall rating from 1 to 5
 * @property {string} comment - Review comment text
 * @property {string} projectType - Type of project (e.g., "Other", "Repair", "Installation")
 * @property {string} reviewerName - Name of the reviewer
 * @property {CategoryRatings} categoryRatings - Detailed ratings by category
 * @property {boolean} [verified] - Whether the review is verified
 * @property {string} [reviewerEmail] - Optional reviewer email
 * @property {string} [reviewerPhone] - Optional reviewer phone
 * @property {string} [serviceDate] - Optional date when service was performed
 * @property {number} [cost] - Optional project cost
 * @property {string} [costCurrency] - Optional currency for cost (default: "ZAR")
 * @property {boolean} [wouldRecommend] - Optional would recommend to others
 * @property {string[]} [photos] - Optional array of photo URLs
 * @property {boolean} [isActive] - Optional active status for moderation
 * @property {string} [moderationStatus] - Optional moderation status ("pending", "approved", "rejected")
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   contractor_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *   date: "2025-11-21T14:11:02.357Z",
 *   rating: 4,
 *   comment: "Great mechanic.",
 *   projectType: "Other",
 *   reviewerName: "Faghmie",
 *   categoryRatings: {
 *     value: 5,
 *     quality: 3,
 *     timeliness: 5,
 *     communication: 4
 *   },
 *   verified: true,
 *   wouldRecommend: true
 * }
 */

/**
 * @typedef {Object} ReviewSummary
 * @property {UUID} id - Review ID (UUID)
 * @property {string} reviewerName - Reviewer name
 * @property {number} rating - Overall rating
 * @property {string} comment - Shortened comment
 * @property {string} date - Formatted date
 * @property {string} projectType - Type of project
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   reviewerName: "Faghmie",
 *   rating: 4,
 *   comment: "Great mechanic...",
 *   date: "2 weeks ago",
 *   projectType: "Other"
 * }
 */

/**
 * @typedef {Object} ContractorRatingStats
 * @property {number} overall - Overall average rating
 * @property {number} value - Average value rating
 * @property {number} quality - Average quality rating
 * @property {number} timeliness - Average timeliness rating
 * @property {number} communication - Average communication rating
 * @property {number} totalReviews - Total number of reviews
 * @property {number[]} ratingDistribution - Array of counts for ratings 1-5
 * @property {Object.<string, number>} projectTypeDistribution - Counts by project type
 * @example
 * {
 *   overall: 4.2,
 *   value: 4.5,
 *   quality: 3.8,
 *   timeliness: 4.7,
 *   communication: 4.1,
 *   totalReviews: 15,
 *   ratingDistribution: [0, 1, 3, 8, 3], // 1-star to 5-star counts
 *   projectTypeDistribution: {
 *     "Repair": 8,
 *     "Installation": 4,
 *     "Other": 3
 *   }
 * }
 */

/**
 * @typedef {Object.<UUID, Review>} ReviewMap
 * Key: Review ID (UUID)
 * Value: Review object
 * @example
 * {
 *   "a1b2c3d4-1234-5678-9012-abcdef123456": {
 *     date: "2025-11-21T14:11:02.357Z",
 *     rating: 4,
 *     comment: "Great mechanic.",
 *     contractor_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
 *     // ... full review data
 *   }
 * }
 */

// Export for JSDoc usage
export const ReviewTypes = {};
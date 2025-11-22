// js/data/types/feedbackTypes.js
/**
 * @typedef {import('./uuidTypes.js').UUID} UUID
 */

/**
 * @typedef {"new" | "read" | "archived" | "actioned"} FeedbackStatus
 * The status of the feedback item
 * @example "new" - New feedback that hasn't been reviewed
 * @example "read" - Feedback that has been read but not actioned
 * @example "archived" - Feedback that has been archived
 * @example "actioned" - Feedback that has been actioned upon
 */

/**
 * @typedef {"main" | "admin" | "contractor-details" | "review-modal" | "search" | "favorites" | "settings"} PageContext
 * The page or context where the feedback was submitted from
 * @example "main" - Main application page
 * @example "admin" - Admin portal
 * @example "contractor-details" - Contractor details modal/page
 * @example "review-modal" - Review submission modal
 * @example "search" - Search results page
 * @example "favorites" - Favorites page
 * @example "settings" - Settings page
 */

/**
 * @typedef {"bottom-navigation" | "search-functionality" | "review-system" | "contractor-listing" | "map-view" | "filtering" | "performance" | "ui-design" | "offline-capability" | "general"} FeatureContext
 * The specific feature or area the feedback relates to
 * @example "bottom-navigation" - Bottom navigation component
 * @example "search-functionality" - Search and filtering features
 * @example "review-system" - Review submission and display
 * @example "contractor-listing" - Contractor cards and lists
 * @example "map-view" - Map interface and location services
 * @example "filtering" - Category and location filtering
 * @example "performance" - App performance and speed
 * @example "ui-design" - User interface and design
 * @example "offline-capability" - Offline functionality
 * @example "general" - General feedback not specific to a feature
 */

/**
 * @typedef {Object} UserFeedback
 * @property {UUID} id - Unique feedback identifier (UUID)
 * @property {number} rating - User rating from 1 to 5
 * @property {FeedbackStatus} status - Current status of the feedback
 * @property {string} timestamp - When the feedback was submitted (ISO string)
 * @property {string} user_agent - User's browser/device information
 * @property {string} app_version - App version when feedback was submitted
 * @property {PageContext} page_context - Page/context where feedback was submitted
 * @property {string} [contact_email] - Optional contact email for follow-up
 * @property {FeatureContext} feature_context - Feature/area the feedback relates to
 * @property {string} [positive_comments] - What the user liked or positive comments
 * @property {string} [improvement_comments] - Suggestions for improvement or issues
 * @property {string} [admin_notes] - Optional admin notes or internal comments
 * @property {UUID} [admin_user_id] - Optional ID of admin who processed the feedback
 * @property {string} [action_taken] - Optional description of action taken
 * @property {string} [action_timestamp] - Optional when action was taken (ISO string)
 * @property {boolean} [follow_up_required] - Optional flag if follow-up is needed
 * @property {string} [user_id] - Optional anonymous user identifier
 * @property {string} [session_id] - Optional user session identifier
 * @property {Object} [additional_data] - Optional additional metadata or context
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   rating: 4,
 *   status: "new",
 *   timestamp: "2025-11-22T11:54:36.836Z",
 *   user_agent: "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
 *   app_version: "1.0.0",
 *   page_context: "main",
 *   contact_email: "faghmie@gmail.com",
 *   feature_context: "bottom-navigation",
 *   positive_comments: "interaction",
 *   improvement_comments: "recommend a supplier"
 * }
 */

/**
 * @typedef {Object} FeedbackSummary
 * @property {UUID} id - Feedback ID (UUID)
 * @property {number} rating - User rating
 * @property {FeedbackStatus} status - Current status
 * @property {string} timestamp - Submission date
 * @property {PageContext} page_context - Page context
 * @property {FeatureContext} feature_context - Feature context
 * @property {string} [positive_comments] - Positive comments (truncated)
 * @property {string} [improvement_comments] - Improvement comments (truncated)
 * @property {string} [contact_email] - Contact email
 * @example
 * {
 *   id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *   rating: 4,
 *   status: "new",
 *   timestamp: "2025-11-22T11:54:36.836Z",
 *   page_context: "main",
 *   feature_context: "bottom-navigation",
 *   positive_comments: "interaction...",
 *   improvement_comments: "recommend a supplier...",
 *   contact_email: "faghmie@gmail.com"
 * }
 */

/**
 * @typedef {Object} FeedbackStats
 * @property {number} totalFeedback - Total number of feedback items
 * @property {number} averageRating - Average rating across all feedback
 * @property {number} newCount - Number of new/unread feedback items
 * @property {number} actionedCount - Number of actioned feedback items
 * @property {Object.<FeedbackStatus, number>} statusDistribution - Count by status
 * @property {Object.<PageContext, number>} pageContextDistribution - Count by page context
 * @property {Object.<FeatureContext, number>} featureContextDistribution - Count by feature context
 * @property {number[]} ratingDistribution - Array of counts for ratings 1-5
 * @example
 * {
 *   totalFeedback: 45,
 *   averageRating: 4.2,
 *   newCount: 12,
 *   actionedCount: 18,
 *   statusDistribution: {
 *     "new": 12,
 *     "read": 10,
 *     "archived": 5,
 *     "actioned": 18
 *   },
 *   pageContextDistribution: {
 *     "main": 25,
 *     "contractor-details": 10,
 *     "search": 5,
 *     "review-modal": 5
 *   },
 *   featureContextDistribution: {
 *     "bottom-navigation": 15,
 *     "search-functionality": 10,
 *     "review-system": 8,
 *     "general": 12
 *   },
 *   ratingDistribution: [2, 3, 5, 20, 15] // 1-star to 5-star counts
 * }
 */

/**
 * @typedef {Object} FeedbackFilters
 * @property {FeedbackStatus[]} [status] - Filter by status
 * @property {PageContext[]} [page_context] - Filter by page context
 * @property {FeatureContext[]} [feature_context] - Filter by feature context
 * @property {number} [minRating] - Minimum rating filter
 * @property {number} [maxRating] - Maximum rating filter
 * @property {string} [dateFrom] - Filter from date (ISO string)
 * @property {string} [dateTo] - Filter to date (ISO string)
 * @property {boolean} [followUpRequired] - Filter by follow-up required
 * @property {string} [search] - Search in comments and email
 * @property {string} [sortBy] - Sort field (timestamp, rating, status)
 * @property {string} [sortOrder] - Sort order (asc, desc)
 * @example
 * {
 *   status: ["new", "read"],
 *   page_context: ["main", "contractor-details"],
 *   minRating: 3,
 *   dateFrom: "2025-11-01T00:00:00.000Z",
 *   sortBy: "timestamp",
 *   sortOrder: "desc"
 * }
 */

/**
 * @typedef {Object} FeedbackCreateData
 * @property {number} rating - User rating (1-5)
 * @property {PageContext} page_context - Page context
 * @property {FeatureContext} feature_context - Feature context
 * @property {string} [positive_comments] - Positive comments
 * @property {string} [improvement_comments] - Improvement comments
 * @property {string} [contact_email] - Contact email
 * @property {string} [user_agent] - User agent string
 * @property {string} [app_version] - App version
 * @property {string} [user_id] - Anonymous user ID
 * @property {string} [session_id] - Session ID
 * @property {Object} [additional_data] - Additional metadata
 * @example
 * {
 *   rating: 4,
 *   page_context: "main",
 *   feature_context: "bottom-navigation",
 *   positive_comments: "The app is easy to use",
 *   improvement_comments: "Would like more filter options",
 *   contact_email: "user@example.com",
 *   user_agent: navigator.userAgent,
 *   app_version: "1.0.0"
 * }
 */

/**
 * @typedef {Object} FeedbackUpdateData
 * @property {FeedbackStatus} [status] - Updated status
 * @property {string} [admin_notes] - Admin notes
 * @property {UUID} [admin_user_id] - Admin user ID
 * @property {string} [action_taken] - Action taken description
 * @property {boolean} [follow_up_required] - Follow-up required flag
 * @example
 * {
 *   status: "actioned",
 *   admin_notes: "Feature request logged for future development",
 *   action_taken: "Added to feature backlog",
 *   follow_up_required: false
 * }
 */

/**
 * @typedef {Object.<UUID, UserFeedback>} FeedbackMap
 * Key: Feedback ID (UUID)
 * Value: UserFeedback object
 * @example
 * {
 *   "a1b2c3d4-1234-5678-9012-abcdef123456": {
 *     rating: 4,
 *     status: "new",
 *     // ... full feedback data
 *   }
 * }
 */

/**
 * @typedef {Object} FeedbackSearchResults
 * @property {FeedbackSummary[]} feedback - Array of feedback summaries
 * @property {number} totalCount - Total number of matching feedback items
 * @property {number} page - Current page number
 * @property {number} pageSize - Number of results per page
 * @property {number} totalPages - Total number of pages
 * @property {FeedbackFilters} appliedFilters - Filters that were applied
 * @example
 * {
 *   feedback: [
 *     {
 *       id: "a1b2c3d4-1234-5678-9012-abcdef123456",
 *       rating: 4,
 *       status: "new",
 *       timestamp: "2025-11-22T11:54:36.836Z",
 *       page_context: "main",
 *       feature_context: "bottom-navigation"
 *     }
 *   ],
 *   totalCount: 1,
 *   page: 1,
 *   pageSize: 20,
 *   totalPages: 1,
 *   appliedFilters: {
 *     status: ["new"],
 *     page_context: ["main"]
 *   }
 * }
 */

// Export for JSDoc usage
export const FeedbackTypes = {};
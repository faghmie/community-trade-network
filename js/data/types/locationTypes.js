// js/data/types/locationTypes.js
/**
 * @typedef {Object} ProvinceData
 * @property {string[]} cities - Array of city names in the province
 * @property {[number, number]} coordinates - Default coordinates for the province [latitude, longitude]
 * @example
 * {
 *   cities: ['Johannesburg', 'Pretoria', 'Sandton'],
 *   coordinates: [-26.2041, 28.0473]
 * }
 */

/**
 * @typedef {Object.<string, ProvinceData>} SouthAfricanProvinces
 * Key: Province name (e.g., 'Gauteng')
 * Value: ProvinceData object with cities and coordinates
 * @example
 * {
 *   'Gauteng': {
 *     cities: ['Johannesburg', 'Pretoria', 'Sandton'],
 *     coordinates: [-26.2041, 28.0473]
 *   },
 *   'Western Cape': {
 *     cities: ['Cape Town', 'Stellenbosch', 'Paarl'],
 *     coordinates: [-33.9249, 18.4241]
 *   }
 * }
 */

/**
 * @typedef {Object.<string, [number, number]>} CityCoordinates
 * Key: City name in lowercase (e.g., 'johannesburg')
 * Value: [latitude, longitude] coordinates
 * @example
 * {
 *   'johannesburg': [-26.2041, 28.0473],
 *   'cape town': [-33.9249, 18.4241],
 *   'pretoria': [-25.7479, 28.2293]
 * }
 */

/**
 * @typedef {Object} Location
 * @property {string} province - Province name
 * @property {string} city - City name
 * @property {string} [area] - Optional area or suburb
 * @property {[number, number]} [coordinates] - Optional precise coordinates
 * @example
 * {
 *   province: "Gauteng",
 *   city: "Johannesburg", 
 *   area: "Sandton",
 *   coordinates: [-26.1070, 28.0517]
 * }
 */

// Export the types for JSDoc usage
export const LocationTypes = {};
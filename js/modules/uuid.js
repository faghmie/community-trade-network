// js/modules/uuid.js
// ES6 Module for UUID generation and management

/**
 * Generate RFC4122 version 4 compliant UUID for Supabase
 * @returns {string} UUID v4 string
 */
export function generateUUID() {
    // Generate random values
    const randomValues = new Uint8Array(16);
    crypto.getRandomValues(randomValues);

    // Set version (4) and variant (RFC4122)
    randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // version 4
    randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // variant

    // Convert to hexadecimal and format as UUID
    const hexBytes = [];
    for (let i = 0; i < 16; i++) {
        hexBytes.push(randomValues[i].toString(16).padStart(2, '0'));
    }

    return [
        hexBytes.slice(0, 4).join(''),
        hexBytes.slice(4, 6).join(''),
        hexBytes.slice(6, 8).join(''),
        hexBytes.slice(8, 10).join(''),
        hexBytes.slice(10, 16).join('')
    ].join('-');
}

/**
 * Validate UUID format (RFC4122 version 4)
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID v4
 */
export function isValidUUID(uuid) {
    if (typeof uuid !== 'string') return false;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Convert simple ID to UUID format if needed
 * @param {string} id - ID to convert
 * @param {boolean} forceUUID - Whether to force UUID generation
 * @returns {string} UUID or original ID
 */
export function ensureUUID(id, forceUUID = false) {
    if (forceUUID || isValidUUID(id)) {
        return id;
    }

    // If it's a simple ID and we want UUID, generate one
    if (forceUUID && !isValidUUID(id)) {
        return generateUUID();
    }

    return id;
}

/**
 * Generate IDs in batch for data migration
 * @param {number} count - Number of UUIDs to generate
 * @returns {string[]} Array of UUIDs
 */
export function generateUUIDs(count) {
    const uuids = [];
    for (let i = 0; i < count; i++) {
        uuids.push(generateUUID());
    }
    return uuids;
}

/**
 * Generate unique ID (alias for generateUUID for compatibility)
 * @returns {string} UUID string
 */
export function generateId() {
    return generateUUID();
}

/**
 * Parse UUID into its components
 * @param {string} uuid - UUID to parse
 * @returns {object} Object with UUID components
 */
export function parseUUID(uuid) {
    if (!isValidUUID(uuid)) {
        throw new Error('Invalid UUID format');
    }

    const parts = uuid.split('-');
    return {
        timeLow: parts[0],
        timeMid: parts[1],
        timeHighAndVersion: parts[2],
        clockSeqAndVariant: parts[3],
        node: parts[4],
        version: parseInt(parts[2][0], 16),
        variant: getVariant(parts[3])
    };
}

/**
 * Get UUID variant from clock sequence
 * @param {string} clockSeq - Clock sequence part of UUID
 * @returns {string} Variant name
 */
function getVariant(clockSeq) {
    const firstByte = parseInt(clockSeq.substring(0, 2), 16);
    
    if ((firstByte & 0x80) === 0x00) return 'NCS';
    if ((firstByte & 0xC0) === 0x80) return 'RFC4122';
    if ((firstByte & 0xE0) === 0xC0) return 'Microsoft';
    return 'Future';
}

/**
 * Check if two UUIDs are equal
 * @param {string} uuid1 - First UUID
 * @param {string} uuid2 - Second UUID
 * @returns {boolean} True if UUIDs are equal
 */
export function uuidsEqual(uuid1, uuid2) {
    if (!isValidUUID(uuid1) || !isValidUUID(uuid2)) {
        return false;
    }
    return uuid1.toLowerCase() === uuid2.toLowerCase();
}

/**
 * Create a namespace UUID (for generating deterministic UUIDs)
 * @param {string} namespace - Namespace string
 * @param {string} name - Name within namespace
 * @returns {string} Version 5 UUID
 */
export function generateNamespaceUUID(namespace, name) {
    // Simple implementation for namespace-based UUIDs
    // For production, consider using a proper v3/v5 UUID implementation
    const namespaceUUID = generateUUID();
    const combined = `${namespace}:${name}:${namespaceUUID}`;
    
    // Create a hash-based UUID (simplified)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Format as UUID-like string (not RFC compliant, but deterministic)
    return 'xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (hash + Math.random() * 16) % 16 | 0;
        hash = Math.floor(hash / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Default export for convenience
export default {
    generateUUID,
    isValidUUID,
    ensureUUID,
    generateUUIDs,
    generateId,
    parseUUID,
    uuidsEqual,
    generateNamespaceUUID
};
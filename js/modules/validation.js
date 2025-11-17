// js/modules/validation.js
// ES6 Module for validation utilities

/**
 * URL validation
 * @param {string} string - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(string) {
    if (!string) return true; // Empty is valid (optional field)
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

/**
 * Phone validation for South Africa
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid South African phone number
 */
export function isValidSouthAfricanPhone(phone) {
    if (!phone) return false;

    // South African phone number regex - accepts all valid formats including landlines
    const saPhoneRegex = /^(\+27|0)[1-9][0-9]{8}$/;

    // Remove spaces, dashes, and parentheses for validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    return saPhoneRegex.test(cleanPhone);
}

/**
 * Format South African phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatSouthAfricanPhone(phone) {
    if (!phone) return '';

    const cleanPhone = phone.replace(/[\s\-()]/g, '');

    // Convert to international format if it starts with 0
    let formatted = cleanPhone;
    if (cleanPhone.startsWith('0')) {
        formatted = '+27' + cleanPhone.substring(1);
    }

    // Format: +27 XX XXX XXXX
    if (formatted.startsWith('+27') && formatted.length === 11) {
        return formatted.replace(/(\+27)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }

    return formatted;
}

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
 * Validate required field
 * @param {string} value - Value to check
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(value, fieldName = 'This field') {
    if (!value || value.trim() === '') {
        return `${fieldName} is required`;
    }
    return null;
}

/**
 * Validate minimum length
 * @param {string} value - Value to check
 * @param {number} minLength - Minimum required length
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateMinLength(value, minLength, fieldName = 'This field') {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
}

/**
 * Validate maximum length
 * @param {string} value - Value to check
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateMaxLength(value, maxLength, fieldName = 'This field') {
    if (value && value.length > maxLength) {
        return `${fieldName} must be less than ${maxLength} characters`;
    }
    return null;
}

/**
 * Validate number range
 * @param {number} value - Number to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} Error message or null if valid
 */
export function validateNumberRange(value, min, max, fieldName = 'This field') {
    if (value < min || value > max) {
        return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
}

/**
 * Validate form fields object
 * @param {object} fields - Object with field names and values
 * @param {object} rules - Validation rules for each field
 * @returns {object} Object with errors for each field
 */
export function validateForm(fields, rules) {
    const errors = {};

    for (const [fieldName, value] of Object.entries(fields)) {
        const fieldRules = rules[fieldName] || [];
        
        for (const rule of fieldRules) {
            const error = rule(value, fieldName);
            if (error) {
                errors[fieldName] = error;
                break; // Stop at first error per field
            }
        }
    }

    return errors;
}

// Pre-built validation rules for common use cases
export const validationRules = {
    required: (fieldName) => (value) => validateRequired(value, fieldName),
    email: (fieldName) => (value) => {
        if (value && !isValidEmail(value)) {
            return `${fieldName} must be a valid email address`;
        }
        return null;
    },
    phone: (fieldName) => (value) => {
        if (value && !isValidSouthAfricanPhone(value)) {
            return `${fieldName} must be a valid South African phone number`;
        }
        return null;
    },
    url: (fieldName) => (value) => {
        if (value && !isValidUrl(value)) {
            return `${fieldName} must be a valid URL`;
        }
        return null;
    },
    minLength: (min, fieldName) => (value) => validateMinLength(value, min, fieldName),
    maxLength: (max, fieldName) => (value) => validateMaxLength(value, max, fieldName),
};
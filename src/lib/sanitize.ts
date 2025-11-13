/**
 * Content sanitization utilities for user-generated content
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize text input by removing HTML tags and potentially harmful content
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove potentially harmful protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Sanitize feedback text with character limit enforcement
 */
export function sanitizeFeedback(feedback: string, maxLength: number = 500): string {
  const sanitized = sanitizeText(feedback);
  return sanitized.substring(0, maxLength);
}

/**
 * Sanitize array of strings (for preferences, cuisines, etc.)
 */
export function sanitizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0);
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();
  
  return emailRegex.test(trimmed) ? trimmed : '';
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // Only allow http and https protocols
  if (!trimmed.match(/^https?:\/\//i)) {
    return '';
  }
  
  // Remove javascript: and data: protocols
  if (trimmed.match(/javascript:|data:|vbscript:/i)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Escape special characters for safe display
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

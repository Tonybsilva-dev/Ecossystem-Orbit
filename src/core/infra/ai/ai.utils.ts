/**
 * AI Client Utilities
 *
 * Utility functions for the AI Client Gateway, including log sanitization
 * to prevent sensitive data exposure.
 *
 * @module ai.utils
 */

/**
 * Default list of sensitive keys that should be redacted from logs.
 * These keys are matched case-insensitively.
 */
const DEFAULT_SENSITIVE_KEYS = [
	'authorization',
	'apikey',
	'api_key',
	'api-key',
	'password',
	'secret',
	'token',
	'access_token',
	'refresh_token',
	'private_key',
	'privatekey',
	'private-key',
	'credential',
	'credentials',
];

/**
 * Sanitizes a log object by redacting sensitive information.
 *
 * This function performs a deep clone of the input object and redacts
 * sensitive fields like API keys, authorization headers, and other PII.
 * The function recursively traverses objects and arrays to sanitize
 * sensitive data at any nesting level.
 *
 * @param obj - The object to sanitize (can be any type)
 * @param sensitiveKeys - Optional array of sensitive key names to redact.
 *                        If not provided, uses DEFAULT_SENSITIVE_KEYS.
 *                        Keys are matched case-insensitively.
 * @returns A deep-cloned, sanitized version of the input object
 *
 * @example
 * ```ts
 * const logData = {
 *   headers: {
 *     Authorization: 'Bearer sk-1234567890',
 *     'Content-Type': 'application/json'
 *   },
 *   body: {
 *     message: 'Hello',
 *     apiKey: 'secret-key-123'
 *   }
 * };
 *
 * const sanitized = sanitizeLogObject(logData);
 * // Result: {
 * //   headers: { Authorization: '[REDACTED]', 'Content-Type': 'application/json' },
 * //   body: { message: 'Hello', apiKey: '[REDACTED]' }
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Custom sensitive keys
 * const sanitized = sanitizeLogObject(logData, ['customKey', 'anotherKey']);
 * ```
 */
export function sanitizeLogObject(
	obj: unknown,
	sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS,
): unknown {
	// Handle null and undefined
	if (obj === null || obj === undefined) {
		return obj;
	}

	// Handle primitives (string, number, boolean, symbol, bigint)
	if (typeof obj !== 'object') {
		return obj;
	}

	// Handle Date objects
	if (obj instanceof Date) {
		return new Date(obj);
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeLogObject(item, sensitiveKeys));
	}

	// Handle objects - perform deep clone and sanitize
	const cloned = {} as Record<string, unknown>;
	const sensitiveKeysLower = sensitiveKeys.map((key) => key.toLowerCase());

	for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
		// Check if key matches any sensitive key (case-insensitive)
		const keyLower = key.toLowerCase();
		const isSensitive = sensitiveKeysLower.includes(keyLower);

		if (isSensitive) {
			// Redact sensitive keys
			cloned[key] = '[REDACTED]';
		} else if (typeof value === 'object' && value !== null) {
			// Recursively sanitize nested objects
			cloned[key] = sanitizeLogObject(value, sensitiveKeys);
		} else {
			// Copy primitive values as-is
			cloned[key] = value;
		}
	}

	return cloned;
}

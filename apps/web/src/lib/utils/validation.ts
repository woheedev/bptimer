import type { ZodType } from 'zod';

/**
 * Validates data against a Zod schema and throws an error if validation fails
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param typeName - Human-readable name of the data type for error messages
 */
export function validateWithSchema<T>(schema: ZodType<T>, data: unknown, typeName: string): T {
	const validation = schema.safeParse(data);
	if (!validation.success) {
		console.error(`${typeName} validation failed:`, validation.error.issues);
		throw new Error(`Invalid ${typeName.toLowerCase()} data: ${validation.error.message}`);
	}
	return validation.data;
}

import type { Context, Next } from 'hono';
import { z } from 'zod';
import { ZodError } from 'zod';

/**
 * Format Zod validation errors into a more user-friendly structure
 */
export const formatZodErrors = (error: ZodError) => {
    const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
    }));

    return {
        success: false,
        message: 'Validation error',
        errors: formattedErrors
    };
};

/**
 * Custom validation middleware for request body
 */
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
    return async (c: Context, next: Next) => {
        try {
            const data = await c.req.json();
            const validatedData = schema.parse(data);

            // Store the validated data to be accessed in the handler
            c.set('validatedData', validatedData);

            await next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = formatZodErrors(error);
                return c.json(formattedErrors, 400);
            }

            // For other types of errors, pass them along
            throw error;
        }
    };
};

/**
 * Custom validation middleware for query parameters
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
    return async (c: Context, next: Next) => {
        try {
            const query = c.req.query();
            const validatedQuery = schema.parse(query);

            // Store the validated query to be accessed in the handler
            c.set('validatedQuery', validatedQuery);

            await next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = formatZodErrors(error);
                return c.json(formattedErrors, 400);
            }

            // For other types of errors, pass them along
            throw error;
        }
    };
};

/**
 * Custom validation middleware for URL parameters
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
    return async (c: Context, next: Next) => {
        try {
            const params = c.req.param();
            const validatedParams = schema.parse(params);

            // Store the validated params to be accessed in the handler
            c.set('validatedParams', validatedParams);

            await next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = formatZodErrors(error);
                return c.json(formattedErrors, 400);
            }

            // For other types of errors, pass them along
            throw error;
        }
    };
};

/**
 * Helper function to get validated data from context
 */
export const getValidatedData = <T>(c: Context): T => {
    return c.get('validatedData') as T;
};

/**
 * Helper function to get validated query from context
 */
export const getValidatedQuery = <T>(c: Context): T => {
    return c.get('validatedQuery') as T;
};

/**
 * Helper function to get validated params from context
 */
export const getValidatedParams = <T>(c: Context): T => {
    return c.get('validatedParams') as T;
}; 
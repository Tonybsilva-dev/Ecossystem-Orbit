import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	PORT: z.coerce.number().default(4001),
	HOST: z.string().default('0.0.0.0'),
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
	ORBIT_API_SECRET: z
		.string()
		.min(16, 'ORBIT_API_SECRET must be at least 16 characters'),
	OPENAI_API_KEY: z.string().optional(),
	GOOGLE_GEMINI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

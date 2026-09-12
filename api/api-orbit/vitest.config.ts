import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.{test,spec}.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'src/core/domain/**/*.ts',
				'src/core/application/**/*.ts',
				'src/core/infra/auth/**/*.ts',
			],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/*.d.ts',
				'**/*.config.ts',
				// Entidades e interfaces de repositório são contratos/tipos, sem lógica pra testar.
				'**/*.entity.ts',
				'**/*.repository.ts',
				// Camada HTTP (rotas, middlewares, container) e implementações Prisma
				// são validadas por integração (docker compose + smoke test), não
				// por teste unitário — repository e route são wiring fino.
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 65,
				statements: 70,
			},
		},
	},
});

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'gen/**/*.*',
				'**/tests/**/*.*',
				'**/*.spec.*',
			],
			reporter: ['text', 'cobertura'],
		},
		globals: true,
	},
});

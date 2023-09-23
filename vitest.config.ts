import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'json-summary', 'json'],
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'**/tests/**/*.*',
			],
		},
	},
});

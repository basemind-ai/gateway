import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'cobertura'],
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'**/tests/**/*.*',
			],
		},
	},
});

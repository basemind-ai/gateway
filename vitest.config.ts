import { resolve } from 'node:path';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: ['text', 'json-summary', 'json'],
			exclude: [
				...(configDefaults.coverage.exclude ?? []),
				'services/**/src/main.ts',
				'services/**/tests/**/*.*',
				'ts-shared/tests/**/*.*',
			],
		},
		alias: {
			shared: resolve(__dirname, 'ts-shared/src'),
		},
	},
});

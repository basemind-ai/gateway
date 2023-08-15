import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [],
	test: {
		globals: true,
		environment: 'node',
		alias: {
			'@': resolve(__dirname, 'src'),
			'tests': resolve(__dirname, 'tests'),
			'shared': resolve(__dirname, '../../ts-shared/src'),
		},
	},
});

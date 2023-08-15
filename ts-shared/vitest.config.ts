import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		alias: {
			shared: resolve(__dirname, 'src'),
		},
	},
});

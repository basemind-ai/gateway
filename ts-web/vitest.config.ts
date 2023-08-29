import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import magicalSvg from 'vite-plugin-magical-svg';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), magicalSvg({ target: 'react' })],
	test: {
		globals: true,
		environment: 'jsdom',
		alias: {
			'@': resolve(__dirname, './src'),
			'public': resolve(__dirname, './public'),
			'tests': resolve(__dirname, './tests'),
			'shared': resolve(__dirname, '../ts-shared/src'),
		},
		setupFiles: ['./tests/vitest.setup.ts', './tests/mocks.ts'],
	},
});

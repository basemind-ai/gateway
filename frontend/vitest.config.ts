import react from '@vitejs/plugin-react';
import magicalSvg from 'vite-plugin-magical-svg';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths(), react(), magicalSvg({ target: 'react' })],
	test: {
		css: true,
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/vitest.setup.ts', './tests/mocks.ts'],
	},
});

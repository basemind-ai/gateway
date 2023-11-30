import tailwindForms from '@tailwindcss/forms';
import tailwindTypography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

const config: Config = {
	content: ['./src/**/*.{tsx,scss,md,mdx}'],
	important: true,
	plugins: [tailwindForms, tailwindTypography],
	safelist: [
		'alert-info',
		'alert-success',
		'alert-error',
		'alert-error',
		'alert-warning',
	],
};

export default config;

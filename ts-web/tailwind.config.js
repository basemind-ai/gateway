/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	content: [
		'./src/client-components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic':
					'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			colors: {
				gray: {
					111: '#111111',
				},
			},
			spacing: {
				102: '25.5rem',
				112: '28rem',
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwindcss-elevation'),
	],
};

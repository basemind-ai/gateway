/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	content: [
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'node_modules/preline/dist/*.js',
	],
	theme: {
		colors: {
			'transparent': 'transparent',
			'current': 'currentColor',
			'base-100': '#272935',
			'base-200': '#181920',
			'base-300': '#09090B',
			'base-content': '#F8F8F2',
			'neutral': '#414558',
			'neutral-content': '#D6D7DB',
			'primary': '#FF79C6',
			'primary-content': '#301D27',
			'secondary': '#BD93F9',
			'secondary-content': '#282130',
			'accent': '#FFB86C',
			'accent-content': '#32261B',
			'info': '#8BE9FD',
			'info-content': '#212E31',
			'success': '#50FA7B',
			'success-content': '#192D1D',
			'warning': '#F1FA8C',
			'warning-content': '#2D2E1E',
			'error': '#FF5555',
			'error-content': '#311816',
		},
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
		require('preline/plugin'),
	],
};

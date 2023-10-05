/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	content: ['./src/**/*.{tsx,scss}', 'node_modules/preline/dist/*.js'],
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
		require('daisyui'),
	],
	daisyui: {
		themes: ['dracula'],
		darkTheme: 'dracula',
		base: true,
		styled: true,
		utils: true,
		rtl: false,
		prefix: '',
		logs: true,
	},
};

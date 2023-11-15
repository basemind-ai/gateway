/** @type {import('tailwindcss').Config} */
module.exports = {
	important: true,
	content: [
		'./src/**/*.{tsx,scss}',
		'node_modules/react-tailwindcss-datepicker/dist/*.js',
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
				discord: '#7289DA',
			},
			spacing: {
				102: '25.5rem',
				112: '28rem',
			},
			borderRadius: {
				'4xl': '30px',
			},
		},
	},
	safelist: [
		'alert-info',
		'alert-success',
		'alert-error',
		'alert-error',
		'alert-warning',
	],
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		require('daisyui'),
		require('tailwindcss-elevation'),
	],
	daisyui: {
		base: true,
		darkTheme: 'dracula',
		logs: true,
		prefix: '',
		rtl: false,
		styled: true,
		themes: [
			{
				dracula: {
					...require('daisyui/src/theming/themes')['dracula'],
					primary: '#bd93f9',
					secondary: '#976FD2',
				},
			},
		],
		utils: true,
	},
};

import tailwindForms from '@tailwindcss/forms';
import tailwindTypography from '@tailwindcss/typography';
import daisyui from 'daisyui';
import themes from 'daisyui/src/theming/themes';
import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/**/*.{tsx,scss}',
		'node_modules/react-tailwindcss-datepicker/dist/*.js',
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
					...themes.dracula,
					accent: '#FE7AC6',
					primary: '#bd93f9',
					secondary: '#976FD2',
				},
			},
		],
		utils: true,
	},
	important: true,
	plugins: [tailwindForms, tailwindTypography, daisyui],
	safelist: [
		'alert-info',
		'alert-success',
		'alert-error',
		'alert-error',
		'alert-warning',
	],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-conic':
					'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			},
			borderRadius: {
				'4xl': '30px',
			},
			colors: {
				discord: '#7289DA',
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
};

export default config;

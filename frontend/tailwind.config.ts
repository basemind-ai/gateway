import tailwindForms from '@tailwindcss/forms';
import tailwindTypography from '@tailwindcss/typography';
import daisyui from 'daisyui';
import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./src/**/*.{tsx,scss}',
		'node_modules/react-tailwindcss-datepicker/dist/*.js',
	],
	daisyui: {
		base: true,
		darkTheme: 'kagiDark',
		logs: true,
		prefix: '',
		rtl: false,
		styled: true,
		themes: [
			{
				// dracula: {
				// 	...themes.dracula,
				// 	accent: '#FE7AC6',
				// 	primary: '#bd93f9',
				// 	secondary: '#976FD2',
				// },
				kagiDark: {
					'accent': '#9DEBFE',
					'base-100': '#262837',
					'base-200': '#1D1F29',
					'base-300': '#161820',
					'base-content': '#ffffff',
					'base-content-dark': '#BFBFC2',
					'error': '#FF2E00',
					'info': '#0194FF',
					'neutral': '#42435C',
					'neutral-content': '#D4D4D7',
					'primary': '#FFB319',
					'secondary': '#4835BC',
					'success': '#00C265',
					'warning': '#fde047',
				},
				kagiLight: {
					'accent': '#4835BC',
					'base-100': '#FFFFFF',
					'base-200': '#F7F6F2',
					'base-300': '#F2F2F2',
					'base-content': '#000000',
					'base-content-bright': '#202020',
					'base-content-dark': '#000000',
					'error': '#FF2E00',
					'info': '#0194FF',
					'neutral': '#fafafa',
					'neutral-content': '#323444',
					'primary': '#FFB319',
					'secondary': '#9DEBFE',
					'success': '#00C265',
					'warning': '#fde047',
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

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
		themes: ['dracula'], // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
		darkTheme: 'dracula', // name of one of the included themes for dark mode
		base: true, // applies background color and foreground color for root element by default
		styled: true, // include daisyUI colors and design decisions for all components
		utils: true, // adds responsive and modifier utility classes
		rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
		prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
		logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
	},
};

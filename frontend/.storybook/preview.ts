import '@/styles/globals.scss';

import { withThemeByClassName } from '@storybook/addon-styling';
import { Preview } from '@storybook/react';

import { reactIntl } from './react-intl';

const preview: Preview = {
	decorators: [
		// Adds theme switching support.
		// NOTE: requires setting "darkMode" to "class" in your tailwind config
		withThemeByClassName({
			defaultTheme: 'light',
			themes: {
				dark: 'dark',
				light: 'light',
			},
		}),
	],

	globals: {
		locale: reactIntl.defaultLocale,
		locales: {
			en: 'English',
		},
	},

	parameters: {
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		reactIntl,
	},
};

export default preview;

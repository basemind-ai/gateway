import '@/styles/globals.scss';

import { withThemeByClassName } from '@storybook/addon-styling';
import { Preview } from '@storybook/react';

import { reactIntl } from './react-intl';

const preview: Preview = {
	globals: {
		locale: reactIntl.defaultLocale,
		locales: {
			en: 'English',
		},
	},

	parameters: {
		reactIntl,
		actions: { argTypesRegex: '^on[A-Z].*' },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},

	decorators: [
		// Adds theme switching support.
		// NOTE: requires setting "darkMode" to "class" in your tailwind config
		withThemeByClassName({
			themes: {
				light: 'light',
				dark: 'dark',
			},
			defaultTheme: 'light',
		}),
	],
};

export default preview;

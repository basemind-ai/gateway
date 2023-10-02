import { Preview } from '@storybook/react';
import { reactIntl } from './reactIntl';
import { withThemeByClassName } from '@storybook/addon-styling';

import '@/styles/globals.scss';

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

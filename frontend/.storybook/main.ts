import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
	stories: [
		'../stories/**/*.mdx',
		'../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
	],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-onboarding',
		'@storybook/addon-interactions',
		'storybook-react-intl',
		{
			name: '@storybook/addon-styling',
			options: {
				sass: {
					implementation: require('sass'),
				},
				postCss: {
					implementation: require.resolve('postcss'),
				},
			},
		},
	],
	framework: {
		name: '@storybook/nextjs',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
};
export default config;

import type { StorybookConfig } from '@storybook/nextjs';
import postcss from 'postcss';
import sass from 'sass';

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
					implementation: sass,
				},
				postCss: {
					implementation: postcss,
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

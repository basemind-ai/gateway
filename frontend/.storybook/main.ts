import type { StorybookConfig } from '@storybook/nextjs';
import postcss from 'postcss';
import sass from 'sass';

const config: StorybookConfig = {
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-onboarding',
		'@storybook/addon-interactions',
		'storybook-react-intl',
		{
			name: '@storybook/addon-styling',
			options: {
				postCss: {
					implementation: postcss,
				},
				sass: {
					implementation: sass,
				},
			},
		},
	],
	docs: {
		autodocs: 'tag',
	},
	framework: {
		name: '@storybook/nextjs',
		options: {},
	},
	stories: [
		'../stories/**/*.mdx',
		'../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
	],
};
export default config;

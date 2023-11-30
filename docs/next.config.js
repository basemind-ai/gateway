module.exports = require('nextra')({
	theme: 'nextra-theme-docs',
	themeConfig: './theme.config.tsx',
	experimental: {
		externalDir: true,
	},
	reactStrictMode: true,
	distDir: 'dist',
	webpack(config) {
		const fileLoaderRule = config.module.rules.find((rule) =>
			rule.test?.test?.('.svg'),
		);
		config.module.rules.push(
			{
				...fileLoaderRule,
				test: /\.svg$/i,
				resourceQuery: /url/,
			},
			{
				test: /\.svg$/i,
				issuer: /\.[jt]sx?$/,
				resourceQuery: { not: /url/ },
				use: ['@svgr/webpack'],
			},
		);
		fileLoaderRule.exclude = /\.svg$/i;
		return config;
	},
});

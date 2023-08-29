const nextTranslate = require('next-translate-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = nextTranslate({
	experimental: {
		externalDir: true,
		appDir: true,
	},
	reactStrictMode: true,
	distDir: 'dist',
	// see: https://react-svgr.com/docs/next/
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

module.exports = nextConfig;

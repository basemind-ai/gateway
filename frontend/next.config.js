const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = withNextIntl({
	output: 'standalone',
	experimental: {
		externalDir: true,
		serverComponentsExternalPackages: ['react-bootstrap-icons'],
	},
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{ hostname: 'lh3.googleusercontent.com' },
			{ hostname: 'avatars.githubusercontent.com' },
		],
	},
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

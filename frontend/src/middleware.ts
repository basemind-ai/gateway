import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
	defaultLocale: 'en',
	locales: ['en'],
});

export const config = {
	matcher: ['/', '/(en)/:path*'],
};

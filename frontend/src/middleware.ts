import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
	defaultLocale: 'en',

	locales: ['en'],
});

export const config = {
	// Skip all paths that should not be internationalized
	matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

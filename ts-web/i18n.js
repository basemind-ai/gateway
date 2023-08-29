module.exports = {
	locales: ['en'],
	defaultLocale: 'en',
	pages: {
		'*': ['common'],
		'/': ['signIn', 'signInBanner'],
	},
	loadLocaleFrom: (language, namespace) =>
		import(`./public/locales/${language}/${namespace}.json`).then(
			(m) => m.default,
		),
};

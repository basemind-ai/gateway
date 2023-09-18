// noinspection JSUnusedGlobalSymbols
module.exports = {
	locales: ['en'],
	defaultLocale: 'en',
	pages: {
		'*': ['common'],
		'/sign-in': ['signin-firebase', 'signin-banner'],
		'/dashboard': ['dashboard-navrail'],
	},
	loadLocaleFrom: (language, namespace) =>
		import(`./public/locales/${language}/${namespace}.json`).then(
			(m) => m.default,
		),
};

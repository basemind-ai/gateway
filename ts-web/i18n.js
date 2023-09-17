// noinspection JSUnusedGlobalSymbols
module.exports = {
	locales: ['en'],
	defaultLocale: 'en',
	pages: {
		'*': ['common'],
		'/sign-in': ['signin-firebase', 'signin-banner'],
		'/dashboard': ['dashboard-navrail'],
		'/dashboard/test/prompt': ['dashboard-test-prompt'],
	},
	loadLocaleFrom: (language, namespace) =>
		import(`./public/locales/${language}/${namespace}.json`).then(
			(m) => m.default,
		),
};

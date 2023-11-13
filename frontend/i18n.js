// noinspection JSUnusedGlobalSymbols
module.exports = {
	locales: ['en'],
	defaultLocale: 'en',
	loadLocaleFrom: (language, namespace) =>
		import(`./public/locales/${language}/${namespace}.json`).then(
			(m) => m.default,
		),
};

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	messages:
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,unicorn/no-await-expression-member
		(await import(`../public/messages/${locale}.json`)).default,
}));

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

const locales = new Set(['en']);

export default getRequestConfig(async ({ locale }) => {
	if (!locales.has(locale)) {
		notFound();
	}

	const { default: messages } = (await import(
		`../public/messages/${locale}.json`
	)) as { default: Record<string, any> };

	return {
		messages,
	};
});

import '@/styles/globals.scss';

import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';

import { ToastWrapper } from '@/components/toast';

const inter = Inter({ subsets: ['latin'] });

const supportedLocales = ['en'];

export function generateStaticParams() {
	return supportedLocales.map((loc) => ({ locale: loc }));
}

export const metadata: Metadata = {
	title: 'BaseMind.AI',
	description: 'The platform for easy AI development',
};

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params?: Record<string, string>;
}) {
	const locale =
		params?.locale && supportedLocales.includes(params.locale)
			? params.locale
			: 'en';

	const { default: messages } = (await import(
		`../../public/locales/${locale}.json`
	)) as { default: AbstractIntlMessages };

	return (
		<html lang={locale}>
			<body className={inter.className}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ToastWrapper>{children}</ToastWrapper>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

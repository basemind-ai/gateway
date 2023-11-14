import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { ToastWrapper } from '@/components/toast';

const inter = Inter({ subsets: ['latin'] });

const supportedLocales = ['en'];

export function generateStaticParams() {
	return supportedLocales.map((loc) => ({ locale: loc }));
}
export default function LocaleLayout({
	children,
	params: { locale },
}: {
	children: React.ReactNode;
	params: { locale: string };
}) {
	if (locale && !supportedLocales.includes(locale)) {
		notFound();
	}
	unstable_setRequestLocale(locale);

	const messages = useMessages();

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

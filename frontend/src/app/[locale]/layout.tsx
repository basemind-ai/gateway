import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import en from 'public/messages/en.json';

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
	unstable_setRequestLocale(locale);

	return (
		<html lang={locale}>
			<body className={inter.className}>
				<NextIntlClientProvider locale={locale} messages={en}>
					<ToastWrapper>{children}</ToastWrapper>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

import '@/styles/globals.scss';

import { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const supportedLocales = ['en'];

export const metadata: Metadata = {
	description: 'The platform for easy AI development',
	title: 'BaseMind.AI',
};

export function generateStaticParams() {
	return supportedLocales.map((loc) => ({ locale: loc }));
}

export default function rootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>{children}</body>
		</html>
	);
}

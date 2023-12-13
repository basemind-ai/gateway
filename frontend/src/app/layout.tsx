import '@/styles/globals.scss';

import { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const supportedLocales = ['en'];
const metadataImage =
	'https://firebasestorage.googleapis.com/v0/b/basemind-ai-production.appspot.com/o/public%2Flogo-with-text.png?alt=media&token=0a2ac2b6-508b-44b0-b601-758404800f10';

export const metadata: Metadata = {
	description:
		'The all-in-one developer platform for your mobile apps AI needs. Integrate in minutes, scale to millions.',
	keywords:
		'BaseMind, Serverless AI, Prompt Management, GPT-4, gemini, Developer Platform for AI, Kotlin, Swift, Flutter, React Native, API',
	metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_HOST!),
	openGraph: {
		images: [
			{
				alt: 'BaseMind.AI Logo',
				height: 630,
				url: metadataImage,
				width: 1200,
			},
		],
	},
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

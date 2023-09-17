'use client';

import Link from 'next/link';

import { Navigation } from '@/constants';

export default function Home() {
	return (
		<main
			data-testid="login-container"
			className="h-full w-full flex items-center justify-center bg-base-200"
		>
			<Link href={Navigation.SignIn}>SIGN-IN</Link>
		</main>
	);
}

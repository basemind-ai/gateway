'use client';
import 'firebaseui/dist/firebaseui.css';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Logo } from '@/components/logo';
import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { LoginBanner } from '@/components/sign-in/login-banner';
import { marketingInfographic, Navigation } from '@/constants';
import { usePageTracking } from '@/hooks/use-page-tracking';
import { useUser } from '@/stores/api-store';

export default function SignIn() {
	const user = useUser();
	const router = useRouter();
	usePageTracking('auth');
	useEffect(() => {
		if (user) {
			router.replace(Navigation.Projects);
		}
	}, [user]);

	return (
		<main data-testid="login-container" className="flex bg-base-100 grow">
			<div className="flex grow">
				<div className="flex grow px-16 pt-16 pb-24 flex-col">
					<Logo />
					<FirebaseLogin />
				</div>
				<div className="hidden lg:flex lg:h-screen lg:bg-base-200 lg:items-center lg:w-2/5">
					<LoginBanner imageSrc={marketingInfographic} />
				</div>
			</div>
		</main>
	);
}

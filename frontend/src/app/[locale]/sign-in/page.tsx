'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Oval } from 'react-loading-icons';

import { Logo } from '@/components/logo';
import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { LoginBanner } from '@/components/sign-in/login-banner';
import { marketingInfographic, Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useUser } from '@/stores/api-store';

export default function SignIn() {
	const user = useUser();
	const router = useRouter();
	const { initialized, page } = useAnalytics();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		page('auth');
	}, [initialized]);

	useEffect(() => {
		if (user) {
			router.replace(Navigation.Projects);
		}
	}, [user]);

	return (
		<main data-testid="login-container" className="flex bg-base-100 h-full">
			<Oval
				height="50vh"
				width="50vw"
				className={`m-auto ${!isLoading && 'hidden'}`}
			/>
			<div className={`flex grow ${isLoading && 'hidden'}`}>
				<div className="flex grow px-16 pt-16 pb-24 flex-col">
					<Logo />
					<FirebaseLogin
						setLoading={(loadingValue) => {
							setIsLoading(loadingValue);
						}}
						isInitialized={initialized}
					/>
				</div>
				<div className="hidden lg:flex lg:h-screen lg:bg-base-200 lg:items-center lg:w-2/5">
					<LoginBanner imageSrc={marketingInfographic} />
				</div>
			</div>
		</main>
	);
}

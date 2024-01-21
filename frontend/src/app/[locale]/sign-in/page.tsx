'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LottieLoader } from '@/components/loader';
import { FirebaseLogin } from '@/components/sign-in/firebase-login';
import { LoginBanner } from '@/components/sign-in/login-banner';
import { marketingInfographic, Navigation } from '@/constants';
import { PageNames } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useUser } from '@/stores/api-store';

export default function SignIn() {
	const user = useUser();
	const router = useRouter();
	const { initialized, page, identify } = useAnalytics();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		page(PageNames.Auth);
	}, [initialized, page]);

	useEffect(() => {
		if (user) {
			router.replace(Navigation.Projects);
		}
	}, [user, router, identify]);

	return (
		<main data-testid="login-container" className="flex bg-base-100 h-full">
			{isLoading ? (
				<LottieLoader />
			) : (
				<div className="flex grow">
					<div className="flex grow px-16 pt-16 pb-24 flex-col">
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
			)}
		</main>
	);
}

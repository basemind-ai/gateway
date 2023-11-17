'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'react-bootstrap-icons';

import { Logo } from '@/components/logo';
import { Dimensions, Navigation } from '@/constants';

export function LandingPageHeader() {
	const t = useTranslations('landingPage');
	const router = useRouter();
	const handleLogoClick = () => {
		router.push(Navigation.Base);
	};
	const handleSignInClick = () => {
		router.push(Navigation.SignIn);
	};
	return (
		<header
			className="navbar md:w-9/12 mx-auto sticky top-0 z-50 bg-base-100 pb-5"
			data-testid="landing-page-header"
		>
			<div className="flex-none lg:flex navbar-start">
				<Logo
					textSize="text-3xl"
					height={Dimensions.Eleven}
					width={Dimensions.Eleven}
					onClick={handleLogoClick}
				/>
			</div>
			<div className="navbar-end">
				<button
					className="btn btn-outline btn-md m-2"
					data-testid="header-sign-in-button"
					onClick={handleSignInClick}
				>
					{t('signIn')}
					<ChevronRight />
				</button>
			</div>
		</header>
	);
}

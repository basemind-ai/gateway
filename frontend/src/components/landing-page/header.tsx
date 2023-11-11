import { useTranslations } from 'next-intl';
import { ChevronRight } from 'react-bootstrap-icons';

import { Logo } from '@/components/logo';
import { Dimensions } from '@/constants';

export function LandingPageHeader({
	onLogoClick,
	onButtonClick,
}: {
	onLogoClick: () => void;
	onButtonClick: () => void;
}) {
	const t = useTranslations('landingPage');

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
					onClick={onLogoClick}
				/>
			</div>
			<div className="navbar-end">
				<button
					className="btn btn-outline btn-md m-2"
					data-testid="header-sign-in-button"
					onClick={onButtonClick}
				>
					{t('signIn')}
					<ChevronRight />
				</button>
			</div>
		</header>
	);
}

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'react-bootstrap-icons';

import { Logo } from '@/components/logo';
import { NavAuctionIcons } from '@/components/static-site/nav-auction-icons';
import { Navigation } from '@/constants';

export function StaticPageHeader() {
	const t = useTranslations('landingPage');

	return (
		<header
			className="navbar mx-auto sticky top-0 z-10 bg-base-100 pb-5"
			data-testid="static-site-header"
		>
			<div className="navbar-start">
				<Link href={Navigation.Base}>
					<Logo />
				</Link>
			</div>
			<div className="navbar-end">
				<div className="ml-0 my-2 hidden sm:flex">
					<NavAuctionIcons />
				</div>
				<div className="divider divider-horizontal ml-0 my-2 hidden sm:flex" />

				<Link
					className="btn bg-gradient-to-tr from-accent to-primary text-primary-content  btn-sm m-1"
					data-testid="header-sign-in-button"
					href={Navigation.SignIn}
				>
					{t('signIn')}
					<ChevronRight />
				</Link>
			</div>
		</header>
	);
}

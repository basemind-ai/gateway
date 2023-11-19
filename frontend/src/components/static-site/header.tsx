import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'react-bootstrap-icons';

import { Logo } from '@/components/logo';
import { Navigation } from '@/constants';

export function StaticPageHeader() {
	const t = useTranslations('landingPage');

	return (
		<header
			className=" navbar mx-auto sticky top-0 z-50 bg-base-100 pb-5"
			data-testid="static-site-header"
		>
			<div className="flex-none lg:flex navbar-start">
				<Link href={Navigation.Base}>
					<Logo />
				</Link>
			</div>
			<div className="navbar-end">
				<Link
					className="btn btn-primary btn-sm m-1"
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

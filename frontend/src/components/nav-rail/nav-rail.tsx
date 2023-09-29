'use client';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'react-bootstrap-icons';

import { Logo } from '@/components/logo';
import NavRailFooter from '@/components/nav-rail/nav-rail-footer';
import NavRailList from '@/components/nav-rail/nav-rail-list';
import { Navigation } from '@/constants';

export default function NavRail() {
	const t = useTranslations('navrail');

	return (
		<div className="flex flex-col pt-6 px-8 h-full bg-base-200 justify-between">
			<div>
				<Logo />
				<NavRailList />
			</div>
			<div>
				<div className="items-center text-center  mb-12 flex flex-col bg-base-300 shadow-sm rounded-3xl ">
					<div className="p-4 ">
						<h3 className="text-lg font-bold text-base-content">
							{t('bannerTitle')}
						</h3>
						<p className="mt-2 text-sm text-base-content/80">
							{t('bannerBody')}
						</p>
						<a
							className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-secondary hover:underline"
							href={Navigation.Support}
						>
							{t('bannerCTA')}
							<ChevronRight />
						</a>
					</div>
				</div>
				<NavRailFooter />
			</div>
		</div>
	);
}

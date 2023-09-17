import useTranslation from 'next-translate/useTranslation';
import { ChevronRight } from 'react-bootstrap-icons';

import NavRailFooter from '@/app/dashboard/nav-rail-footer';
import NavRailList from '@/app/dashboard/navrail-list';
import { Logo } from '@/client-components/logo';

export default function NavRail() {
	const { t } = useTranslation('dashboard-navrail');

	return (
		<div className="flex flex-col pt-6 px-8 w-1/6 h-full bg-base-200 justify-between">
			<div>
				<Logo />
				<NavRailList
					item1={t('overview')}
					item2={t('testing')}
					item3={t('api')}
					item4={t('persistence')}
					item5={t('middleware')}
					item6={t('a/b-testing')}
				/>
			</div>
			<div>
				<div className="items-center text-center  mb-12 flex flex-col bg-base-300 shadow-sm rounded-3xl ">
					<div className="p-4 ">
						<h3 className="text-lg font-bold text-base-content">
							{t('bannerTitle')}
						</h3>
						<p className="mt-2 text-sm text-base-content/80">
							{t('bannerBody1')} <br /> {t('bannerBody2')}
						</p>
						<a
							className="mt-3 inline-flex items-center gap-2 mt-5 text-sm font-medium text-secondary hover:text-blue-700"
							href="#"
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

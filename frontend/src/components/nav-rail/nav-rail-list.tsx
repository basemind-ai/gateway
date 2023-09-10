'use client';
import { usePathname } from 'next/navigation';
import useTranslation from 'next-translate/useTranslation';
import {
	Boxes,
	HddStack,
	HouseDoor,
	Lightning,
	Search,
	Speedometer2,
} from 'react-bootstrap-icons';

import Badge from '@/components/badge';
import LinkMenu from '@/components/link-menu';
import { Navigation } from '@/constants';

export default function NavRailList() {
	const { t } = useTranslation('dashboard-navrail');

	const [pathname] = usePathname().split('?');

	return (
		<div className="mt-12 ml-2 " data-testid="nav-rail-list">
			<LinkMenu
				href={Navigation.Dashboard}
				text={t('overview')}
				icon={<HouseDoor className="w-3 h-3" />}
				isCurrent={Navigation.Dashboard === pathname}
			/>
			<LinkMenu
				href={Navigation.Prompt}
				text={t('testing')}
				icon={<Search className="w-3 h-3" />}
				isCurrent={Navigation.Prompt === pathname}
			/>
			<LinkMenu
				href={Navigation.Api}
				text={t('api')}
				icon={<Boxes className="w-3 h-3" />}
				isCurrent={Navigation.Api === pathname}
			/>
			<LinkMenu
				text={t('persistence')}
				icon={<HddStack className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
			<LinkMenu
				text={t('middleware')}
				icon={<Lightning className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
			<LinkMenu
				text={t('abTesting')}
				icon={<Speedometer2 className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
		</div>
	);
}

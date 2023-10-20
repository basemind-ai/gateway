'use client';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { useCurrentProject } from '@/stores/project-store';
import { contextNavigation, populateApplicationId } from '@/utils/navigation';

const ICON_CLASSES = 'w-3.5 h-3.5';

export default function NavRailList() {
	const t = useTranslations('navrail');
	const [pathname] = usePathname().split('?');
	const currentProject = useCurrentProject()();
	const navigation = contextNavigation(currentProject?.id);

	return (
		<div
			className="mt-12 ml-2 gap-0.5 flex flex-col "
			data-testid="nav-rail-list"
		>
			<LinkMenu
				href={navigation.Dashboard}
				text={t('overview')}
				icon={<HouseDoor className={ICON_CLASSES} />}
				isCurrent={navigation.Dashboard === pathname}
			/>
			<LinkMenu
				href={navigation.Prompt}
				text={t('testing')}
				icon={<Search className={ICON_CLASSES} />}
				isCurrent={navigation.Prompt === pathname}
			/>
			{currentProject?.applications?.length ? (
				<LinkMenu
					isDisabled={true}
					text={t('application')}
					icon={<Boxes className={ICON_CLASSES} />}
				>
					{currentProject.applications.map((application) => {
						const applicationUrl = populateApplicationId(
							navigation.Application,
							application.id,
						);
						return (
							<LinkMenu
								key={applicationUrl}
								href={applicationUrl}
								text={application.name}
								isCurrent={applicationUrl === pathname}
							/>
						);
					})}
				</LinkMenu>
			) : null}
			<LinkMenu
				href={navigation.Api}
				text={t('api')}
				icon={<Boxes className={ICON_CLASSES} />}
				isCurrent={navigation.Api === pathname}
			/>
			<LinkMenu
				text={t('persistence')}
				icon={<HddStack className={ICON_CLASSES} />}
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
				icon={<Lightning className={ICON_CLASSES} />}
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
				icon={<Speedometer2 className={ICON_CLASSES} />}
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

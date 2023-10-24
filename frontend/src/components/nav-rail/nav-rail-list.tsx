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
import { useApplications, useCurrentProject } from '@/stores/project-store';
import { contextNavigation, populateApplicationId } from '@/utils/navigation';

const ICON_CLASSES = 'w-3.5 h-3.5';

export default function NavRailList() {
	const t = useTranslations('navrail');
	const [pathname] = usePathname().split('?');
	// TODO: Remove this hook if current project can be ALWAYS derived from path
	const currentProject = useCurrentProject();
	const navigation = contextNavigation(currentProject?.id);
	const projectApplications = useApplications(currentProject?.id);

	return (
		<div
			className="mt-12 ml-2 gap-0.5 flex flex-col "
			data-testid="nav-rail-list"
		>
			<LinkMenu
				href={navigation.Overview}
				text={t('overview')}
				icon={<HouseDoor className={ICON_CLASSES} />}
				isCurrent={navigation.Overview === pathname}
			/>
			<LinkMenu
				href={navigation.Prompt}
				text={t('testing')}
				icon={<Search className={ICON_CLASSES} />}
				isCurrent={navigation.Prompt === pathname}
			/>
			<LinkMenu
				isDisabled={true}
				text={t('application')}
				icon={<Boxes className={ICON_CLASSES} />}
			>
				{projectApplications?.map((application) => {
					const applicationUrl = populateApplicationId(
						navigation.Applications,
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
				<LinkMenu
					href={'TODO:newapp'}
					text={t('newApplication')}
					isCurrent={'TODO:newapp' === pathname}
				/>
			</LinkMenu>
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

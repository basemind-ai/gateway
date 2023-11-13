'use client';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import {
	Boxes,
	HddStack,
	HouseDoor,
	Search,
	Speedometer2,
} from 'react-bootstrap-icons';

import Badge from '@/components/navrail/badge';
import LinkMenu from '@/components/navrail/link-menu';
import { CreateApplication } from '@/components/projects/[projectId]/applications/create-application';
import { useApplications, useCurrentProject } from '@/stores/project-store';
import { contextNavigation, populateApplicationId } from '@/utils/navigation';

const ICON_CLASSES = 'w-3.5 h-3.5';

function NewApplication({ projectId }: { projectId?: string }) {
	const t = useTranslations('navrail');
	const dialogRef = useRef<HTMLDialogElement>(null);

	if (!projectId) {
		return null;
	}

	return (
		<>
			<button
				data-testid="nav-rail-create-application-btn"
				onClick={() => dialogRef.current?.showModal()}
				className="text-xs text-base-content py-2 hover:text-primary text-start"
			>
				{t('newApplication')}
			</button>
			<dialog ref={dialogRef} className="modal">
				<div className="dialog-box border-0 rounded-none">
					<CreateApplication
						projectId={projectId}
						onClose={() => dialogRef.current?.close()}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</>
	);
}

export default function NavRailList() {
	const t = useTranslations('navrail');
	const [pathname] = usePathname().split('?');
	// TODO: Remove this hook if current project can be ALWAYS derived from path
	const currentProject = useCurrentProject();
	const navigation = contextNavigation(currentProject?.id);
	const projectApplications = useApplications(currentProject?.id);

	return (
		<div className="mt-10 ml-2 flex flex-col " data-testid="nav-rail-list">
			<LinkMenu
				href={navigation.Overview}
				text={t('overview')}
				icon={<HouseDoor className={ICON_CLASSES} />}
				isCurrent={navigation.Overview === pathname}
			/>
			<LinkMenu
				href={navigation.Testing}
				text={t('testing')}
				icon={<Search className={ICON_CLASSES} />}
				isCurrent={navigation.Testing === pathname}
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
				<NewApplication projectId={currentProject?.id} />
			</LinkMenu>
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

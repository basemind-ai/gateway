import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import {
	Boxes,
	HddStack,
	HouseDoor,
	Speedometer2,
} from 'react-bootstrap-icons';

import { NavrailBadge } from '@/components/navrail/navrail-badge';
import { NavrailLinkMenu } from '@/components/navrail/navrail-link-menu';
import { CreateApplication } from '@/components/projects/[projectId]/applications/create-application';
import { useApplications, useSelectedProject } from '@/stores/api-store';
import { contextNavigation, setApplicationId } from '@/utils/navigation';

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

export function NavRailList() {
	const t = useTranslations('navrail');
	const [pathname] = usePathname().split('?');
	// TODO: Remove this hook if current project can be ALWAYS derived from path
	const currentProject = useSelectedProject();
	const navigation = contextNavigation(currentProject?.id);
	const projectApplications = useApplications(currentProject?.id);

	return (
		<div className="mt-10 ml-2 flex flex-col " data-testid="nav-rail-list">
			<NavrailLinkMenu
				href={navigation.ProjectDetail}
				text={t('overview')}
				icon={<HouseDoor className={ICON_CLASSES} />}
				isCurrent={navigation.ProjectDetail === pathname}
			/>
			<NavrailLinkMenu
				isDisabled={true}
				text={t('application')}
				icon={<Boxes className={ICON_CLASSES} />}
			>
				{projectApplications?.map((application) => {
					const applicationUrl = setApplicationId(
						navigation.ApplicationDetail,
						application.id,
					);
					return (
						<NavrailLinkMenu
							key={applicationUrl}
							href={applicationUrl}
							text={application.name}
							isCurrent={applicationUrl === pathname}
						/>
					);
				})}
				<NewApplication projectId={currentProject?.id} />
			</NavrailLinkMenu>
			<NavrailLinkMenu
				text={t('persistence')}
				icon={<HddStack className={ICON_CLASSES} />}
				isDisabled={true}
				badge={
					<NavrailBadge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
			<NavrailLinkMenu
				text={t('abTesting')}
				icon={<Speedometer2 className={ICON_CLASSES} />}
				isDisabled={true}
				badge={
					<NavrailBadge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
		</div>
	);
}

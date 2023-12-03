import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LogoutButton } from '@/components/settings/logout-button';
import { Navigation } from '@/constants';
import { Project } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function AvatarDropdown({
	userPhotoURL,
	projects,
	handleSetProject,
}: {
	handleSetProject: (projectId: string) => void;
	projects: Project[];
	userPhotoURL: string;
}) {
	const t = useTranslations('navbar');

	return (
		<div className="dropdown dropdown-end">
			<div tabIndex={0} role="button" className="avatar flex">
				<div className="w-10 rounded-full">
					<Image
						priority
						width={40}
						height={40}
						src={userPhotoURL}
						alt="Logo"
						data-testid="avatar-image"
					/>
				</div>
			</div>
			<ul
				tabIndex={0}
				className="p-2 bg-base-300 mt-3 z-[1] shadow menu menu-sm dropdown-content rounded-box w-52"
				data-testid="dropdown-content"
			>
				<li>
					<Link href={Navigation.Settings} data-testid="setting-link">
						{t('settings')}
					</Link>
				</li>
				<li>
					<Link href={Navigation.Support} data-testid="support-link">
						{t('support')}
					</Link>
				</li>
				<div className="border-t border-neutral mt-1">
					{projects.map((nonActiveproject) => (
						<li
							key={nonActiveproject.id}
							data-testid="project-select-option"
						>
							<Link
								href={setRouteParams(Navigation.ProjectDetail, {
									projectId: nonActiveproject.id,
								})}
								onClick={() => {
									handleSetProject(nonActiveproject.id);
								}}
								data-testid={`project-select-link-${nonActiveproject.id}`}
							>
								{nonActiveproject.name}
							</Link>
						</li>
					))}
					<li className="border-t border-neutral mt-1">
						<Link
							href={Navigation.CreateProject}
							data-testid="create-new-project-link"
						>
							{t('createNewProject')}
						</Link>
					</li>
					<li className="border-t border-neutral mt-1">
						<LogoutButton />
					</li>
				</div>
			</ul>
		</div>
	);
}

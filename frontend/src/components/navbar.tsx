'use client';
import Link from 'next/link';
import { ArrowLeft } from 'react-bootstrap-icons';

import { AvatarDropdown } from '@/components/avatar-dropdown';
import { Logo } from '@/components/logo';
import { defaultProfilePicture, Navigation } from '@/constants';
import { useProjects, useSetSelectedProject } from '@/stores/api-store';
import { Application, Project, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function Navbar({
	project,
	application,
	config,
	headline,
	userPhotoURL,
}: {
	application?: Application;
	config?: PromptConfig<any>;
	headline?: string;
	project?: Project;
	userPhotoURL?: string | null;
}) {
	const projects = useProjects();
	const setSelectedProject = useSetSelectedProject();

	return (
		<div
			className="navbar pb-0 px-0 content-center items-center"
			data-testid="navbar-container"
		>
			<div
				data-testid="navbar-header"
				className="flex-grow gap-4 content-baseline"
			>
				<Logo />
				{headline && (
					<>
						<Link
							href={setRouteParams(Navigation.ProjectDetail, {
								projectId: projects[0]?.id,
							})}
						>
							<ArrowLeft className="w-4 h-4" />
						</Link>
						<h1 className="text-sm" data-testid="headline">
							{headline}
						</h1>
					</>
				)}
				{project && (
					<div className="text-sm breadcrumbs capitalize">
						<ul>
							<li>
								<Link
									href={setRouteParams(
										Navigation.ProjectDetail,
										{
											projectId: project.id,
										},
									)}
									data-testid="project-breadcrumbs"
								>
									{project.name}
								</Link>
							</li>
							{application && (
								<li>
									<Link
										href={setRouteParams(
											Navigation.ApplicationDetail,
											{
												applicationId: application.id,
												projectId: project.id,
											},
										)}
										data-testid="application-breadcrumbs"
									>
										{application.name}
									</Link>
								</li>
							)}
							{config && (
								<li>
									<Link
										href={setRouteParams(
											Navigation.PromptConfigDetail,
											{
												applicationId: application?.id,
												projectId: project.id,
												promptConfigId: config.id,
											},
										)}
										data-testid="config-breadcrumbs"
									>
										{config.name}
									</Link>
								</li>
							)}
						</ul>
					</div>
				)}
			</div>
			<AvatarDropdown
				userPhotoURL={userPhotoURL ?? defaultProfilePicture}
				projects={projects}
				handleSetProject={setSelectedProject}
			/>
		</div>
	);
}

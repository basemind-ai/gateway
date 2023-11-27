'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'react-bootstrap-icons';

import { LogoutButton } from '@/components/settings/logout-button';
import { Navigation } from '@/constants';
import { useProjects, useSetSelectedProject } from '@/stores/api-store';
import { Application, Project, PromptConfig } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function Navbar({
	activeProject,
	application,
	config,
	headline,
}: {
	activeProject?: Project;
	application?: Application;
	config?: PromptConfig<any>;
	headline?: string;
}) {
	const t = useTranslations('navbar');
	const projects = useProjects();
	const setSelectedProject = useSetSelectedProject();
	const backLink = projects[0]?.id
		? setRouteParams(Navigation.ProjectDetail, {
				projectId: projects[0]?.id,
		  })
		: Navigation.CreateProject;
	return (
		<div className="navbar" data-testid="navbar-container">
			<div data-testid="navbar-header" className="flex-1 gap-4">
				<Image
					priority
					width={32}
					height={32}
					src="/images/pinecone-transparent-bg.svg"
					alt="Logo"
					data-testid="logo-image"
				/>
				{headline && (
					<>
						<Link href={backLink}>
							<ArrowLeft className="w-4 h-4" />
						</Link>
						<h1
							className="text-md font-semibold"
							data-testid="headline"
						>
							{headline}
						</h1>
					</>
				)}
				{activeProject && (
					<div className="text-md font-semibold breadcrumbs">
						<ul>
							<li>
								<Link
									href={setRouteParams(
										Navigation.ProjectDetail,
										{
											projectId: activeProject.id,
										},
									)}
									data-testid="project-breadcrumbs"
								>
									{activeProject.name}
								</Link>
							</li>
							{application && (
								<li>
									<Link
										href={setRouteParams(
											Navigation.ApplicationDetail,
											{
												applicationId: application.id,
												projectId: activeProject.id,
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
												projectId: activeProject.id,
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

			<div className="flex-none">
				<ul className="menu menu-horizontal px-1">
					<li>
						<Link
							href={Navigation.Settings}
							data-testid="setting-link"
						>
							{t('settings')}
						</Link>
					</li>
					<li>
						<Link
							href={Navigation.Support}
							data-testid="support-link"
						>
							{t('support')}
						</Link>
					</li>
					{activeProject && (
						<li>
							<details className="dropdown-bottom dropdown-end">
								<summary data-testid="selected-project">
									{activeProject.name}
								</summary>
								<ul className="p-2 bg-base-300  mt-3 z-[1] shadow menu menu-sm dropdown-content rounded-box w-52">
									{projects.map((project) => (
										<li
											key={project.id}
											data-testid="project-select-option"
										>
											<Link
												href={`/en/projects/${project.id}`}
												onClick={() => {
													setSelectedProject(
														project.id,
													);
												}}
												className={
													project.id ===
													activeProject.id
														? 'selected'
														: ''
												}
												data-testid={`project-select-link-${project.id}`}
											>
												{project.name}
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
								</ul>
							</details>
						</li>
					)}
					{!activeProject && headline && <LogoutButton />}
				</ul>
			</div>
		</div>
	);
}

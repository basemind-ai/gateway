import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
	useCurrentProject,
	useProjects,
	useSetCurrentProject,
} from '@/stores/project-store';
import { handleChange } from '@/utils/helpers';

export function ProjectSelect() {
	const t = useTranslations('projectSelect');

	const router = useRouter();

	const projects = useProjects();
	const currentProject = useCurrentProject();
	const setCurrentProject = useSetCurrentProject();

	return (
		<div data-testid="project-select-container">
			<select
				data-testid="project-select-component"
				onChange={handleChange((projectId: string) => {
					setCurrentProject(projectId);
					router.replace(`/projects/${projectId}`);
				})}
			>
				<option
					value={undefined}
					hidden={!!currentProject}
					selected={!currentProject}
					data-testid="project-select-default-option"
				>
					{t('defaultOption')}
				</option>
				{projects.map((project) => (
					<option
						key={project.id}
						value={project.id}
						selected={currentProject?.id === project.id}
						data-testid="project-select-option"
					>
						{project.name}
					</option>
				))}
			</select>
		</div>
	);
}

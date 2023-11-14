import { useRouter } from 'next/navigation';

import {
	useProject,
	useProjects,
	useSetSelectedProject,
} from '@/stores/api-store';
import { handleChange } from '@/utils/helpers';

export function ProjectSelect({
	selectedProjectId,
}: {
	selectedProjectId: string;
}) {
	const router = useRouter();

	const projects = useProjects();
	const setSelectedProject = useSetSelectedProject();
	const selectedProject = useProject(selectedProjectId)!;

	return (
		<div data-testid="project-select-container">
			<select
				className="select"
				data-testid="project-select-component"
				onChange={handleChange((projectId: string) => {
					setSelectedProject(projectId);
					router.replace(`/projects/${projectId}`);
				})}
			>
				{projects.map((project) => (
					<option
						key={project.id}
						value={project.id}
						selected={selectedProject.id === project.id}
						data-testid="project-select-option"
					>
						{project.name}
					</option>
				))}
			</select>
		</div>
	);
}

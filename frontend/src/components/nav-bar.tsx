import { ProjectSelect } from '@/components/project-select';
import { Project } from '@/types';

export function NavBar({
	project,
	headerText,
}: {
	project: Project;
	headerText: string;
}) {
	return (
		<div className="navbar" data-testid="navbar-container">
			<div
				data-testid="navbar-header"
				className="navbar-start text-2xl font-semibold"
			>
				{headerText}
			</div>
			<div className="navbar-end">
				<ProjectSelect selectedProjectId={project.id} />
			</div>
		</div>
	);
}

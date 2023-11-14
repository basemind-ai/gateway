import { ProjectSelect } from '@/components/project-select';
import { Project } from '@/types';

export function Navbar({
	project,
	headerText,
	showSelect,
}: {
	project: Project;
	headerText: string;
	showSelect: boolean;
}) {
	return (
		<div className="navbar" data-testid="navbar-container">
			<div
				data-testid="navbar-header"
				className="navbar-start text-2xl font-semibold"
			>
				{headerText}
			</div>
			{showSelect && (
				<div className="navbar-end">
					<ProjectSelect selectedProjectId={project.id} />
				</div>
			)}
		</div>
	);
}

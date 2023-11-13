import { ProjectFactory } from 'tests/factories';
import { routerReplaceMock } from 'tests/mocks';
import { fireEvent, render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import { ProjectSelect } from '@/components/project-select';
import {
	useCurrentProject,
	useSetCurrentProject,
	useSetProjects,
} from '@/stores/project-store';

describe('ProjectSelect tests', () => {
	const projects = ProjectFactory.batchSync(3);

	it('should show options for all projects', () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);

		setProjects(projects);

		render(<ProjectSelect />);

		const select = screen.getByTestId('project-select-component');
		expect(select).toBeInTheDocument();

		const options = screen.getAllByTestId('project-select-option');
		expect(options.length).toBe(projects.length);
	});

	it('should default to current project, when set', () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);

		setProjects(projects);

		const {
			result: { current: setCurrentProject },
		} = renderHook(useSetCurrentProject);

		setCurrentProject(projects[0].id);

		const {
			result: { current: currentProject },
		} = renderHook(useCurrentProject);

		expect(currentProject).toBe(projects[0]);

		render(<ProjectSelect />);

		const options = screen.getAllByTestId('project-select-option');
		expect(options.length).toBe(projects.length);

		expect((options[0] as HTMLOptionElement).value).toEqual(projects[0].id);
		expect((options[0] as HTMLOptionElement).selected).toBe(true);
	});

	it('should change project on select and update the route', () => {
		expect(routerReplaceMock).toHaveBeenCalledTimes(0);

		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);

		setProjects(projects);

		render(<ProjectSelect />);

		const select = screen.getByTestId('project-select-component');
		expect(select).toBeInTheDocument();

		fireEvent.change(select, { target: { value: projects[1].id } });

		const {
			result: { current: currentProject },
		} = renderHook(useCurrentProject);

		expect(currentProject).toBe(projects[1]);

		expect(routerReplaceMock).toHaveBeenCalledWith(
			`/projects/${projects[1].id}`,
		);
	});

	it('should show default option if no project is selected', () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);

		setProjects(projects);

		render(<ProjectSelect />);

		const select = screen.getByTestId('project-select-component');
		expect(select).toBeInTheDocument();

		const options = screen.getAllByTestId('project-select-option');
		expect(options.length).toBe(projects.length);

		expect((options[0] as HTMLOptionElement).selected).toBe(false);
		expect((options[0] as HTMLOptionElement).value).toBe(projects[0].id);

		const defaultOption = screen.getByTestId(
			'project-select-default-option',
		);
		expect(defaultOption).toBeInTheDocument();
	});
});

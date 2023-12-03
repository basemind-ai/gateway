import { ProjectFactory } from 'tests/factories';
import { fireEvent, render, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import { AvatarDropdown } from '@/components/avatar-dropdown';
import { Navigation } from '@/constants';

describe('AvatarDropdown tests', () => {
	const mockHandleSetProject = vi.fn();
	const projects = ProjectFactory.batchSync(3);
	const userPhotoURL = '/images/placholder-avatar.svg';

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders AvatarDropdown with projects', () => {
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={mockHandleSetProject}
			/>,
		);

		const avatar = screen.getByTestId('avatar-image');
		expect(avatar).toBeInTheDocument();

		projects.forEach((project) => {
			const projectLink = screen.getByTestId(
				`project-select-link-${project.id}`,
			);
			expect(projectLink).toBeInTheDocument();
		});

		const settingsLink = screen.getByTestId('setting-link');
		expect(settingsLink).toBeInTheDocument();

		const supportLink = screen.getByTestId('support-link');
		expect(supportLink).toBeInTheDocument();
	});

	it('handles project selection', () => {
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={mockHandleSetProject}
			/>,
		);

		const projectLink = screen.getByTestId(
			`project-select-link-${projects[0].id}`,
		);
		fireEvent.click(projectLink);
		expect(mockHandleSetProject).toHaveBeenCalledWith(projects[0].id);
	});

	it('navigates to settings', () => {
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={mockHandleSetProject}
			/>,
		);

		const settingsLink = screen.getByTestId('setting-link');
		expect(settingsLink).toHaveAttribute('href', Navigation.Settings);
	});

	it('navigates to support', () => {
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={mockHandleSetProject}
			/>,
		);

		const supportLink = screen.getByTestId('support-link');
		expect(supportLink).toHaveAttribute('href', Navigation.Support);
	});

	it('navigates to create new project', () => {
		const projects = ProjectFactory.batchSync(3);
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={vi.fn()}
			/>,
		);

		const createNewProjectLink = screen.getByTestId(
			'create-new-project-link',
		);
		expect(createNewProjectLink).toBeInTheDocument();
		expect(createNewProjectLink).toHaveAttribute(
			'href',
			Navigation.CreateProject,
		);
	});
	it('renders logout button and triggers logout on click', () => {
		const projects = ProjectFactory.batchSync(3);
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={vi.fn()}
			/>,
		);

		const logoutButton = screen.getByTestId('dashboard-logout-btn'); // Replace 'logout-button' with the actual test ID of your LogoutButton if different
		expect(logoutButton).toBeInTheDocument();
	});

	it('displays correct project names', () => {
		render(
			<AvatarDropdown
				userPhotoURL={userPhotoURL}
				projects={projects}
				handleSetProject={mockHandleSetProject}
			/>,
		);

		projects.forEach((project) => {
			const projectLink = screen.getByTestId(
				`project-select-link-${project.id}`,
			);
			expect(projectLink).toHaveTextContent(project.name);
		});
	});
});

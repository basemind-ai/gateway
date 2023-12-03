import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
} from 'tests/factories';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import { Navbar } from '@/components/navbar';
import { Navigation } from '@/constants';
import {
	useSelectedProject,
	useSetProjects,
	useSetSelectedProject,
} from '@/stores/api-store';

describe('Navbar tests', () => {
	it('should show logo', () => {
		const project = ProjectFactory.buildSync();
		render(<Navbar project={project} />);
		const logo = screen.getByTestId('logo-image');
		expect(logo).toBeInTheDocument();
	});

	it('should render project breadcrumbs', () => {
		const activeProject = ProjectFactory.buildSync();
		render(<Navbar project={activeProject} />);
		const project = screen.getByTestId('project-breadcrumbs');
		expect(project).toBeInTheDocument();
		const application = screen.queryByTestId('application-breadcrumbs');
		expect(application).not.toBeInTheDocument();
	});

	it('should render application breadcrumbs', () => {
		const activeProject = ProjectFactory.buildSync();
		const application = ApplicationFactory.buildSync();
		render(<Navbar project={activeProject} application={application} />);
		const project = screen.getByTestId('project-breadcrumbs');
		expect(project).toBeInTheDocument();
		const app = screen.getByTestId('application-breadcrumbs');
		expect(app).toBeInTheDocument();
		const config = screen.queryByTestId('config-breadcrumbs');
		expect(config).not.toBeInTheDocument();
	});

	it('should render config breadcrumbs', () => {
		const activeProject = ProjectFactory.buildSync();
		const ActiveApplication = ApplicationFactory.buildSync();
		const ActiveConfiguration = OpenAIPromptConfigFactory.buildSync();
		render(
			<Navbar
				project={activeProject}
				application={ActiveApplication}
				config={ActiveConfiguration}
			/>,
		);
		const project = screen.getByTestId('project-breadcrumbs');
		expect(project).toBeInTheDocument();
		const app = screen.getByTestId('application-breadcrumbs');
		expect(app).toBeInTheDocument();
		const config = screen.queryByTestId('config-breadcrumbs');
		expect(config).toBeInTheDocument();
	});

	it('clicking on  breadcrumbs should navigate to relevent detail page', () => {
		const activeProject = ProjectFactory.buildSync();
		const ActiveApplication = ApplicationFactory.buildSync();
		const ActiveConfiguration = OpenAIPromptConfigFactory.buildSync();
		render(
			<Navbar
				project={activeProject}
				application={ActiveApplication}
				config={ActiveConfiguration}
			/>,
		);
		const project = screen.getByTestId('project-breadcrumbs');
		expect(project).toHaveAttribute(
			'href',
			`/en/projects/${activeProject.id}`,
		);
		const app = screen.getByTestId('application-breadcrumbs');
		expect(app).toHaveAttribute(
			'href',
			`/en/projects/${activeProject.id}/applications/${ActiveApplication.id}`,
		);
		const config = screen.queryByTestId('config-breadcrumbs');
		expect(config).toHaveAttribute(
			'href',
			`/en/projects/${activeProject.id}/applications/${ActiveApplication.id}/configs/${ActiveConfiguration.id}`,
		);
	});

	it('should render support and settings menu link', () => {
		const activeProject = ProjectFactory.buildSync();
		render(<Navbar project={activeProject} />);
		const support = screen.getByTestId('support-link');
		expect(support).toBeInTheDocument();
		expect(support).toHaveAttribute('href', Navigation.Support);
		const settings = screen.getByTestId('setting-link');
		expect(settings).toBeInTheDocument();
		expect(settings).toHaveAttribute('href', Navigation.Settings);
	});

	it('should have dropdown menu to select project', () => {
		const { result } = renderHook(() => useSetProjects());
		const projects = ProjectFactory.batchSync(3);
		result.current(projects);
		render(<Navbar project={projects[0]} />);
		const dropdown = screen.getByTestId('avatar-image');
		expect(dropdown).toBeInTheDocument();
		fireEvent.click(dropdown);

		projects.forEach((project) => {
			const link = screen.getByTestId(
				`project-select-link-${project.id}`,
			);
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute('href', `/en/projects/${project.id}`);
		});
	});

	it('picking project should set a new selected project', async () => {
		const { result: useSetProjectsHook } = renderHook(() =>
			useSetProjects(),
		);
		const { result: setSelectedProjectHook } = renderHook(() =>
			useSetSelectedProject(),
		);
		const { result: useSelectedProjectHook } = renderHook(() =>
			useSelectedProject(),
		);
		const projects = ProjectFactory.batchSync(3);
		useSetProjectsHook.current(projects);
		setSelectedProjectHook.current(projects[0].id);
		render(<Navbar project={projects[0]} />);
		const dropdown = screen.getByTestId('avatar-image');
		fireEvent.click(dropdown);
		fireEvent.click(
			screen.getByTestId(`project-select-link-${projects[1].id}`),
		);
		await waitFor(() => {
			expect(useSelectedProjectHook.current.id).toEqual(projects[1].id);
		});
	});

	it('picking create new project should navigate to create project screen', async () => {
		const projects = ProjectFactory.batchSync(3);
		render(<Navbar project={projects[0]} />);
		const dropdown = screen.getByTestId('avatar-image');
		fireEvent.click(dropdown);
		const createNewProjectLink = screen.getByTestId(
			'create-new-project-link',
		);
		expect(createNewProjectLink).toBeInTheDocument();
		expect(createNewProjectLink).toHaveAttribute(
			'href',
			Navigation.CreateProject,
		);
	});

	it('when headline is provided should present it and logout button', () => {
		render(<Navbar headline="headline test" />);
		const headline = screen.getByTestId('headline');
		expect(headline).toBeInTheDocument();
		expect(headline).toHaveTextContent('headline test');
		const logoutButton = screen.getByTestId('dashboard-logout-btn');
		expect(logoutButton).toBeInTheDocument();
	});
});

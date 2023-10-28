import { usePathname } from 'next/navigation';
import locales from 'public/locales/en.json';
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import NavRail from '@/components/nav-rail/nav-rail';
import { Navigation } from '@/constants';
import {
	useSetCurrentProject,
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

const navRailTranslation = locales.navrail;

describe('NavRail tests', () => {
	(usePathname as Mock).mockReturnValue(Navigation.Api);

	it('should render Logo', () => {
		render(<NavRail />);
		expect(screen.getByTestId('logo-component')).toBeInTheDocument();
	});
	it('should render NavRailList', () => {
		const projects = ProjectFactory.batchSync(2);
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		setProjects(projects);
		const {
			result: { current: setCurrentProject },
		} = renderHook(useSetCurrentProject);
		setCurrentProject(projects[0].id);
		const {
			result: { current: setProjectApplications },
		} = renderHook(useSetProjectApplications);
		setProjectApplications(projects[0].id, ApplicationFactory.batchSync(2));

		render(<NavRail />);
		expect(screen.getByTestId('nav-rail-list')).toBeInTheDocument();
	});
	it('should render NavRailFooter', () => {
		render(<NavRail />);
		expect(screen.getByTestId('nav-rail-footer')).toBeInTheDocument();
	});
	it('uses translated text', () => {
		render(<NavRail />);
		const overviewItem = screen.getByText(navRailTranslation.overview);
		const testingItem = screen.getByText(navRailTranslation.testing);
		const apiItem = screen.getByText(navRailTranslation.api);
		const bannerTitle = screen.getByText(navRailTranslation.bannerTitle);
		const bannerCTA = screen.getByText(navRailTranslation.bannerCTA);

		expect(overviewItem).toBeInTheDocument();
		expect(testingItem).toBeInTheDocument();
		expect(apiItem).toBeInTheDocument();
		expect(bannerTitle).toBeInTheDocument();
		expect(bannerCTA).toBeInTheDocument();
	});
});

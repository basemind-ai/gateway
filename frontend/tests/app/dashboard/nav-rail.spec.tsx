import { usePathname } from 'next/navigation';
import navRailTranslation from 'public/locales/en/dashboard-navrail.json';
import { render, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import NavRail from '@/components/nav-rail/nav-rail';
import { Navigation } from '@/constants';

describe('NavRail tests', () => {
	(usePathname as Mock).mockReturnValue(Navigation.Api);

	it('should render Logo', () => {
		render(<NavRail />);
		expect(screen.getByTestId('logo-component')).toBeInTheDocument();
	});
	it('should render NavRailList', () => {
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

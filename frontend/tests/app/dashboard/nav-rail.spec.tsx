import { usePathname } from 'next/navigation';
import locales from 'public/locales/en.json';
import { render, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import NavRail from '@/components/nav-rail/nav-rail';
import { Navigation } from '@/constants';

const navRailTranslation = locales.navrail;

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
		expect(overviewItem).toBeInTheDocument();
		expect(testingItem).toBeInTheDocument();
	});
});

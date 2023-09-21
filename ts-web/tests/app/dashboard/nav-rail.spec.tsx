// todo fix use translation here
import { usePathname } from 'next/navigation';
import { render, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import NavRail from '@/app/dashboard/nav-rail';
import { Navigation } from '@/constants';

describe('NavRail tests', () => {
	(usePathname as Mock).mockReturnValue(Navigation.API);
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
});

import { usePathname } from 'next/navigation';
import { render, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import { NavRailFooter } from '@/components/navrail/navrail-footer';
import { Navigation } from '@/constants';

describe('NavRailFooter tests', () => {
	(usePathname as Mock).mockReturnValue(`${Navigation.Settings}?4242`);

	it('should highlight the correct link based on pathname', () => {
		render(<NavRailFooter />);

		const settingsLink = screen.getByTestId('nav-rail-footer-settings');
		expect(settingsLink.className).toContain('text-primary');
	});

	it('should not highlight links on different urls', () => {
		render(<NavRailFooter />);

		const billingLink = screen.getByTestId('nav-rail-footer-support');
		expect(billingLink.className).toContain('text-base-content');
	});
});

import { usePathname } from 'next/navigation';
import { render, screen } from 'tests/test-utils';
import { Mock } from 'vitest';

import NavRailFooter from '@/app/dashboard/nav-rail-footer';
import { Navigation } from '@/constants';

vi.mock('next/navigation', async () => {
	const actual = await vi.importActual('next/navigation');

	return {
		// @ts-expect-error
		...actual,
		usePathname: vi.fn(),
	};
});

describe('NavRailFooter tests', () => {
	// const usePathnameSpy = vi.spyOn('navigation', 'usePathname');
	//
	// usePathnameSpy.mockReturnValue(Navigation.Settings + '?4242');
	(usePathname as Mock).mockReturnValue(Navigation.Settings + '?4242');
	it('should highlight the correct link based on pathname', () => {
		render(<NavRailFooter />);

		const settingsLink = screen.getByTestId('nav-rail-footer-settings');
		expect(settingsLink.className).toContain('text-primary');
	});

	it('should not highlight links on different urls', () => {
		render(<NavRailFooter />);

		const billingLink = screen.getByTestId('nav-rail-footer-billing');
		expect(billingLink.className).toContain('text-base-content');
	});

	it('should clean the pathname correctly', () => {
		render(<NavRailFooter />);
	});

	// it('should handle link clicks correctly', async () => {
	// 	render(<NavRailFooter />);
	//
	// 	const billingLink = screen.getByTestId('nav-rail-footer-billing');
	//
	// 	await vi.fireEvent.click(billingLink);
	//
	// 	// Add assertions to check the behavior on click, e.g., navigation or function call
	// });
});

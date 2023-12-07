import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen } from 'tests/test-utils';
import { describe } from 'vitest';

import { CTASection } from '@/components/static-site/cta-section';
import { Navigation } from '@/constants';

describe('CtaSection', () => {
	it('should have cta button that links to sign in page', () => {
		render(<CTASection />);
		fireEvent.click(screen.getByTestId('cta-section-button'));
		expect(routerPushMock).toHaveBeenCalledWith(
			Navigation.SignIn,
			Navigation.SignIn,
			{ locale: undefined, scroll: true, shallow: undefined },
		);
	});
});

import { render, screen } from 'tests/test-utils';

import { LoginBanner } from '@/components/sign-in/login-banner';
import { marketingInfographic } from '@/constants';

describe('LoginBanner tests', () => {
	it('renders image', () => {
		render(<LoginBanner imageSrc={marketingInfographic} />);

		const splashImage = screen.getByTestId<HTMLImageElement>(
			'login-banner-splash-image',
		);

		expect(splashImage.src).toContain(marketingInfographic);
	});
});

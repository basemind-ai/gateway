import { render, screen } from 'tests/test-utils';

import { FeaturesSection } from '@/components/landing-page/features-section';

describe('FeaturesSection', () => {
	it('should render three Feature components with correct props', () => {
		render(<FeaturesSection />);

		const featureCards = screen.getAllByTestId(/^feature-card-/);
		expect(featureCards).toHaveLength(3);
	});
});

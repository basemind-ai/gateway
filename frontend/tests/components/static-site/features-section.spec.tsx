import { render, screen } from 'tests/test-utils';

import { FeaturesSection } from '@/components/static-site/features-section';

describe('FeaturesSection', () => {
	it('should render four FeatureCard components with correct props', () => {
		render(<FeaturesSection />);

		const featureCards = screen.getAllByTestId(/^feature-card-/);
		expect(featureCards).toHaveLength(4);
	});
});

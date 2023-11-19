import { render, screen } from 'tests/test-utils';

import { FeatureCard } from '@/components/static-site/feature-card';

describe('Feature', () => {
	it('should render the component with required props', () => {
		const props = {
			description: 'Description',
			subtitle: 'Subtitle',
			title: 'Title',
		};

		render(
			<FeatureCard {...props} name="my-feature">
				<div>Children</div>
			</FeatureCard>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
	});

	it('should render the component with all props', () => {
		const props = {
			description: 'Description',
			reverse: true,
			subtitle: 'Subtitle',
			title: 'Title',
		};

		render(
			<FeatureCard {...props} name="my-feature">
				<div>Children</div>
			</FeatureCard>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
	});

	it('should render the component with reverse prop as true', () => {
		const props = {
			description: 'Description',
			reverse: true,
			subtitle: 'Subtitle',
			title: 'Title',
		};

		render(
			<FeatureCard {...props} name="my-feature">
				<div>Children</div>
			</FeatureCard>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
		expect(screen.getByTestId('feature-card-my-feature')).toHaveClass(
			'md:flex-row-reverse',
		);
	});
});

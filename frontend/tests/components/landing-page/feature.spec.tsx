import { render, screen } from 'tests/test-utils';

import { Feature } from '@/components/landing-page/feature';

describe('Feature', () => {
	it('should render the component with required props', () => {
		const props = {
			title: 'Title',
			subtitle: 'Subtitle',
			description: 'Description',
		};

		render(
			<Feature {...props} name="my-feature">
				<div>Children</div>
			</Feature>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
	});

	it('should render the component with all props', () => {
		const props = {
			title: 'Title',
			subtitle: 'Subtitle',
			description: 'Description',
			reverse: true,
		};

		render(
			<Feature {...props} name="my-feature">
				<div>Children</div>
			</Feature>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
	});

	it('should render the component with reverse prop as true', () => {
		const props = {
			title: 'Title',
			subtitle: 'Subtitle',
			description: 'Description',
			reverse: true,
		};

		render(
			<Feature {...props} name="my-feature">
				<div>Children</div>
			</Feature>,
		);

		expect(
			screen.getByTestId('feature-card-my-feature'),
		).toBeInTheDocument();
		expect(screen.getByTestId('feature-card-my-feature')).toHaveClass(
			'md:flex-row-reverse',
		);
	});
});

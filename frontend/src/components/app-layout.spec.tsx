import { render, screen } from 'tests/test-utils';

import { AppLayout } from '@/components/app-layout';

describe('App Layout tests', () => {
	it('renders app layout and its children', () => {
		const text = 'The perfect child';
		render(
			<AppLayout>
				<div>{text}</div>
			</AppLayout>,
		);

		const layoutContainer = screen.getByTestId('app-layout-container');
		expect(layoutContainer).toBeInTheDocument();

		const textElement = screen.getByText(text);
		expect(textElement).toBeInTheDocument();
	});
});

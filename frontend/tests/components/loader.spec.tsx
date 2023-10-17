import { render, screen } from 'tests/test-utils';

import { Loader } from '@/components/loader';

describe('Loader tests', () => {
	it('renders loader', () => {
		render(<Loader />);

		const loader = screen.getByTestId('loader-anim');
		expect(loader).toBeInTheDocument();
	});
});

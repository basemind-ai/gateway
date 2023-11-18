import { render, screen } from 'tests/test-utils';

import { SDKSection } from '@/components/static-site/sdk-section';

describe('SDKSection', () => {
	it('should render a section with a title and code snippet', () => {
		render(<SDKSection />);
		expect(screen.getByTestId('sdk-section-title')).toBeInTheDocument();
		expect(screen.getByTestId('code-snippet-kotlin')).toBeInTheDocument();
	});

	it('should display code snippet in Kotlin language', () => {
		render(<SDKSection />);
		expect(screen.getByTestId('code-snippet-kotlin')).toBeInTheDocument();
	});
});

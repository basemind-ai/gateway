import { fireEvent, render, screen } from 'tests/test-utils';

import { MarketingCodeSnippet } from '@/components/static-site/marketing-code-snippet';

describe('MarketingCodeSnippet Tests', () => {
	it('should render the component correctly', () => {
		render(<MarketingCodeSnippet />);

		expect(
			screen.getByTestId('prompt-code-snippet-container'),
		).toBeInTheDocument();
	});

	it('should display the correct initial tab as active', () => {
		render(<MarketingCodeSnippet />);
		const iosTab = screen.getByTestId('tab-iOS');
		expect(iosTab).toHaveClass('tab-active');
	});

	it('should switch to the iOS tab when clicked', () => {
		render(<MarketingCodeSnippet />);
		const androidTab = screen.getByTestId('tab-Android');

		fireEvent.click(androidTab);
		expect(androidTab).toHaveClass('tab-active');
	});

	it('should display the code snippet for Android framework', () => {
		render(<MarketingCodeSnippet />);

		const androidSnippet = screen.getByTestId(
			'tab-content-Android-container',
		);
		expect(androidSnippet).toBeInTheDocument();
	});

	it('should not display a code snippet for TypeScript as it is unsupported', () => {
		const typescriptSnippet = screen.queryByTestId(
			'tab-content-React Native-container',
		);
		expect(typescriptSnippet).not.toBeInTheDocument();
	});
});

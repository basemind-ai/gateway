import { render, screen } from 'tests/test-utils';

import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';

describe('CardHeaderWithTooltip', () => {
	it('should render the header text and tooltip text', () => {
		const headerText = 'Test Header';
		const tooltipText = 'Test Tooltip';
		const dataTestId = 'test-header-tooltip';

		render(
			<CardHeaderWithTooltip
				headerText={headerText}
				tooltipText={tooltipText}
				dataTestId={dataTestId}
			/>,
		);

		expect(screen.getByText(headerText)).toBeInTheDocument();

		const tooltip = screen.getByTestId(dataTestId);
		expect(tooltip).toBeInTheDocument();
	});
});

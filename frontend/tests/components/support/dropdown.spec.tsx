import { fireEvent, screen } from '@testing-library/react';
import { render } from 'tests/test-utils';

import { Dropdown } from '@/components/support/dropdown';

describe('Dropdown component', () => {
	const testHeadline = 'test headline';
	function renderDropDown() {
		render(
			<Dropdown
				headline={testHeadline}
				selected={''}
				setSelected={setSelectedMock}
				options={options}
			/>,
		);
	}

	const options = [
		{ value: '01', text: '1' },
		{ value: '02', text: '2' },
		{ value: '03', text: '3' },
		{ value: '04', text: '4' },
	];

	const setSelectedMock = vi.fn();

	it('should render headline twice', () => {
		renderDropDown();
		const headlines = screen.getAllByText(testHeadline);
		headlines.forEach((headline) => {
			expect(headline).toBeInTheDocument();
		});
	});

	it('should render all options', () => {
		renderDropDown();
		expect(screen.getByTestId(options[0].value)).toBeInTheDocument();
		expect(screen.getByText(options[0].text)).toBeInTheDocument();
		expect(screen.getByTestId(options[1].value)).toBeInTheDocument();
		expect(screen.getByText(options[1].text)).toBeInTheDocument();
		expect(screen.getByTestId(options[2].value)).toBeInTheDocument();
		expect(screen.getByText(options[2].text)).toBeInTheDocument();
		expect(screen.getByTestId(options[3].value)).toBeInTheDocument();
		expect(screen.getByText(options[3].text)).toBeInTheDocument();
	});

	it('should call setSelectedMock when option is selected', () => {
		renderDropDown();
		const select = screen.getByTestId(
			`dropdown-input-select-${testHeadline}`,
		);
		fireEvent.change(select, { target: { value: options[1].value } });
		expect(setSelectedMock).toHaveBeenCalledWith(options[1].value);
	});
});

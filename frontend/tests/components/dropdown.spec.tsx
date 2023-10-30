import { fireEvent, screen } from '@testing-library/react';
import { render } from 'tests/test-utils';

import { Dropdown } from '@/components/dropdown';

describe('Dropdown component', () => {
	function renderDropDown() {
		render(
			<Dropdown
				headline="headline"
				selected={options[0]}
				setSelected={setSelectedMock}
				options={options}
			/>,
		);
	}
	const options = ['option none', 'option1', 'option2', 'option3'];
	const setSelectedMock = vi.fn();

	it('should render headline', () => {
		renderDropDown();
		expect(screen.getByText('headline')).toBeInTheDocument();
	});

	it('should render all options', () => {
		renderDropDown();
		expect(screen.getByTestId(options[0])).toBeInTheDocument();
		expect(screen.getByTestId(options[1])).toBeInTheDocument();
		expect(screen.getByTestId(options[2])).toBeInTheDocument();
		expect(screen.getByTestId(options[3])).toBeInTheDocument();
	});

	it('should call setSelectedMock when option is selected', () => {
		renderDropDown();
		const select = screen.getByTestId('dropdown-input-select');
		fireEvent.change(select, { target: { value: options[1] } });
		expect(setSelectedMock).toHaveBeenCalledWith(options[1]);
	});

	it('cant select first option', () => {
		renderDropDown();
		fireEvent.click(screen.getByTestId('dropdown-input-select'));
		expect(screen.getByTestId(options[0])).toBeDisabled();
	});
});

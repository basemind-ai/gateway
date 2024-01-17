import { fireEvent, render, screen } from 'tests/test-utils';

import { Dropdown } from '@/components/dropdown';

describe('Dropdown component', () => {
	const testHeadline = 'test headline';
	function renderDropDown() {
		render(
			<Dropdown
				labelText={testHeadline}
				placeholderText={testHeadline}
				value={''}
				setSelected={setSelectedMock}
				options={options}
				testId={'test-select'}
			/>,
		);
	}

	const options = [
		{ text: '1', value: '01' },
		{ text: '2', value: '02' },
		{ text: '3', value: '03' },
		{ text: '4', value: '04' },
	];

	const setSelectedMock = vi.fn();

	it('should render headline twice', () => {
		renderDropDown();
		const headlines = screen.getAllByText(testHeadline);
		for (const headline of headlines) {
			expect(headline).toBeInTheDocument();
		}
	});

	it('should render all options', () => {
		renderDropDown();
		const renderedOptions: HTMLOptionElement[] =
			screen.getAllByTestId('dropdown-option');

		expect(renderedOptions.length).toBe(options.length);
		expect(renderedOptions[0].text).toBe(options[0].text);
		expect(renderedOptions[0].value).toBe(options[0].value);
		expect(renderedOptions[1].text).toBe(options[1].text);
		expect(renderedOptions[1].value).toBe(options[1].value);
		expect(renderedOptions[2].text).toBe(options[2].text);
		expect(renderedOptions[2].value).toBe(options[2].value);
		expect(renderedOptions[3].text).toBe(options[3].text);
		expect(renderedOptions[3].value).toBe(options[3].value);
	});

	it('should call setSelectedMock when option is selected', () => {
		renderDropDown();
		const select = screen.getByTestId(`test-select`);
		fireEvent.change(select, { target: { value: options[1].value } });
		expect(setSelectedMock).toHaveBeenCalledWith(options[1].value);
	});
});

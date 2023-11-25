import { render, screen, waitFor } from 'tests/test-utils';

import { EntityNameInput } from '@/components/entity-name-input';

const validateValue = (value: string) => value.length >= 3;

describe('EntityNameInput tests', () => {
	it('should render the component without errors', async () => {
		render(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={vi.fn()}
				value=""
			/>,
		);
		await waitFor(() => {
			expect(screen.getByTestId('entity-name-input')).toBeInTheDocument();
		});
	});

	it('should display an error message if the name is invalid', async () => {
		const invalidName = 'invalid name';
		const validateValue = (value: string) => value !== invalidName;
		const { rerender } = render(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={validateValue}
				value=""
			/>,
		);

		rerender(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={validateValue}
				value={invalidName}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId('invalid-name-message'),
			).toBeInTheDocument();
		});
		expect(screen.getByTestId('label-help-text')).toBeInTheDocument();
	});

	it('should display an error message if the length of the name is too short', () => {
		const { rerender } = render(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={validateValue}
				value=""
			/>,
		);

		rerender(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={validateValue}
				value="ab"
			/>,
		);

		expect(
			screen.getByTestId('invalid-length-message'),
		).toBeInTheDocument();
		expect(screen.getByTestId('label-help-text')).toBeInTheDocument();
	});

	it('should not display the alt help text if the name is valid', () => {
		render(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={() => true}
				value="abcd"
			/>,
		);

		expect(screen.queryByTestId('label-help-text')).not.toBeInTheDocument();
	});

	it('should display a message placeholder when the name is valid', () => {
		render(
			<EntityNameInput
				dataTestId="entity-name-input"
				isLoading={false}
				setIsValid={vi.fn()}
				setValue={vi.fn()}
				validateValue={() => true}
				value="abcd"
			/>,
		);

		expect(
			screen.getByTestId('name-message-placeholder'),
		).toBeInTheDocument();
	});
});

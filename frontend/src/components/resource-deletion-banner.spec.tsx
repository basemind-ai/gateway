import { fireEvent, render, screen } from 'tests/test-utils';

import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';

describe('ResourceDeletionBanner tests', () => {
	const props = {
		description: 'description',
		onCancel: vi.fn(),
		onConfirm: vi.fn(),
		placeholder: 'placeholder',
		resourceName: 'important',
		title: 'title',
	};

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders banner', () => {
		render(<ResourceDeletionBanner {...props} />);

		const title = screen.getByTestId('resource-deletion-title');
		expect(title).toBeInTheDocument();
		expect(title.innerHTML).toBe(props.title);

		const description = screen.getByTestId('resource-deletion-description');
		expect(description).toBeInTheDocument();
		expect(description.innerHTML).toBe(props.description);

		const resourceName = screen.getByTestId(
			'resource-deletion-resource-name',
		);
		expect(resourceName).toBeInTheDocument();
		expect(resourceName.innerHTML).toContain(props.resourceName);
	});

	it('can cancel the form', () => {
		render(<ResourceDeletionBanner {...props} />);

		const cancelButton = screen.getByTestId('resource-deletion-cancel-btn');
		expect(cancelButton).toBeInTheDocument();

		fireEvent.click(cancelButton);

		expect(props.onCancel).toHaveBeenCalledOnce();
	});

	it('does not allow submitting until resource name is entered correctly', () => {
		render(<ResourceDeletionBanner {...props} />);

		const input = screen.getByTestId('resource-deletion-input');
		fireEvent.change(input, {
			target: { value: `${props.resourceName}_` },
		});

		const deleteBtn = screen.getByTestId('resource-deletion-delete-btn');
		fireEvent.click(deleteBtn);

		expect(props.onConfirm).not.toHaveBeenCalledOnce();
	});

	it('allows submitting when resource name is entered correctly', () => {
		render(<ResourceDeletionBanner {...props} />);

		const input = screen.getByTestId('resource-deletion-input');
		fireEvent.change(input, {
			target: { value: props.resourceName },
		});

		const deleteBtn = screen.getByTestId('resource-deletion-delete-btn');
		fireEvent.click(deleteBtn);

		expect(props.onConfirm).toHaveBeenCalledOnce();
	});

	it('shows error message when error message is passed', () => {
		const errorMessage = 'error message';
		render(
			<ResourceDeletionBanner {...props} errorMessage={errorMessage} />,
		);

		const error = screen.getByText(errorMessage);
		expect(error).toBeInTheDocument();
	});
});

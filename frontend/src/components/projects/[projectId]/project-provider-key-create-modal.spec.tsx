import { faker } from '@faker-js/faker';
import en from 'public/messages/en.json';
import { ProviderKeyFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';

import { ProjectProviderKeyCreateModal } from '@/components/projects/[projectId]/project-provider-key-create-modal';
import { ApiError } from '@/errors';
import { ToastMessage, useToasts } from '@/stores/toast-store';
import { ModelVendor } from '@/types';

describe('ProviderKeyCreateModal', () => {
	const locales = en.providerKeys as Record<string, string>;
	const projectId = faker.string.uuid();

	it("should submit a valid form when the user clicks the 'Create' button", async () => {
		const providerKey = await ProviderKeyFactory.build({
			modelVendor: ModelVendor.OpenAI,
		});
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKey),
			ok: true,
		});

		const addProviderKey = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProjectProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				addProviderKey={addProviderKey}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const vendorSelect = screen.getByTestId('vendor-select');
		const keyValueTextarea = screen.getByTestId('key-value-textarea');
		const submitButton = screen.getByTestId(
			'create-provider-key-submit-btn',
		);

		expect(vendorSelect).toBeInTheDocument();
		expect(keyValueTextarea).toBeInTheDocument();
		expect(submitButton).toBeInTheDocument();
		expect(submitButton).toBeDisabled();

		fireEvent.change(keyValueTextarea, { target: { value: 'abc123' } });
		fireEvent.change(vendorSelect, {
			target: { value: ModelVendor.OpenAI },
		});

		expect(submitButton).not.toBeDisabled();

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
		expect(addProviderKey).toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalled();
	});

	it('should close the modal when cancel is pressed', () => {
		const addProviderKey = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProjectProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				addProviderKey={addProviderKey}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const cancelBtn = screen.getByTestId('create-provider-key-cancel-btn');
		expect(cancelBtn).toBeInTheDocument();

		fireEvent.click(cancelBtn);

		expect(closeModal).toHaveBeenCalled();
	});

	it('should show an error message if the server responds with an error', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () =>
				Promise.reject(
					new ApiError('failed', {
						context: {},
						statusCode: 500,
						statusText: 'failed',
					}),
				),
			ok: false,
		});

		const { result } = renderHook(useToasts);
		const toastsLength = result.current.length;

		const addProviderKey = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProjectProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				addProviderKey={addProviderKey}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const vendorSelect = screen.getByTestId('vendor-select');
		const keyValueTextarea = screen.getByTestId('key-value-textarea');
		const submitButton = screen.getByTestId(
			'create-provider-key-submit-btn',
		);

		expect(vendorSelect).toBeInTheDocument();
		expect(keyValueTextarea).toBeInTheDocument();
		expect(submitButton).toBeInTheDocument();
		expect(submitButton).toBeDisabled();

		fireEvent.change(keyValueTextarea, { target: { value: 'abc123' } });
		fireEvent.change(vendorSelect, {
			target: { value: ModelVendor.OpenAI },
		});

		expect(submitButton).not.toBeDisabled();

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
		expect(result.current as any[]).toHaveLength(toastsLength + 1);
		expect((result.current[toastsLength] as ToastMessage).type).toBe(
			'alert-error',
		);
		expect(addProviderKey).not.toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalled();
	});

	it('should render the modal with the correct title and form inputs', () => {
		render(
			<ProjectProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				addProviderKey={vi.fn()}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const modalTitle = screen.getByTestId(
			'create-provider-key-modal-title',
		);
		const vendorSelect = screen.getByTestId('vendor-select');
		const keyValueTextarea = screen.getByTestId('key-value-textarea');

		expect(modalTitle).toBeInTheDocument();
		expect(modalTitle).toHaveTextContent(locales.createProviderKey);
		expect(vendorSelect).toBeInTheDocument();
		expect(screen.getByText(locales.modelVendor)).toBeInTheDocument();
		expect(keyValueTextarea).toBeInTheDocument();
		expect(screen.getByText(locales.keyValue)).toBeInTheDocument();
	});

	it('should allow the user to select a model vendor from a dropdown list', () => {
		render(
			<ProjectProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				addProviderKey={vi.fn()}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const vendorSelect: HTMLSelectElement =
			screen.getByTestId('vendor-select');

		expect(vendorSelect).toBeInTheDocument();

		fireEvent.change(vendorSelect, {
			target: { value: ModelVendor.OpenAI },
		});
		expect(vendorSelect.value).toBe(ModelVendor.OpenAI);
	});

	it('should allow the user to input a key value in a textarea', () => {
		render(
			<ProjectProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				addProviderKey={vi.fn()}
				vendors={Object.values(ModelVendor)}
			/>,
		);

		const keyValueTextarea: HTMLTextAreaElement =
			screen.getByTestId('key-value-textarea');

		expect(keyValueTextarea).toBeInTheDocument();

		fireEvent.change(keyValueTextarea, { target: { value: 'abc123' } });
		expect(keyValueTextarea.value).toBe('abc123');
	});
});

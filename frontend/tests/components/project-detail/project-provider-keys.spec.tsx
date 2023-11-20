import { faker } from '@faker-js/faker';
import en from 'public/messages/en.json';
import { wait } from 'shared/time';
import { ProviderKeyFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { expect } from 'vitest';

import {
	ProjectProviderKeys,
	ProviderKeyCreateModal,
} from '@/components/projects/[projectId]/project-provider-keys';
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

		const setProviderKeys = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				setProviderKeys={setProviderKeys}
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
		expect(setProviderKeys).toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalled();
	});

	it('should close the modal when cancel is pressed', () => {
		const setProviderKeys = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				setProviderKeys={setProviderKeys}
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
			json: () => Promise.reject('error'),
			ok: false,
		});

		const { result } = renderHook(useToasts);
		const toastsLength = result.current.length;

		const setProviderKeys = vi.fn();
		const closeModal = vi.fn();

		render(
			<ProviderKeyCreateModal
				closeModal={closeModal}
				projectId={projectId}
				setProviderKeys={setProviderKeys}
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
		expect(setProviderKeys).not.toHaveBeenCalled();
		expect(closeModal).toHaveBeenCalled();
	});

	it('should render the modal with the correct title and form inputs', () => {
		render(
			<ProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				setProviderKeys={vi.fn()}
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
			<ProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				setProviderKeys={vi.fn()}
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
			<ProviderKeyCreateModal
				closeModal={vi.fn()}
				projectId={projectId}
				setProviderKeys={vi.fn()}
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

describe('ProjectProviderKeys', () => {
	const projectId = faker.string.uuid();
	const providerKeys = ProviderKeyFactory.batchSync(2).map((v, i) => {
		v.modelVendor = i % 2 === 0 ? ModelVendor.OpenAI : ModelVendor.Cohere;
		return v;
	});

	it("retrieves the project's provider keys and displays them in the table", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});

		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const rows = screen.getAllByTestId('provider-keys-table-row');
		expect(rows).toHaveLength(providerKeys.length);

		const vendorCells = screen.getAllByTestId('key-provider-name');
		expect(vendorCells).toHaveLength(providerKeys.length);
		expect(vendorCells[0]).toHaveTextContent(providerKeys[0].modelVendor);
		expect(vendorCells[1]).toHaveTextContent(providerKeys[1].modelVendor);

		const createdAtCells = screen.getAllByTestId('key-created-at');
		expect(createdAtCells).toHaveLength(providerKeys.length);
		expect(createdAtCells[0]).toHaveTextContent(providerKeys[0].createdAt);
		expect(createdAtCells[1]).toHaveTextContent(providerKeys[1].createdAt);
	});

	it('shows an error if swr fetch fails', async () => {
		const { result } = renderHook(useToasts);
		const toastsLength = result.current.length;

		mockFetch.mockResolvedValueOnce({
			json: () => Promise.reject('error'),
			ok: false,
		});

		render(<ProjectProviderKeys projectId={projectId} />);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
		expect(result.current as any[]).toHaveLength(toastsLength + 1);
		expect((result.current[toastsLength] as ToastMessage).type).toBe(
			'alert-error',
		);
	});

	it('allows for creating a new key if there is at least one provider without a key', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([providerKeys[0]]),
			ok: true,
		});
		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const btn = screen.getByTestId('new-provider-key-btn');
		expect(btn).toBeInTheDocument();
		expect(btn).toBeEnabled();

		fireEvent.click(btn);

		const modal = screen.getByTestId('create-provider-key-modal');
		expect(modal).toBeInTheDocument();
	});

	it('closes the create modal when cancel is pressed', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve([providerKeys[0]]),
			ok: true,
		});
		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const btn = screen.getByTestId('new-provider-key-btn');
		expect(btn).toBeInTheDocument();
		expect(btn).toBeEnabled();

		fireEvent.click(btn);

		const modal = screen.getByTestId('create-provider-key-modal');
		expect(modal).toBeInTheDocument();

		const cancelBtn = screen.getByTestId('create-provider-key-cancel-btn');
		expect(cancelBtn).toBeInTheDocument();

		mockFetch.mockReset();

		fireEvent.click(cancelBtn);

		await wait(100);

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('disables the create new key if all providers have keys', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});
		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const btn = screen.getByTestId('new-provider-key-btn');
		expect(btn).toBeInTheDocument();
		expect(btn).toBeDisabled();
	});

	it('allows the user to delete a provider key', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});

		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const rows = screen.getAllByTestId('provider-keys-table-row');
		expect(rows).toHaveLength(providerKeys.length);

		const actions = screen.getAllByTestId('key-actions');
		expect(actions).toHaveLength(providerKeys.length);

		const deleteButtons = screen.getAllByTestId(
			'delete-provider-key-button',
		);
		expect(deleteButtons).toHaveLength(providerKeys.length);

		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(undefined),
			ok: true,
		});

		fireEvent.click(deleteButtons[0]);

		const resourceDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		expect(resourceDeleteBtn).toBeInTheDocument();

		fireEvent.click(resourceDeleteBtn);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});
	});

	it('closes the delete modal without taking actions when pressing cancel', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});

		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const rows = screen.getAllByTestId('provider-keys-table-row');
		expect(rows).toHaveLength(providerKeys.length);

		const actions = screen.getAllByTestId('key-actions');
		expect(actions).toHaveLength(providerKeys.length);

		const deleteButtons = screen.getAllByTestId(
			'delete-provider-key-button',
		);
		expect(deleteButtons).toHaveLength(providerKeys.length);

		mockFetch.mockReset();

		fireEvent.click(deleteButtons[0]);

		const resourceDeleteBtn = screen.getByTestId(
			'resource-deletion-cancel-btn',
		);
		expect(resourceDeleteBtn).toBeInTheDocument();

		fireEvent.click(resourceDeleteBtn);

		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('shows err when deleting provider key fails', async () => {
		const { result } = renderHook(useToasts);
		const toastsLength = result.current.length;

		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});

		render(<ProjectProviderKeys projectId={projectId} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const rows = screen.getAllByTestId('provider-keys-table-row');
		expect(rows).toHaveLength(providerKeys.length);

		const actions = screen.getAllByTestId('key-actions');
		expect(actions).toHaveLength(providerKeys.length);

		const deleteButtons = screen.getAllByTestId(
			'delete-provider-key-button',
		);
		expect(deleteButtons).toHaveLength(providerKeys.length);

		mockFetch.mockResolvedValueOnce({
			json: () => Promise.reject(new Error()),
			ok: false,
		});

		fireEvent.click(deleteButtons[0]);

		const resourceDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		expect(resourceDeleteBtn).toBeInTheDocument();

		fireEvent.click(resourceDeleteBtn);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalled();
		});

		expect(result.current as any[]).toHaveLength(toastsLength + 1);
		expect((result.current[toastsLength] as ToastMessage).type).toBe(
			'alert-error',
		);
	});
});

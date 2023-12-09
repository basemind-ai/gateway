import { wait } from 'shared/time';
import { ProjectFactory, ProviderKeyFactory } from 'tests/factories';
import { mockFetch } from 'tests/mocks';
import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from 'tests/test-utils';
import { expect, MockInstance } from 'vitest';

import { ProjectProviderKeys } from '@/components/projects/[projectId]/project-provider-keys';
import { modelVendorToLocaleMap } from '@/constants/models';
import { ApiError } from '@/errors';
import * as useTrackPagePackage from '@/hooks/use-track-page';
import { ToastMessage, useToasts } from '@/stores/toast-store';
import { ModelVendor } from '@/types';

describe('ProjectProviderKeys', () => {
	const project = ProjectFactory.buildSync();
	const providerKeys = ProviderKeyFactory.batchSync(2).map((v, i) => {
		v.modelVendor = i % 2 === 0 ? ModelVendor.OpenAI : ModelVendor.Cohere;
		return v;
	});
	let useTrackPageSpy: MockInstance;

	beforeEach(() => {
		useTrackPageSpy = vi.spyOn(useTrackPagePackage, 'useTrackPage');
	});

	it("retrieves the project's provider keys and displays them in the table", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});

		render(<ProjectProviderKeys project={project} />);

		const loader = screen.getByTestId('loader');
		expect(loader).toBeInTheDocument();

		await wait(100);

		const rows = screen.getAllByTestId('provider-keys-table-row');
		expect(rows).toHaveLength(providerKeys.length);

		const vendorCells = screen.getAllByTestId('key-provider-name');
		expect(vendorCells).toHaveLength(providerKeys.length);
		expect(vendorCells[0]).toHaveTextContent(
			modelVendorToLocaleMap[providerKeys[0].modelVendor],
		);
		expect(vendorCells[1]).toHaveTextContent(
			modelVendorToLocaleMap[providerKeys[1].modelVendor],
		);

		const createdAtCells = screen.getAllByTestId('key-created-at');
		expect(createdAtCells).toHaveLength(providerKeys.length);
		expect(createdAtCells[0]).toHaveTextContent(providerKeys[0].createdAt);
		expect(createdAtCells[1]).toHaveTextContent(providerKeys[1].createdAt);
	});

	it('shows an error if swr fetch fails', async () => {
		const { result } = renderHook(useToasts);
		const toastsLength = result.current.length;

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

		render(<ProjectProviderKeys project={project} />);

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
		render(<ProjectProviderKeys project={project} />);

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
		render(<ProjectProviderKeys project={project} />);

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
		render(<ProjectProviderKeys project={project} />);

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

		render(<ProjectProviderKeys project={project} />);

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

		render(<ProjectProviderKeys project={project} />);

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

		render(<ProjectProviderKeys project={project} />);

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

	it('calls useTrackingPage with project-provider-keys', async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve(providerKeys),
			ok: true,
		});
		render(<ProjectProviderKeys project={project} />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith(
				'project-provider-keys',
			);
		});
	});
});

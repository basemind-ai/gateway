import { faker } from '@faker-js/faker';
import { APIKeyFactory, ApplicationFactory } from 'tests/factories';
import { mockReady, mockTrack } from 'tests/mocks';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { it } from 'vitest';

import * as APIKeysAPI from '@/api/api-keys-api';
import { ApplicationApiKeys } from '@/components/projects/[projectId]/applications/[applicationId]/application-api-keys';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

describe('API Keys tests', () => {
	const handleRetrieveAPIKeysSpy = vi.spyOn(
		APIKeysAPI,
		'handleRetrieveAPIKeys',
	);
	const handleCreateAPIKeySpy = vi.spyOn(APIKeysAPI, 'handleCreateAPIKey');
	const projectId = faker.string.uuid();
	const application = ApplicationFactory.buildSync();

	it('renders api keys component', async () => {
		const apiKeys = await APIKeyFactory.batch(2);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(apiKeys);
		render(
			<ApplicationApiKeys
				projectId={projectId}
				application={application}
			/>,
		);

		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(2);
		});

		const apiKeyNameRows = screen.getAllByTestId('api-key-name');
		expect(apiKeyNameRows[0]).toHaveTextContent(apiKeys[0].name);
	});

	it('deletes a apiKey', async () => {
		const apiKeys = await APIKeyFactory.batch(2);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(apiKeys);
		render(
			<ApplicationApiKeys
				projectId={projectId}
				application={application}
			/>,
		);

		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(2);
		});

		const [apiKeyDeleteBtn] = screen.getAllByTestId('api-key-delete-btn');
		fireEvent.click(apiKeyDeleteBtn);

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: apiKeys[0].name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce([apiKeys[1]]);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(1);
		});
	});

	it('shows error when unable to delete api key', async () => {
		const apiKeys = await APIKeyFactory.batch(2);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(apiKeys);
		render(
			<ApplicationApiKeys
				projectId={projectId}
				application={application}
			/>,
		);

		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(2);
		});

		const [apiKeyDeleteBtn] = screen.getAllByTestId('api-key-delete-btn');
		fireEvent.click(apiKeyDeleteBtn);

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: apiKeys[0].name },
		});

		handleRetrieveAPIKeysSpy.mockImplementationOnce(() => {
			throw new ApiError('could not delete api key', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);

		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			const errorToast = screen.getByText('could not delete api key');
			expect(errorToast.className).toContain(ToastType.ERROR);
		});
	});

	it('creates a apiKey', async () => {
		const apiKeys = await APIKeyFactory.batch(2);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(apiKeys);
		render(
			<ApplicationApiKeys
				projectId={projectId}
				application={application}
			/>,
		);

		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(2);
		});

		const apiKeyCreateBtn = screen.getByTestId('api-key-create-btn');
		fireEvent.click(apiKeyCreateBtn);

		const apiKeyNameInput = screen.getByTestId('create-api-key-input');
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New apiKey' },
		});

		const submitBtn = screen.getByTestId('create-api-key-submit-btn');
		const apiKey = { ...(await APIKeyFactory.build()), hash: 'randomHash' };
		apiKeys.push(apiKey);
		handleCreateAPIKeySpy.mockResolvedValueOnce(apiKey);
		fireEvent.click(submitBtn);

		await waitFor(() => {
			const hashInput = screen.getByTestId('create-api-key-hash-input');
			expect(hashInput).toBeInTheDocument();
		});

		handleRetrieveAPIKeysSpy.mockResolvedValueOnce([...apiKeys]);
		const closeBtn = screen.getByTestId('create-api-key-close-btn');
		fireEvent.click(closeBtn);

		await waitFor(() => {
			const newAPIKey = screen.getByText(apiKey.name);
			expect(newAPIKey).toBeInTheDocument();
		});
	});

	it('calls trck when creating a apiKey', async () => {
		const apiKeys = await APIKeyFactory.batch(2);
		handleRetrieveAPIKeysSpy.mockResolvedValueOnce(apiKeys);
		render(
			<ApplicationApiKeys
				projectId={projectId}
				application={application}
			/>,
		);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			const apiKeyRows = screen.getAllByTestId('api-key-row');
			expect(apiKeyRows).toHaveLength(2);
		});

		const apiKeyCreateBtn = screen.getByTestId('api-key-create-btn');
		fireEvent.click(apiKeyCreateBtn);

		const apiKeyNameInput = screen.getByTestId('create-api-key-input');
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New apiKey' },
		});

		const submitBtn = screen.getByTestId('create-api-key-submit-btn');
		const apiKey = { ...(await APIKeyFactory.build()), hash: 'randomHash' };
		apiKeys.push(apiKey);
		handleCreateAPIKeySpy.mockResolvedValueOnce(apiKey);
		fireEvent.click(submitBtn);
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				'addAppKey',
				expect.any(Object),
			);
		});
	});
});

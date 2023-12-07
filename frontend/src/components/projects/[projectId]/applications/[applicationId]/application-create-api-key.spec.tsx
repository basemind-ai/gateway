import { APIKeyFactory } from 'tests/factories';
import { fireEvent, render, screen, waitFor } from 'tests/test-utils';
import { expect } from 'vitest';

import * as APIKeyAPI from '@/api/api-keys-api';
import { CreateApplicationAPIKeyModal } from '@/components/projects/[projectId]/applications/[applicationId]/application-create-api-key';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';

describe('CreateApiKey tests', () => {
	const handleCreateAPIKeySpy = vi.spyOn(APIKeyAPI, 'handleCreateAPIKey');
	const projectId = '1';
	const applicationId = '1';
	const onSubmit = vi.fn();
	const onCancel = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders create api keys component', () => {
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const title = screen.getByTestId('create-api-key-title');
		expect(title).toBeInTheDocument();

		const nameInput = screen.getByTestId('create-api-key-input');
		expect(nameInput).toBeInTheDocument();
	});

	it('enabled submit only on valid API key name', () => {
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-api-key-submit-btn',
		);
		expect(submitButton.disabled).toBe(true);

		const apiKeyNameInput = screen.getByTestId('create-api-key-input');

		fireEvent.change(apiKeyNameInput, {
			target: { value: 'i' },
		});
		expect(submitButton.disabled).toBe(true);

		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New APIKey' },
		});
		expect(submitButton.disabled).toBe(false);
	});

	it('calls cancel callback when cancel is clicked', () => {
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const closeButton = screen.getByTestId<HTMLButtonElement>(
			'create-api-key-close-btn',
		);
		fireEvent.click(closeButton);
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('creates a apiKey and calls on submit call when closed', async () => {
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const apiKeyNameInput = screen.getByTestId('create-api-key-input');
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New APIKey' },
		});

		const apiKey = { ...(await APIKeyFactory.build()), hash: 'randomHash' };
		handleCreateAPIKeySpy.mockResolvedValueOnce(apiKey);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-api-key-submit-btn',
		);
		fireEvent.click(submitButton);
		fireEvent.click(submitButton);

		await waitFor(() => {
			const hashInput = screen.getByTestId('create-api-key-hash-input');
			expect(hashInput).toBeInTheDocument();
		});

		const closeBtn = screen.getByTestId('create-api-key-close-btn');
		fireEvent.click(closeBtn);
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it('shows an error when unable to create API key', async () => {
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const apiKeyNameInput = screen.getByTestId('create-api-key-input');
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New APIKey' },
		});

		handleCreateAPIKeySpy.mockImplementationOnce(() => {
			throw new ApiError('unable to create an API key', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-api-key-submit-btn',
		);
		fireEvent.click(submitButton);

		const errorToast = screen.getByText('unable to create an API key');
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('shows api key created dialog if provided api key as an initializer', async () => {
		const hash = 'random_hash';
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
				initialAPIKeyHash={hash}
			/>,
		);

		const hashInput = screen.getByTestId<HTMLInputElement>(
			'create-api-key-hash-input',
		);
		expect(hashInput).toBeInTheDocument();
		expect(hashInput.value).toBe(hash);

		fireEvent.change(hashInput, {
			target: { value: '' },
		});

		expect(hashInput.value).toBe(hash);
	});

	it('copies API key to clipboard', async () => {
		const hash = 'random_hash';
		render(
			<CreateApplicationAPIKeyModal
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
				initialAPIKeyHash={hash}
			/>,
		);

		const writeText = vi.fn();
		Object.assign(navigator, {
			clipboard: {
				writeText,
			},
		});

		const copyButton = screen.getByTestId('api-key-copy-btn');
		fireEvent.click(copyButton);
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(hash);
	});
});

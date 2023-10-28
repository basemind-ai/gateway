import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { APIKeyFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';

import * as APIKeyAPI from '@/api/api-keys-api';
import { CreateApiKey } from '@/app/projects/[projectId]/applications/[applicationId]/page';

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
			<CreateApiKey
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
			<CreateApiKey
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
		// Invalid name
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'i' },
		});
		expect(submitButton.disabled).toBe(true);

		// valid name
		fireEvent.change(apiKeyNameInput, {
			target: { value: 'New APIKey' },
		});
		expect(submitButton.disabled).toBe(false);
	});

	it('calls cancel callback when cancel is clicked', () => {
		render(
			<CreateApiKey
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
			<CreateApiKey
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

		await waitFor(() => {
			const hashInput = screen.getByTestId('create-api-key-hash-input');
			expect(hashInput).toBeInTheDocument();
		});

		const closeBtn = screen.getByTestId('create-api-key-close-btn');
		fireEvent.click(closeBtn);
		expect(onSubmit).toHaveBeenCalledOnce();
	});
});
